import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export const BACKUP_SECTIONS = [
  {
    key: "categories",
    label: "Categories",
    collection: "categories",
  },
  {
    key: "tasks",
    label: "Tasks",
    collection: "tasks",
  },
  {
    key: "notes",
    label: "Notes",
    collection: "notes",
  },
  {
    key: "notebooks",
    label: "Notebooks",
    collection: "notebooks",
  },
  {
    key: "nb_sections",
    label: "Sections",
    collection: "nb_sections",
  },
  {
    key: "nb_pages",
    label: "Pages",
    collection: "nb_pages",
  },
  {
    key: "nb_trash",
    label: "Trash",
    collection: "nb_trash",
  },
];
const USER_COLLECTIONS = BACKUP_SECTIONS.map((section) => section.collection);
const DEFAULT_SELECTED_COLLECTIONS = [...USER_COLLECTIONS];

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeRichText(value) {
  return normalizeText(String(value || "").replace(/\s+/g, " "));
}

function buildSelectionMap(selectedCollections = DEFAULT_SELECTED_COLLECTIONS) {
  const allowed = new Set(selectedCollections);
  return Object.fromEntries(
    USER_COLLECTIONS.map((name) => [name, allowed.has(name)])
  );
}

function createSummary() {
  return Object.fromEntries(
    USER_COLLECTIONS.map((name) => [name, { imported: 0, skipped: 0, total: 0 }])
  );
}

function setSummaryTotals(summary, backup) {
  summary.categories.total = backup.categories.length;
  summary.tasks.total = backup.tasks.length;
  summary.notes.total = backup.notes.length;
  summary.notebooks.total = backup.notebooks.length;
  summary.nb_sections.total = backup.sections.length;
  summary.nb_pages.total = backup.pages.length;
  summary.nb_trash.total = backup.trash.length;
  return summary;
}

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

function serializeBackupSummary(summary) {
  return Object.fromEntries(
    Object.entries(summary).map(([name, stats]) => [name, stats.imported])
  );
}

function defaultExportCollections(collections, selectionMap) {
  return Object.fromEntries(
    Object.keys(collections).map((name) => [name, selectionMap[name] ? collections[name] : []])
  );
}

function buildExistingMaps(data) {
  const categories = new Map();
  const notebooks = new Map();
  const sections = new Map();
  const pages = new Map();
  const tasks = new Set();
  const notes = new Set();
  const trash = new Set();

  data.categories.forEach((item) => {
    categories.set(normalizeText(item.name), item.id);
  });

  data.notebooks.forEach((item) => {
    notebooks.set(normalizeText(item.notebookName), item.id);
  });

  data.sections.forEach((item) => {
    sections.set(`${item.notebookId || ""}::${normalizeText(item.sectionName)}`, item.id);
  });

  data.pages.forEach((item) => {
    pages.set(
      `${item.notebookId || ""}::${item.sectionId || ""}::${normalizeText(item.pageName)}::${normalizeRichText(item.textContent)}`,
      item.id
    );
  });

  data.tasks.forEach((item) => {
    tasks.add(
      `${normalizeText(item.title)}::${!!item.completed}::${normalizeRichText(
        JSON.stringify(item.subtasks || [])
      )}`
    );
  });

  data.notes.forEach((item) => {
    notes.add(
      `${normalizeRichText(item.textContent)}::${normalizeRichText(item.htmlContent)}::${normalizeText(item.color)}`
    );
  });

  data.trash.forEach((item) => {
    trash.add(
      `${normalizeText(item.type)}::${normalizeText(item.name || item.pageName || item.sectionName || item.notebookName)}::${normalizeText(item.originalId)}`
    );
  });

  return {
    categories,
    notebooks,
    sections,
    pages,
    tasks,
    notes,
    trash,
  };
}

async function readExistingUserData(uid) {
  const collections = await Promise.all(USER_COLLECTIONS.map((name) => readCollection(name, uid)));
  return {
    categories: collections[0],
    tasks: collections[1],
    notes: collections[2],
    notebooks: collections[3],
    sections: collections[4],
    pages: collections[5],
    trash: collections[6],
  };
}

export async function exportUserBackup(user, options = {}) {
  const selectedCollections = options.selectedCollections || DEFAULT_SELECTED_COLLECTIONS;
  const selectionMap = buildSelectionMap(selectedCollections);
  const collections = {};

  for (const name of USER_COLLECTIONS) {
    collections[name] = await readCollection(name, user.uid);
  }

  const payload = {
    meta: {
      app: "NoteTask",
      version: 2,
      exportedAt: new Date().toISOString(),
      backupFor: "current-user-data",
      loginDataIncluded: false,
      selectedCollections,
      mode: "selective-merge-import",
    },
    collections: defaultExportCollections(collections, selectionMap),
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadJson(`notetask-backup-${stamp}.json`, payload);

  return Object.fromEntries(
    Object.entries(collections).map(([name, docs]) => [name, selectionMap[name] ? docs.length : 0])
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
  return importUserBackupWithOptions(user, fileText, {});
}

export async function importUserBackupWithOptions(user, fileText, options = {}) {
  const parsed = JSON.parse(fileText);
  const backup = normalizeBackup(parsed);
  const selectedCollections = options.selectedCollections || DEFAULT_SELECTED_COLLECTIONS;
  const selectionMap = buildSelectionMap(selectedCollections);
  const skipDuplicates = options.skipDuplicates !== false;
  const existingData = skipDuplicates ? await readExistingUserData(user.uid) : null;
  const existingMaps = existingData ? buildExistingMaps(existingData) : null;
  const categoryMap = new Map();
  const notebookMap = new Map();
  const sectionMap = new Map();
  const pageMap = new Map();
  const summary = setSummaryTotals(createSummary(), backup);

  if (selectionMap.categories) {
    for (const item of backup.categories) {
      const categoryName = item.name || "Imported Category";
      const duplicateId = skipDuplicates
        ? existingMaps?.categories.get(normalizeText(categoryName))
        : null;

      if (duplicateId) {
        categoryMap.set(item.id, duplicateId);
        summary.categories.skipped += 1;
        continue;
      }

      const created = await addDoc(collection(db, "categories"), sanitizeDoc({
        name: categoryName,
        color: item.color || "#6366f1",
        createdAt: item.createdAt || null,
      }, user.uid));
      categoryMap.set(item.id, created.id);
      existingMaps?.categories.set(normalizeText(categoryName), created.id);
      summary.categories.imported += 1;
    }
  }

  if (selectionMap.tasks) {
    for (const item of backup.tasks) {
      const taskFingerprint = `${normalizeText(item.title || "Imported Task")}::${!!item.completed}::${normalizeRichText(
        JSON.stringify(item.subtasks || [])
      )}`;
      if (skipDuplicates && existingMaps?.tasks.has(taskFingerprint)) {
        summary.tasks.skipped += 1;
        continue;
      }

      await addDoc(collection(db, "tasks"), sanitizeDoc({
        title: item.title || "Imported Task",
        categoryId: categoryMap.get(item.categoryId) || null,
        completed: !!item.completed,
        subtasks: Array.isArray(item.subtasks) ? item.subtasks : [],
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null,
      }, user.uid));
      existingMaps?.tasks.add(taskFingerprint);
      summary.tasks.imported += 1;
    }
  }

  if (selectionMap.notes) {
    for (const item of backup.notes) {
      const noteFingerprint = `${normalizeRichText(item.textContent || "Imported Note")}::${normalizeRichText(
        item.htmlContent || ""
      )}::${normalizeText(item.color || "#334155")}`;
      if (skipDuplicates && existingMaps?.notes.has(noteFingerprint)) {
        summary.notes.skipped += 1;
        continue;
      }

      await addDoc(collection(db, "notes"), sanitizeDoc({
        htmlContent: item.htmlContent || "",
        textContent: item.textContent || "Imported Note",
        color: item.color || "#334155",
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null,
      }, user.uid));
      existingMaps?.notes.add(noteFingerprint);
      summary.notes.imported += 1;
    }
  }

  if (selectionMap.notebooks) {
    for (const item of backup.notebooks) {
      const notebookName = item.notebookName || "Imported Notebook";
      const duplicateId = skipDuplicates
        ? existingMaps?.notebooks.get(normalizeText(notebookName))
        : null;

      if (duplicateId) {
        notebookMap.set(item.id, duplicateId);
        summary.notebooks.skipped += 1;
        continue;
      }

      const created = await addDoc(collection(db, "notebooks"), sanitizeDoc({
        notebookName,
        color: item.color || "#6366f1",
        createdAt: item.createdAt || null,
      }, user.uid));
      notebookMap.set(item.id, created.id);
      existingMaps?.notebooks.set(normalizeText(notebookName), created.id);
      summary.notebooks.imported += 1;
    }
  }

  if (selectionMap.nb_sections) {
    for (const item of backup.sections) {
      const targetNotebookId = notebookMap.get(item.notebookId) || null;
      const sectionName = item.sectionName || "Imported Section";
      const sectionFingerprint = `${targetNotebookId || ""}::${normalizeText(sectionName)}`;

      if (skipDuplicates && existingMaps?.sections.has(sectionFingerprint)) {
        sectionMap.set(item.id, existingMaps.sections.get(sectionFingerprint));
        summary.nb_sections.skipped += 1;
        continue;
      }

      const created = await addDoc(collection(db, "nb_sections"), sanitizeDoc({
        sectionName,
        color: item.color || "#6366f1",
        notebookId: targetNotebookId,
        createdAt: item.createdAt || null,
      }, user.uid));
      sectionMap.set(item.id, created.id);
      existingMaps?.sections.set(sectionFingerprint, created.id);
      summary.nb_sections.imported += 1;
    }
  }

  if (selectionMap.nb_pages) {
    for (const item of backup.pages) {
      const targetSectionId = sectionMap.get(item.sectionId) || null;
      const targetNotebookId = notebookMap.get(item.notebookId) || null;
      const pageFingerprint = `${targetNotebookId || ""}::${targetSectionId || ""}::${normalizeText(
        item.pageName || "Imported Page"
      )}::${normalizeRichText(item.textContent || "")}`;

      if (skipDuplicates && existingMaps?.pages.has(pageFingerprint)) {
        pageMap.set(item.id, existingMaps.pages.get(pageFingerprint));
        summary.nb_pages.skipped += 1;
        continue;
      }

      const created = await addDoc(collection(db, "nb_pages"), sanitizeDoc({
        pageName: item.pageName || "Imported Page",
        htmlContent: item.htmlContent || "",
        textContent: item.textContent || "",
        sectionId: targetSectionId,
        notebookId: targetNotebookId,
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null,
      }, user.uid));
      pageMap.set(item.id, created.id);
      existingMaps?.pages.set(pageFingerprint, created.id);
      summary.nb_pages.imported += 1;
    }
  }

  if (selectionMap.nb_trash) {
    for (const item of backup.trash) {
      const trashFingerprint = `${normalizeText(item.type)}::${normalizeText(
        item.name || item.pageName || item.sectionName || item.notebookName
      )}::${normalizeText(item.originalId)}`;
      if (skipDuplicates && existingMaps?.trash.has(trashFingerprint)) {
        summary.nb_trash.skipped += 1;
        continue;
      }

      await addDoc(collection(db, "nb_trash"), sanitizeDoc({
        ...item,
        notebookId: notebookMap.get(item.notebookId) || item.notebookId || null,
        sectionId: sectionMap.get(item.sectionId) || item.sectionId || null,
        pageId: pageMap.get(item.pageId) || item.pageId || null,
      }, user.uid));
      existingMaps?.trash.add(trashFingerprint);
      summary.nb_trash.imported += 1;
    }
  }

  return {
    details: summary,
    selectedCollections,
    skipDuplicates,
    ...serializeBackupSummary(summary),
  };
}
