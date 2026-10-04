import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function expireIn30Days() {
  return Timestamp.fromDate(new Date(Date.now() + THIRTY_DAYS_MS));
}

async function moveDocToTrash(sourceCollection, id, uid) {
  const ref = doc(db, sourceCollection, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  await addDoc(collection(db, "trash"), {
    uid,
    sourceCollection,
    originalId: id,
    title: data.title || null,
    name: data.textContent || data.notebookName || data.sectionName || data.pageName || null,
    data,
    deletedAt: serverTimestamp(),
    expireAt: expireIn30Days(),
    restored: false,
  });

  await deleteDoc(ref);
}

export async function trashNote(noteId, uid) {
  return moveDocToTrash("notes", noteId, uid);
}

export async function trashTask(taskId, uid) {
  return moveDocToTrash("tasks", taskId, uid);
}

export async function restoreTrashItem(item) {
  if (!item?.sourceCollection || !item?.originalId) {
    throw new Error("Invalid trash item.");
  }
  const payload = {
    ...(item.data || {}),
    uid: item.uid,
    restoredAt: serverTimestamp(),
    restoredFromTrash: true,
  };

  const targetRef = doc(db, item.sourceCollection, item.originalId);
  try {
    const existing = await getDoc(targetRef);
    if (existing.exists()) {
      // ID collision: restore with a new id
      await addDoc(collection(db, item.sourceCollection), payload);
    } else {
      await setDoc(targetRef, payload);
    }
  } catch (e) {
    // If the id is owned by someone else, getDoc can throw permission-denied.
    // Fallback: restore with a new id under current user.
    await addDoc(collection(db, item.sourceCollection), payload);
  }

  await deleteDoc(doc(db, "trash", item.id));
}

export async function purgeTrashItem(id) {
  await deleteDoc(doc(db, "trash", id));
}
