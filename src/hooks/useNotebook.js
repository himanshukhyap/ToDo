import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

/* ── Notebooks ─────────────────────────────────────── */
export function useNotebooks() {
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(
      collection(db, "notebooks"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(
      q,
      snap => { setNotebooks(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      err  => { console.error("[Notebooks] error:", err.code, err.message); setLoading(false); }
    );
  }, [user]);

  const add = (name, color) =>
    addDoc(collection(db, "notebooks"), {
      name: name.trim(), color: color || "#6366f1",
      uid: user.uid, createdAt: serverTimestamp(),
    });

  const update = (id, name, color) =>
    updateDoc(doc(db, "notebooks", id), { name: name.trim(), color });

  const remove = async (id) => {
    console.log("[Notebooks] Deleting:", id);
    try {
      await deleteDoc(doc(db, "notebooks", id));
      console.log("[Notebooks] Deleted:", id);
    } catch (e) {
      console.error("[Notebooks] deleteDoc error:", e.code, e.message);
      throw e;
    }
  };

  return { notebooks, loading, add, update, remove };
}

/* ── Sections ──────────────────────────────────────── */
export function useSections(notebookId) {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user || !notebookId) { setSections([]); setLoading(false); return; }
    const q = query(
      collection(db, "nb_sections"),
      where("uid",        "==", user.uid),
      where("notebookId", "==", notebookId),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(
      q,
      snap => { setSections(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      err  => { console.error("[Sections] error:", err.code, err.message); setLoading(false); }
    );
  }, [user, notebookId]);

  const add = (name, color) =>
    addDoc(collection(db, "nb_sections"), {
      name: name.trim(), color: color || "#6366f1",
      notebookId, uid: user.uid, createdAt: serverTimestamp(),
    });

  const update = (id, name, color) =>
    updateDoc(doc(db, "nb_sections", id), { name: name.trim(), color });

  const remove = async (id) => {
    console.log("[Sections] Deleting:", id);
    try {
      await deleteDoc(doc(db, "nb_sections", id));
      console.log("[Sections] Deleted:", id);
    } catch (e) {
      console.error("[Sections] deleteDoc error:", e.code, e.message);
      throw e;
    }
  };

  return { sections, loading, add, update, remove };
}

/* ── Pages ─────────────────────────────────────────── */
export function usePages(sectionId) {
  const { user } = useAuth();
  const [pages,   setPages]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !sectionId) { setPages([]); setLoading(false); return; }
    const q = query(
      collection(db, "nb_pages"),
      where("uid",       "==", user.uid),
      where("sectionId", "==", sectionId),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(
      q,
      snap => { setPages(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      err  => { console.error("[Pages] error:", err.code, err.message); setLoading(false); }
    );
  }, [user, sectionId]);

  const add = (title, sectionId, notebookId) =>
    addDoc(collection(db, "nb_pages"), {
      title: title || "Untitled Page",
      htmlContent: "", textContent: "",
      sectionId, notebookId, uid: user.uid,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });

  const update = (id, htmlContent, textContent, title) =>
    updateDoc(doc(db, "nb_pages", id), {
      htmlContent, textContent,
      title: title || "Untitled Page",
      updatedAt: serverTimestamp(),
    });

  const updateTitle = (id, title) =>
    updateDoc(doc(db, "nb_pages", id), {
      title: title || "Untitled Page",
      updatedAt: serverTimestamp(),
    });

  const remove = async (id) => {
    console.log("[Pages] Deleting:", id);
    try {
      await deleteDoc(doc(db, "nb_pages", id));
      console.log("[Pages] Deleted:", id);
    } catch (e) {
      console.error("[Pages] deleteDoc error:", e.code, e.message);
      throw e;
    }
  };

  return { pages, loading, add, update, updateTitle, remove };
}
