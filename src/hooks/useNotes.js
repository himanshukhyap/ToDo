import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const q = query(
      collection(db, "notes"),
      where("uid", "==", user.uid),
      orderBy("updatedAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Notes error:", err);
        setError("Failed to load notes. Check Firestore rules.");
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  const addNote = async (content) => {
    if (!content.trim()) return;
    try {
      await addDoc(collection(db, "notes"), {
        content: content.trim(),
        uid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setError("Failed to add note: " + e.message);
      throw e;
    }
  };

  const updateNote = async (id, content) => {
    try {
      await updateDoc(doc(db, "notes", id), {
        content: content.trim(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setError("Failed to update note: " + e.message);
      throw e;
    }
  };

  const deleteNote = async (id) => {
    try {
      await deleteDoc(doc(db, "notes", id));
    } catch (e) {
      setError("Failed to delete note: " + e.message);
      throw e;
    }
  };

  return { notes, loading, error, addNote, updateNote, deleteNote };
}
