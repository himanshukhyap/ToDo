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
    let isMounted = true;

    // Load offline data first so they're visible immediately
    const loadOfflineData = async () => {
      try {
        const offlineNotes = await getNotesOffline(user.uid);
        if (isMounted && offlineNotes.length > 0) {
          console.log("[Notes] Loaded offline data:", offlineNotes.length);
          setNotes(offlineNotes);
        }
      } catch (err) {
        console.error("[Notes] Failed to load offline data:", err);
      }
    };

    // Load offline data immediately
    loadOfflineData();

    // Then try to sync with Firebase
    const q = query(
      collection(db, "notes"),
      where("uid", "==", user.uid),
      orderBy("updatedAt", "desc")
    );
    
    const unsubscribe = onSnapshot(
      q,
      snap => {
        if (isMounted) {
          const notesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setNotes(notesData);
          setLoad(false);
          setError(null);
        }
      },
      err => {
        console.error("[Notes] onSnapshot error:", err.code, err.message);
        if (isMounted) {
          setLoad(false);
          if (!isOnline()) {
            setError(null); // Don't show error when offline
          } else {
            setError(`Connection error: ${err.message}`);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user]);

  const addNote = async (htmlContent, textContent, color) => {
    if (!textContent?.trim()) return;
    
    const id = 'local_' + genId();
    const noteData = {
      htmlContent,
      textContent: textContent.trim(),
      color: color || "#334155",
      uid: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      // Save locally first
      await saveNoteOffline({ id, ...noteData });
      
      // Update UI immediately
      setNotes(prev => [{ id, ...noteData }, ...prev]);
      
      // Try to sync to Firebase
      if (isOnline()) {
        try {
          const fbRef = await addDoc(collection(db, "notes"), {
            ...noteData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          console.log("[Notes] Synced to Firebase:", fbRef.id);
        } catch (fbErr) {
          // Failed to sync - queue for later
          await queueOperation(user.uid, 'add_note', noteData);
          console.log("[Notes] Firebase failed, queued:", fbErr.message);
        }
      } else {
        // Offline - queue for sync
        await queueOperation(user.uid, 'add_note', noteData);
        console.log("[Notes] Added offline, queued for sync");
      }
    } catch (e) {
      console.error("[Notes] addNote error:", e);
      setError(`Failed to save: ${e.message}`);
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
      // Update locally first
      await updateNoteOffline(id, updateData);
      
      // Update UI immediately
      setNotes(prev => prev.map(n => 
        n.id === id ? { ...n, ...updateData } : n
      ));

      // Try to sync to Firebase
      if (isOnline()) {
        try {
          await updateDoc(doc(db, "notes", id), {
            ...updateData,
            updatedAt: serverTimestamp(),
          });
          console.log("[Notes] Updated on Firebase:", id);
        } catch (fbErr) {
          // Failed to sync - queue for later
          await queueOperation(user.uid, 'update_note', { id, ...updateData });
          console.log("[Notes] Firebase failed, queued:", fbErr.message);
        }
      } else {
        // Offline - queue for sync
        await queueOperation(user.uid, 'update_note', { id, ...updateData });
        console.log("[Notes] Updated offline, queued for sync");
      }
    } catch (e) {
      console.error("[Notes] updateNote error:", e);
      setError(`Failed to update: ${e.message}`);
      throw e;
    }
  };

  const deleteNote = async (id) => {
    console.log("[Notes] Deleting note:", id);
    try {
      // Delete locally first
      await deleteNoteOffline(id);
      
      // Update UI immediately
      setNotes(prev => prev.filter(n => n.id !== id));

      // Try to sync deletion to Firebase
      if (isOnline()) {
        try {
          await deleteDoc(doc(db, "notes", id));
          console.log("[Notes] Deleted on Firebase:", id);
        } catch (fbErr) {
          // Failed to sync - queue for later
          await queueOperation(user.uid, 'delete_note', { id });
          console.log("[Notes] Firebase failed, queued:", fbErr.message);
        }
      } else {
        // Offline - queue for sync
        await queueOperation(user.uid, 'delete_note', { id });
        console.log("[Notes] Deleted offline, queued for sync");
      }
    } catch (e) {
      console.error("[Notes] deleteNote error:", e);
      setError(`Failed to delete: ${e.message}`);
      throw e;
    }
  };

  return { notes, loading, error, addNote, updateNote, deleteNote };
}
