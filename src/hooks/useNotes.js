import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { isOnline } from "../services/syncService";
import {
  saveNoteOffline,
  getNotesOffline,
  deleteNoteOffline,
  updateNoteOffline,
  queueOperation,
} from "../services/offlineService";

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useNotes() {
  const { user } = useAuth();
  const [notes,   setNotes]  = useState([]);
  const [loading, setLoad]   = useState(true);
  const [error,   setError]  = useState(null);

  useEffect(() => {
    if (!user) { setLoad(false); return; }
    setLoad(true);
    const q = query(
      collection(db, "notes"),
      where("uid", "==", user.uid),
      orderBy("updatedAt", "desc")
    );
    return onSnapshot(
      q,
      snap => {
        setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoad(false);
        setError(null);
      },
      err => {
        console.error("[Notes] onSnapshot error:", err.code, err.message);
        // If offline or error, load from offline storage
        if (!isOnline() || err.code === 'unavailable') {
          console.log("[Notes] Loading from offline storage");
          getNotesOffline(user.uid)
            .then(offlineNotes => {
              setNotes(offlineNotes);
              setError("Offline - showing local data");
              setLoad(false);
            })
            .catch(offlineErr => {
              console.error("[Notes] Offline load error:", offlineErr);
              setError(`Failed to load notes: ${err.message}`);
              setLoad(false);
            });
        } else {
          setError(`Failed to load notes: ${err.message}`);
          setLoad(false);
        }
      }
    );
  }, [user]);

  const addNote = async (htmlContent, textContent, color) => {
    if (!textContent?.trim()) return;
    
    const noteData = {
      htmlContent,
      textContent: textContent.trim(),
      color: color || "#334155",
      uid: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      if (isOnline()) {
        // Add to Firebase
        await addDoc(collection(db, "notes"), {
          ...noteData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Offline: save locally and queue for sync
        const id = 'local_' + genId();
        await saveNoteOffline({ id, ...noteData });
        await queueOperation(user.uid, 'add_note', noteData);
        console.log("[Notes] Added offline, queued for sync");
      }
    } catch (e) {
      console.error("[Notes] addNote error:", e.code, e.message);
      // Fallback: still try to save offline
      try {
        const id = 'local_' + genId();
        await saveNoteOffline({ id, ...noteData });
        await queueOperation(user.uid, 'add_note', noteData);
      } catch (offlineErr) {
        console.error("[Notes] Offline save failed:", offlineErr);
      }
      setError(`Add failed: ${e.message}`);
      throw e;
    }
  };

  const updateNote = async (id, htmlContent, textContent, color) => {
    const updateData = {
      htmlContent,
      textContent: textContent.trim(),
      color: color || "#334155",
      updatedAt: new Date(),
    };
    
    try {
      if (isOnline()) {
        // Update Firebase
        await updateDoc(doc(db, "notes", id), {
          ...updateData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Offline: update locally and queue for sync
        await updateNoteOffline(id, updateData);
        await queueOperation(user.uid, 'update_note', { id, ...updateData });
        console.log("[Notes] Updated offline, queued for sync");
      }
    } catch (e) {
      console.error("[Notes] updateNote error:", e.code, e.message);
      // Fallback: try offline
      try {
        await updateNoteOffline(id, updateData);
        await queueOperation(user.uid, 'update_note', { id, ...updateData });
      } catch (offlineErr) {
        console.error("[Notes] Offline update failed:", offlineErr);
      }
      setError(`Update failed: ${e.message}`);
      throw e;
    }
  };

  const deleteNote = async (id) => {
    console.log("[Notes] Deleting note:", id);
    try {
      if (isOnline()) {
        await deleteDoc(doc(db, "notes", id));
      } else {
        await deleteNoteOffline(id);
        await queueOperation(user.uid, 'delete_note', { id });
        console.log("[Notes] Deleted offline, queued for sync");
      }
      console.log("[Notes] Deleted successfully:", id);
    } catch (e) {
      console.error("[Notes] deleteNote error:", e.code, e.message);
      // Fallback: try offline delete
      try {
        await deleteNoteOffline(id);
        await queueOperation(user.uid, 'delete_note', { id });
      } catch (offlineErr) {
        console.error("[Notes] Offline delete failed:", offlineErr);
      }
      setError(`Delete failed: ${e.message} — Check Firestore rules are deployed.`);
      throw e;
    }
  };

  return { notes, loading, error, addNote, updateNote, deleteNote };
}
