import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(
      collection(db, "categories"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(
      q,
      snap => {
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      err => {
        console.error("[Categories] onSnapshot error:", err.code, err.message);
        setError(`Failed to load categories: ${err.message}`);
        setLoading(false);
      }
    );
  }, [user]);

  const addCategory = async (name, color) => {
    if (!name.trim()) return;
    try {
      await addDoc(collection(db, "categories"), {
        name: name.trim(),
        color: color || "#6366f1",
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[Categories] addDoc error:", e.code, e.message);
      throw e;
    }
  };

  const updateCategory = async (id, name, color) => {
    try {
      await updateDoc(doc(db, "categories", id), { name: name.trim(), color });
    } catch (e) {
      console.error("[Categories] updateDoc error:", e.code, e.message);
      throw e;
    }
  };

  const deleteCategory = async (id) => {
    console.log("[Categories] Deleting:", id);
    try {
      await deleteDoc(doc(db, "categories", id));
      console.log("[Categories] Deleted successfully:", id);
    } catch (e) {
      console.error("[Categories] deleteDoc error:", e.code, e.message);
      setError(`Delete failed: ${e.message}`);
      throw e;
    }
  };

  return { categories, loading, error, addCategory, updateCategory, deleteCategory };
}
