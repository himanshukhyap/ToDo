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

  if (item.type === "page") {
    const payload = { ...(item.page || {}), uid: item.uid, restoredAt: serverTimestamp(), restoredFromTrash: true };
    const pageId = item.pageId || item.originalId;
    if (!pageId) throw new Error("Missing pageId.");
    const pageRef = doc(db, "nb_pages", pageId);
    try {
      const exists = await getDoc(pageRef);
      if (exists.exists()) {
        await addDoc(collection(db, "nb_pages"), payload);
      } else {
        await setDoc(pageRef, payload);
      }
    } catch (e) {
      await addDoc(collection(db, "nb_pages"), payload);
    }
  } else if (item.type === "section") {
    // restore with NEW ids to avoid permission-denied collisions
    const createdSection = await addDoc(collection(db, "nb_sections"), {
      ...(item.section || {}),
      uid: item.uid,
      restoredAt: serverTimestamp(),
      restoredFromTrash: true,
    });
    const newSectionId = createdSection.id;

    for (const p of item.pages || []) {
      // eslint-disable-next-line no-await-in-loop
      await addDoc(collection(db, "nb_pages"), {
        ...p,
        uid: item.uid,
        sectionId: newSectionId,
        restoredAt: serverTimestamp(),
        restoredFromTrash: true,
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
      const createdSection = await addDoc(collection(db, "nb_sections"), {
        ...sectionPayload,
        uid: item.uid,
        notebookId: newNotebookId,
        restoredAt: serverTimestamp(),
        restoredFromTrash: true,
      });
      if (oldSectionId) sectionIdMap.set(oldSectionId, createdSection.id);
      return createdSection.id;
    };

    const restorePage = async (pagePayload, mappedSectionId) => (
      addDoc(collection(db, "nb_pages"), {
        ...pagePayload,
        uid: item.uid,
        notebookId: newNotebookId,
        sectionId: mappedSectionId || null,
        restoredAt: serverTimestamp(),
        restoredFromTrash: true,
        updatedAt: pagePayload?.updatedAt || serverTimestamp(),
      })
    );

    // 1) Restore embedded snapshot (if present)
    for (const s of item.sections || []) {
      // eslint-disable-next-line no-await-in-loop
      await restoreSection(s, s.id);
    }

    for (const p of item.pages || []) {
      const mappedSectionId = sectionIdMap.get(p.sectionId) || p.sectionId || null;
      // eslint-disable-next-line no-await-in-loop
      await restorePage(p, mappedSectionId);
    }

    // 2) If user deleted pages/sections before deleting notebook (or deleteSection auto-created
    // default section/page), the notebook snapshot may not contain the full tree.
    // Also restore any related nb_trash items that still exist for this notebook.
    if (originalNotebookId) {
      const relatedSnap = await getDocs(query(
        collection(db, "nb_trash"),
        where("uid", "==", item.uid),
        where("restored", "==", false)
      ));

      const relatedSectionDocs = relatedSnap.docs.filter((d) => {
        const data = d.data();
        return data?.type === "section" && data?.notebookId === originalNotebookId;
      });

      for (const d of relatedSectionDocs) {
        const t = { id: d.id, ...d.data() };
        // eslint-disable-next-line no-await-in-loop
        const newSectionId = await restoreSection((t.section || t), t.sectionId || t.originalId || t.id);

        for (const p of t.pages || []) {
          // eslint-disable-next-line no-await-in-loop
          await restorePage(p, newSectionId);
        }

        // eslint-disable-next-line no-await-in-loop
        await deleteDoc(d.ref);
      }

      const relatedPageDocs = relatedSnap.docs.filter((d) => {
        const data = d.data();
        return data?.type === "page" && data?.notebookId === originalNotebookId;
      });

      for (const d of relatedPageDocs) {
        const t = { id: d.id, ...d.data() };
        const pagePayload = t.page || t;
        const oldSectionId = t.sectionId || pagePayload.sectionId || null;
        const mappedSectionId = sectionIdMap.get(oldSectionId) || null;

        // eslint-disable-next-line no-await-in-loop
        await restorePage(pagePayload, mappedSectionId);
        // eslint-disable-next-line no-await-in-loop
        await deleteDoc(d.ref);
      }
    }
  } else {
    throw new Error(`Unsupported trash type: ${item.type}`);
  }

  await deleteDoc(doc(db, "nb_trash", item.id));
}

export async function purgeTrashItem(id) {
  await deleteDoc(doc(db, "nb_trash", id));
}
