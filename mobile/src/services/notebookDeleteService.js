/**
 * Notebook delete + recycle bin (nb_trash)
 *
 * When user "deletes" a notebook/section/page:
 * - snapshot the doc(s) into `nb_trash` (with `expireAt` = now + 30 days)
 * - hard-delete originals
 *
 * Restore:
 * - re-create original docs (same ids) and remove trash doc
 */

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function expireIn30Days() {
  return Timestamp.fromDate(new Date(Date.now() + THIRTY_DAYS_MS));
}

async function addTrashDoc(payload, uid) {
  return addDoc(collection(db, "nb_trash"), {
    ...payload,
    uid,
    deletedAt: serverTimestamp(),
    expireAt: expireIn30Days(),
    restored: false,
  });
}

export async function deletePage(pageId, uid) {
  const pageSnap = await getDoc(doc(db, "nb_pages", pageId));
  if (!pageSnap.exists()) return;
  const page = pageSnap.data();

  await addTrashDoc(
    {
      type: "page",
      originalId: pageId,
      pageId,
      pageName: page.pageName || "Page",
      notebookId: page.notebookId || null,
      sectionId: page.sectionId || null,
      page: { ...page, uid },
    },
    uid
  );

  await deleteDoc(pageSnap.ref);
}

export async function deleteSection(sectionId, notebookId, uid) {
  const sectionSnap = await getDoc(doc(db, "nb_sections", sectionId));
  if (!sectionSnap.exists()) return { autoCreated: false };
  const section = sectionSnap.data();

  const pagesSnap = await getDocs(
    query(
      collection(db, "nb_pages"),
      where("uid", "==", uid),
      where("sectionId", "==", sectionId)
    )
  );
  const pages = pagesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  await addTrashDoc(
    {
      type: "section",
      originalId: sectionId,
      sectionId,
      sectionName: section.sectionName || "Section",
      notebookId: notebookId || section.notebookId || null,
      section: { ...section, uid },
      pages,
    },
    uid
  );

  for (const pageDoc of pagesSnap.docs) {
    // eslint-disable-next-line no-await-in-loop
    await deleteDoc(pageDoc.ref);
  }
  await deleteDoc(sectionSnap.ref);

  // if notebook has no sections left -> create defaults (same as before)
  const remainingSecs = await getDocs(
    query(
      collection(db, "nb_sections"),
      where("uid", "==", uid),
      where("notebookId", "==", notebookId)
    )
  );

  if (remainingSecs.empty) {
    const newSec = await addDoc(collection(db, "nb_sections"), {
      sectionName: "Section 1",
      notebookId,
      uid,
      createdAt: serverTimestamp(),
    });
    await addDoc(collection(db, "nb_pages"), {
      pageName: "Page 1",
      htmlContent: "",
      textContent: "",
      sectionId: newSec.id,
      notebookId,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { autoCreated: true };
  }

  return { autoCreated: false };
}

export async function deleteNotebook(notebookId, uid) {
  const nbSnap = await getDoc(doc(db, "notebooks", notebookId));
  if (!nbSnap.exists()) return;
  const notebook = nbSnap.data();

  const secsSnap = await getDocs(
    query(
      collection(db, "nb_sections"),
      where("uid", "==", uid),
      where("notebookId", "==", notebookId)
    )
  );
  const sections = secsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const pagesSnap = await getDocs(
    query(
      collection(db, "nb_pages"),
      where("uid", "==", uid),
      where("notebookId", "==", notebookId)
    )
  );
  const pages = pagesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  await addTrashDoc(
    {
      type: "notebook",
      originalId: notebookId,
      notebookId,
      notebookName: notebook.notebookName || "Notebook",
      notebook: { ...notebook, uid },
      sections,
      pages,
    },
    uid
  );

  for (const pageDoc of pagesSnap.docs) {
    // eslint-disable-next-line no-await-in-loop
    await deleteDoc(pageDoc.ref);
  }
  for (const secDoc of secsSnap.docs) {
    // eslint-disable-next-line no-await-in-loop
    await deleteDoc(secDoc.ref);
  }
  await deleteDoc(nbSnap.ref);
}

export async function restoreFromTrash(item) {
  if (!item?.id || !item?.type || !item?.uid) throw new Error("Invalid trash item.");

  const ensureNotebookExists = async (oldNotebookId) => {
    if (!oldNotebookId) return { newNotebookId: null, restored: false };

    // if notebook already exists, just use it
    try {
      const nbSnap = await getDoc(doc(db, "notebooks", oldNotebookId));
      if (nbSnap.exists()) return { newNotebookId: oldNotebookId, restored: false };
    } catch (e) {
      // permission-denied etc: treat as missing and restore with new id
    }

    // try restoring from notebook trash snapshot
    const relatedSnap = await getDocs(query(
      collection(db, "nb_trash"),
      where("uid", "==", item.uid),
      where("restored", "==", false)
    ));
    const nbTrashDoc = relatedSnap.docs.find((d) => {
      const data = d.data();
      return data?.type === "notebook" && (data?.notebookId === oldNotebookId || data?.originalId === oldNotebookId);
    });
    if (!nbTrashDoc) return { newNotebookId: null, restored: false };

    const nbTrash = { id: nbTrashDoc.id, ...nbTrashDoc.data() };
    const createdNotebook = await addDoc(collection(db, "notebooks"), {
      ...(nbTrash.notebook || {}),
      uid: item.uid,
      restoredAt: serverTimestamp(),
      restoredFromTrash: true,
    });
    // notebook was restored as part of cascade -> remove its trash doc to avoid duplicates
    await deleteDoc(nbTrashDoc.ref);
    return { newNotebookId: createdNotebook.id, restored: true };
  };

  const ensureSectionExists = async ({ oldSectionId, oldNotebookId }) => {
    if (!oldSectionId) return { newSectionId: null, restored: false, notebookId: oldNotebookId || null };

    try {
      const secSnap = await getDoc(doc(db, "nb_sections", oldSectionId));
      if (secSnap.exists()) return { newSectionId: oldSectionId, restored: false, notebookId: oldNotebookId || null };
    } catch (e) {
      // treat as missing and restore with new id
    }

    // restore notebook first if needed (when restoring section into a deleted notebook)
    const { newNotebookId } = await ensureNotebookExists(oldNotebookId);

    const relatedSnap = await getDocs(query(
      collection(db, "nb_trash"),
      where("uid", "==", item.uid),
      where("restored", "==", false)
    ));
    const secTrashDoc = relatedSnap.docs.find((d) => {
      const data = d.data();
      return data?.type === "section" && (data?.sectionId === oldSectionId || data?.originalId === oldSectionId);
    });
    if (!secTrashDoc) return { newSectionId: null, restored: false, notebookId: newNotebookId || oldNotebookId || null };

    const secTrash = { id: secTrashDoc.id, ...secTrashDoc.data() };
    const { newSectionId } = await restoreSectionDoc({
      sectionPayload: secTrash.section || {},
      oldNotebookId,
      oldSectionId,
      targetNotebookId: newNotebookId || oldNotebookId,
    });

    for (const p of secTrash.pages || []) {
      // eslint-disable-next-line no-await-in-loop
      await restorePageDoc({
        pagePayload: p,
        oldNotebookId,
        oldSectionId: null,
        targetNotebookId: newNotebookId || oldNotebookId,
        targetSectionId: newSectionId,
      });
    }

    await deleteDoc(secTrashDoc.ref);
    return { newSectionId, restored: true, notebookId: newNotebookId || oldNotebookId || null };
  };

  const restoreSectionDoc = async ({ sectionPayload, oldNotebookId, oldSectionId, targetNotebookId }) => {
    const { id: _ignoredId, ...sectionData } = sectionPayload || {};
    const created = await addDoc(collection(db, "nb_sections"), {
      ...sectionData,
      uid: item.uid,
      notebookId: targetNotebookId || oldNotebookId || null,
      restoredAt: serverTimestamp(),
      restoredFromTrash: true,
    });
    return { newSectionId: created.id, oldSectionId };
  };

  const restorePageDoc = async ({ pagePayload, oldNotebookId, oldSectionId, targetNotebookId, targetSectionId }) => {
    const { id: _ignoredId, ...pageData } = pagePayload || {};
    await addDoc(collection(db, "nb_pages"), {
      ...pageData,
      uid: item.uid,
      notebookId: targetNotebookId || oldNotebookId || null,
      sectionId: targetSectionId || oldSectionId || null,
      restoredAt: serverTimestamp(),
      restoredFromTrash: true,
      updatedAt: pageData?.updatedAt || serverTimestamp(),
    });
  };

  if (item.type === "page") {
    const oldNotebookId = item.notebookId || item.page?.notebookId || null;
    const oldSectionId = item.sectionId || item.page?.sectionId || null;
    const { newNotebookId } = await ensureNotebookExists(oldNotebookId);
    const { newSectionId, notebookId: resolvedNotebookId } = await ensureSectionExists({
      oldSectionId,
      oldNotebookId,
    });
    await restorePageDoc({
      pagePayload: item.page || {},
      oldNotebookId,
      oldSectionId,
      targetNotebookId: newNotebookId || resolvedNotebookId,
      targetSectionId: newSectionId, // if we restored/located a section, attach page to it
    });
  } else if (item.type === "section") {
    const oldNotebookId = item.notebookId || item.section?.notebookId || null;
    const { newNotebookId } = await ensureNotebookExists(oldNotebookId);

    const { newSectionId } = await restoreSectionDoc({
      sectionPayload: item.section || {},
      oldNotebookId,
      oldSectionId: item.sectionId || item.originalId || null,
      targetNotebookId: newNotebookId,
    });

    for (const p of item.pages || []) {
      // eslint-disable-next-line no-await-in-loop
      await restorePageDoc({
        pagePayload: p,
        oldNotebookId,
        oldSectionId: null,
        targetNotebookId: newNotebookId,
        targetSectionId: newSectionId,
      });
    }
  } else if (item.type === "notebook") {
    const originalNotebookId = item.notebookId || item.originalId || null;

    // restore with NEW ids to avoid permission-denied collisions
    const createdNotebook = await addDoc(collection(db, "notebooks"), {
      ...(item.notebook || {}),
      uid: item.uid,
      restoredAt: serverTimestamp(),
      restoredFromTrash: true,
    });
    const newNotebookId = createdNotebook.id;

    const sectionIdMap = new Map();

    const restoreSection = async (sectionPayload, oldSectionId) => {
      const { newSectionId } = await restoreSectionDoc({
        sectionPayload,
        oldNotebookId: originalNotebookId,
        oldSectionId,
        targetNotebookId: newNotebookId,
      });
      if (oldSectionId) sectionIdMap.set(oldSectionId, newSectionId);
      return newSectionId;
    };

    const restorePage = async (pagePayload, mappedSectionId) => {
      return restorePageDoc({
        pagePayload,
        oldNotebookId: originalNotebookId,
        oldSectionId: null,
        targetNotebookId: newNotebookId,
        targetSectionId: mappedSectionId || null,
      });
    };

    // Gather related trash docs first (so we can restore in a stable sequence)
    let relatedSectionTrash = [];
    let relatedPageTrash = [];
    if (originalNotebookId) {
      const relatedSnap = await getDocs(query(
        collection(db, "nb_trash"),
        where("uid", "==", item.uid),
        where("restored", "==", false)
      ));
      relatedSectionTrash = relatedSnap.docs
        .map((d) => ({ _ref: d.ref, id: d.id, ...d.data() }))
        .filter((t) => t?.type === "section" && t?.notebookId === originalNotebookId);
      relatedPageTrash = relatedSnap.docs
        .map((d) => ({ _ref: d.ref, id: d.id, ...d.data() }))
        .filter((t) => t?.type === "page" && t?.notebookId === originalNotebookId);
    }

    // 1) Restore sections (embedded snapshot + related trash), then pages (embedded + related)
    const embeddedSections = (item.sections || []).map((s) => ({ section: s }));
    const embeddedPages = (item.pages || []).map((p) => ({ page: p, _ref: null }));

    for (const t of relatedSectionTrash) {
      // eslint-disable-next-line no-await-in-loop
      const oldSectionId = t.sectionId || t.originalId || t.id;
      if (!oldSectionId || sectionIdMap.has(oldSectionId)) continue;
      // eslint-disable-next-line no-await-in-loop
      const newSectionId = await restoreSection((t.section || t), oldSectionId);
      // eslint-disable-next-line no-await-in-loop
      for (const p of t.pages || []) await restorePage(p, newSectionId);
      // eslint-disable-next-line no-await-in-loop
      if (t._ref) await deleteDoc(t._ref);
    }

    for (const s of embeddedSections) {
      const sectionPayload = s.section;
      const oldSectionId = sectionPayload?.id || null;
      if (!oldSectionId || sectionIdMap.has(oldSectionId)) continue;
      // eslint-disable-next-line no-await-in-loop
      await restoreSection(sectionPayload, oldSectionId);
    }

    for (const p of embeddedPages) {
      const pagePayload = p.page;
      const mappedSectionId = sectionIdMap.get(pagePayload?.sectionId) || null;
      // eslint-disable-next-line no-await-in-loop
      await restorePage(pagePayload, mappedSectionId);
    }

    // related page trash last (after sectionIdMap is ready)
    for (const t of relatedPageTrash) {
      const pagePayload = t.page || t;
      const oldSectionId = t.sectionId || pagePayload.sectionId || null;
      const mappedSectionId = sectionIdMap.get(oldSectionId) || null;
      // eslint-disable-next-line no-await-in-loop
      await restorePage(pagePayload, mappedSectionId);
      // eslint-disable-next-line no-await-in-loop
      if (t._ref) await deleteDoc(t._ref);
    }
  } else {
    throw new Error(`Unsupported trash type: ${item.type}`);
  }

  await deleteDoc(doc(db, "nb_trash", item.id));
}

export async function purgeTrashItem(id) {
  await deleteDoc(doc(db, "nb_trash", id));
}
