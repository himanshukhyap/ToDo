/**
 * useNotebook hooks
 *
 * Collection fields:
 *   notebooks   → notebookName, uid, createdAt
 *   nb_sections → sectionName, notebookId, uid, createdAt
 *   nb_pages    → pageName, htmlContent, textContent, sectionId, notebookId, uid, createdAt, updatedAt
 */
import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, getDocs,
  doc, query, where, orderBy, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

/* ════════════════════════════════════════════════════
   NOTEBOOKS
   ════════════════════════════════════════════════════ */
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
    return onSnapshot(q,
      snap => {
        setNotebooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => { console.error("[useNotebooks]", err.code, err.message); setLoading(false); }
    );
  }, [user]);

  /**
   * Create notebook + default section + default page
   * Returns { notebookId, sectionId, pageId }
   */
  const createNotebook = async (notebookName, color) => {
    // 1. Create notebook
    const nbRef = await addDoc(collection(db, "notebooks"), {
      notebookName: notebookName.trim(),
      color:        color || "#6366f1",
      uid:          user.uid,
      createdAt:    serverTimestamp(),
    });

    // 2. Create default section
    const secRef = await addDoc(collection(db, "nb_sections"), {
      sectionName: "Section 1",
      color:       color || "#6366f1",
      notebookId:  nbRef.id,
      uid:         user.uid,
      createdAt:   serverTimestamp(),
    });

    // 3. Create default page
    const pageRef = await addDoc(collection(db, "nb_pages"), {
      pageName:    "Page 1",
      htmlContent: "",
      textContent: "",
      sectionId:   secRef.id,
      notebookId:  nbRef.id,
      uid:         user.uid,
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    });

    return { notebookId: nbRef.id, sectionId: secRef.id, pageId: pageRef.id };
  };

  const renameNotebook = (id, notebookName, color) =>
    updateDoc(doc(db, "notebooks", id), {
      notebookName: notebookName.trim(),
      color,
    });

  return { notebooks, loading, createNotebook, renameNotebook };
}

/* ════════════════════════════════════════════════════
   SECTIONS
   ════════════════════════════════════════════════════ */
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
    return onSnapshot(q,
      snap => {
        setSections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => { console.error("[useSections]", err.code, err.message); setLoading(false); }
    );
  }, [user, notebookId]);

  /**
   * Create section + default page inside it
   */
  const createSection = async (sectionName, color) => {
    const secRef = await addDoc(collection(db, "nb_sections"), {
      sectionName: sectionName.trim(),
      color:       color || "#6366f1",
      notebookId,
      uid:         user.uid,
      createdAt:   serverTimestamp(),
    });

    await addDoc(collection(db, "nb_pages"), {
      pageName:    "Page 1",
      htmlContent: "",
      textContent: "",
      sectionId:   secRef.id,
      notebookId,
      uid:         user.uid,
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    });

    return { sectionId: secRef.id };
  };

  const renameSection = (id, sectionName, color) =>
    updateDoc(doc(db, "nb_sections", id), {
      sectionName: sectionName.trim(),
      color,
    });

  return { sections, loading, createSection, renameSection };
}

/* ════════════════════════════════════════════════════
   PAGES
   ════════════════════════════════════════════════════ */
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
    return onSnapshot(q,
      snap => {
        setPages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => { console.error("[usePages]", err.code, err.message); setLoading(false); }
    );
  }, [user, sectionId]);

  const createPage = (sectionId, notebookId, uid) =>
    addDoc(collection(db, "nb_pages"), {
      pageName:    "Untitled Page",
      htmlContent: "",
      textContent: "",
      sectionId,
      notebookId,
      uid,
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    });

  const savePage = (id, htmlContent, textContent, pageName) =>
    updateDoc(doc(db, "nb_pages", id), {
      htmlContent,
      textContent,
      pageName:    pageName || "Untitled Page",
      updatedAt:   serverTimestamp(),
    });

  const renamePage = (id, pageName) =>
    updateDoc(doc(db, "nb_pages", id), {
      pageName:  pageName || "Untitled Page",
      updatedAt: serverTimestamp(),
    });

  return { pages, loading, createPage, savePage, renamePage };
}
