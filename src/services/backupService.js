import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const USER_COLLECTIONS = [
  "categories",
  "tasks",
  "notes",
  "notebooks",
  "nb_sections",
  "nb_pages",
  "nb_trash",
];

function toSerializable(value) {
  if (value instanceof Timestamp) {
    return { __type: "timestamp", iso: value.toDate().toISOString() };
  }

  if (Array.isArray(value)) return value.map(toSerializable);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, toSerializable(nested)])
    );
  }

  return value;
}

function fromSerializable(value) {
  if (Array.isArray(value)) return value.map(fromSerializable);

  if (value && typeof value === "object") {
    if (value.__type === "timestamp" && value.iso) {
      const date = new Date(value.iso);
      return Number.isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, fromSerializable(nested)])
    );
  }

  return value;
}

function sanitizeDoc(data, uid) {
  const clean = fromSerializable(data || {});
  delete clean.id;
  clean.uid = uid;
  return clean;
}

async function readCollection(name, uid) {
  const snap = await getDocs(query(collection(db, name), where("uid", "==", uid)));
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...toSerializable(docSnap.data()),
  }));
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportUserBackup(user) {
  const collections = {};

  for (const name of USER_COLLECTIONS) {
    collections[name] = await readCollection(name, user.uid);
  }

  const payload = {
    meta: {
      app: "NoteTask",
      version: 1,
      exportedAt: new Date().toISOString(),
      userEmail: user.email || null,
      userUid: user.uid,
      mode: "merge-import",
    },
    collections,
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadJson(`notetask-backup-${stamp}.json`, payload);

  return Object.fromEntries(
    Object.entries(collections).map(([name, docs]) => [name, docs.length])
  );
}

function normalizeBackup(fileData) {
  if (!fileData?.collections || typeof fileData.collections !== "object") {
    throw new Error("Invalid backup file.");
  }

  return {
    categories: Array.isArray(fileData.collections.categories) ? fileData.collections.categories : [],
    tasks: Array.isArray(fileData.collections.tasks) ? fileData.collections.tasks : [],
    notes: Array.isArray(fileData.collections.notes) ? fileData.collections.notes : [],
    notebooks: Array.isArray(fileData.collections.notebooks) ? fileData.collections.notebooks : [],
    sections: Array.isArray(fileData.collections.nb_sections) ? fileData.collections.nb_sections : [],
    pages: Array.isArray(fileData.collections.nb_pages) ? fileData.collections.nb_pages : [],
    trash: Array.isArray(fileData.collections.nb_trash) ? fileData.collections.nb_trash : [],
  };
}

export async function importUserBackup(user, fileText) {
  const parsed = JSON.parse(fileText);
  const backup = normalizeBackup(parsed);
  const categoryMap = new Map();
  const notebookMap = new Map();
  const sectionMap = new Map();
  const pageMap = new Map();
  const summary = {
    categories: 0,
    tasks: 0,
    notes: 0,
    notebooks: 0,
    nb_sections: 0,
    nb_pages: 0,
    nb_trash: 0,
  };

  for (const item of backup.categories) {
    const created = await addDoc(collection(db, "categories"), sanitizeDoc({
      name: item.name || "Imported Category",
      color: item.color || "#6366f1",
      createdAt: item.createdAt || null,
    }, user.uid));
    categoryMap.set(item.id, created.id);
    summary.categories += 1;
  }

  for (const item of backup.tasks) {
    await addDoc(collection(db, "tasks"), sanitizeDoc({
      title: item.title || "Imported Task",
      categoryId: categoryMap.get(item.categoryId) || null,
      completed: !!item.completed,
      subtasks: Array.isArray(item.subtasks) ? item.subtasks : [],
      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || null,
    }, user.uid));
    summary.tasks += 1;
  }

  for (const item of backup.notes) {
    await addDoc(collection(db, "notes"), sanitizeDoc({
      htmlContent: item.htmlContent || "",
      textContent: item.textContent || "Imported Note",
      color: item.color || "#334155",
      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || null,
    }, user.uid));
    summary.notes += 1;
  }

  for (const item of backup.notebooks) {
    const created = await addDoc(collection(db, "notebooks"), sanitizeDoc({
      notebookName: item.notebookName || "Imported Notebook",
      color: item.color || "#6366f1",
      createdAt: item.createdAt || null,
    }, user.uid));
    notebookMap.set(item.id, created.id);
    summary.notebooks += 1;
  }

  for (const item of backup.sections) {
    const created = await addDoc(collection(db, "nb_sections"), sanitizeDoc({
      sectionName: item.sectionName || "Imported Section",
      color: item.color || "#6366f1",
      notebookId: notebookMap.get(item.notebookId) || null,
      createdAt: item.createdAt || null,
    }, user.uid));
    sectionMap.set(item.id, created.id);
    summary.nb_sections += 1;
  }

  for (const item of backup.pages) {
    const created = await addDoc(collection(db, "nb_pages"), sanitizeDoc({
      pageName: item.pageName || "Imported Page",
      htmlContent: item.htmlContent || "",
      textContent: item.textContent || "",
      sectionId: sectionMap.get(item.sectionId) || null,
      notebookId: notebookMap.get(item.notebookId) || null,
      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || null,
    }, user.uid));
    pageMap.set(item.id, created.id);
    summary.nb_pages += 1;
  }

  for (const item of backup.trash) {
    await addDoc(collection(db, "nb_trash"), sanitizeDoc({
      ...item,
      notebookId: notebookMap.get(item.notebookId) || item.notebookId || null,
      sectionId: sectionMap.get(item.sectionId) || item.sectionId || null,
      pageId: pageMap.get(item.pageId) || item.pageId || null,
    }, user.uid));
    summary.nb_trash += 1;
  }

  return summary;
}
