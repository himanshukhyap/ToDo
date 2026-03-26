import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!user) { setLoad(false); return; }
    setLoad(true);
    const q = query(collection(db, "notes"), where("uid","==",user.uid), orderBy("updatedAt","desc"));
    return onSnapshot(q,
      snap => { setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoad(false); setError(null); },
      err  => { setError("Failed to load notes. Check Firestore rules."); setLoad(false); }
    );
  }, [user]);

  const addNote = async (htmlContent, textContent, color) => {
    if (!textContent?.trim()) return;
    try {
      await addDoc(collection(db, "notes"), {
        htmlContent, textContent: textContent.trim(),
        color: color || "#334155",
        uid: user.uid,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
    } catch(e) { setError("Failed to add note: " + e.message); throw e; }
  };

  const updateNote = async (id, htmlContent, textContent, color) => {
    try {
      await updateDoc(doc(db, "notes", id), {
        htmlContent, textContent: textContent.trim(),
        color: color || "#334155",
        updatedAt: serverTimestamp(),
      });
    } catch(e) { setError("Failed to update note: " + e.message); throw e; }
  };

  const deleteNote = async (id) => {
    try { await deleteDoc(doc(db, "notes", id)); }
    catch(e) { setError("Failed to delete note: " + e.message); throw e; }
  };

  return { notes, loading, error, addNote, updateNote, deleteNote };
}
