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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(
      collection(db, "categories"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Failed to load categories.");
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  const addCategory = async (name, color) => {
    if (!name.trim()) return;
    await addDoc(collection(db, "categories"), {
      name: name.trim(),
      color: color || "#6366f1",
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const updateCategory = async (id, name, color) => {
    await updateDoc(doc(db, "categories", id), { name: name.trim(), color });
  };

  const deleteCategory = async (id) => {
    await deleteDoc(doc(db, "categories", id));
  };

  return { categories, loading, error, addCategory, updateCategory, deleteCategory };
}
