/**
 * Notebook Delete Service
 * 
 * Structure:
 *   notebooks  — fields: notebookId(auto), notebookName, uid, ...
 *   nb_sections — fields: sectionId(auto), sectionName, notebookId, uid, ...
 *   nb_pages    — fields: pageId(auto), pageName, sectionId, uid, ...
 *
 * Deletion order:
 *   Delete Notebook  → Pages → Sections → Notebook
 *   Delete Section   → Pages → Section
 *   Delete Page      → Page only
 *
 * NO batches, NO trash, NO soft-delete.
 * Pure sequential async/await hard deletes.
 */

import {
  collection, addDoc, getDocs, deleteDoc,
  doc, query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/* ──────────────────────────────────────────────────────
   STEP 1 helper — delete all pages in one section
   uid filter is mandatory for Firestore security rules
   ────────────────────────────────────────────────────── */
async function deleteAllPagesInSection(sectionId, uid) {
  console.log(`[Delete] Fetching pages for section ${sectionId}...`);

  const q = query(
    collection(db, "nb_pages"),
    where("uid",       "==", uid),
    where("sectionId", "==", sectionId)
  );

  const snap = await getDocs(q);
  console.log(`[Delete] Found ${snap.size} pages to delete`);

  // Sequential delete — one by one, stop on any failure
  for (const pageDoc of snap.docs) {
    console.log(`[Delete] Deleting page ${pageDoc.id}...`);
    await deleteDoc(pageDoc.ref);
    console.log(`[Delete] Page ${pageDoc.id} deleted ✓`);
  }
}

/* ──────────────────────────────────────────────────────
   DELETE PAGE
   Direct hard delete — no dependencies
   ────────────────────────────────────────────────────── */
export async function deletePage(pageId, uid) {
  console.log(`[Delete] Deleting page ${pageId}...`);
  await deleteDoc(doc(db, "nb_pages", pageId));
  console.log(`[Delete] Page ${pageId} deleted ✓`);
}

/* ──────────────────────────────────────────────────────
   DELETE SECTION
   Order: pages first → then section
   ────────────────────────────────────────────────────── */
export async function deleteSection(sectionId, notebookId, uid) {
  console.log(`[Delete] Starting section delete: ${sectionId}`);

  // Step 1: Delete all pages in this section
  await deleteAllPagesInSection(sectionId, uid);

  // Step 2: Delete the section itself
  console.log(`[Delete] Deleting section ${sectionId}...`);
  await deleteDoc(doc(db, "nb_sections", sectionId));
  console.log(`[Delete] Section ${sectionId} deleted ✓`);

  // Step 3: Check if notebook has no sections left → auto-create defaults
  const remainingSecs = await getDocs(
    query(
      collection(db, "nb_sections"),
      where("uid",        "==", uid),
      where("notebookId", "==", notebookId)
    )
  );

  if (remainingSecs.empty) {
    console.log(`[Delete] No sections left — creating defaults...`);
    const newSec = await addDoc(collection(db, "nb_sections"), {
      sectionName: "Section 1",
      notebookId,
      uid,
      createdAt: serverTimestamp(),
    });
    await addDoc(collection(db, "nb_pages"), {
      pageName:    "Page 1",
      htmlContent: "",
      textContent: "",
      sectionId:   newSec.id,
      notebookId,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`[Delete] Default section + page created ✓`);
    return { autoCreated: true };
  }

  return { autoCreated: false };
}

/* ──────────────────────────────────────────────────────
   DELETE NOTEBOOK
   Order: pages → sections → notebook (strict sequence)
   ────────────────────────────────────────────────────── */
export async function deleteNotebook(notebookId, uid) {
  console.log(`[Delete] Starting notebook delete: ${notebookId}`);

  // Step 1: Fetch all sections of this notebook
  const secsSnap = await getDocs(
    query(
      collection(db, "nb_sections"),
      where("uid",        "==", uid),
      where("notebookId", "==", notebookId)
    )
  );
  console.log(`[Delete] Found ${secsSnap.size} sections`);

  // Step 2: For each section — delete all pages first, then section
  for (const secDoc of secsSnap.docs) {
    // Delete all pages in this section
    await deleteAllPagesInSection(secDoc.id, uid);

    // Then delete the section
    console.log(`[Delete] Deleting section ${secDoc.id}...`);
    await deleteDoc(secDoc.ref);
    console.log(`[Delete] Section ${secDoc.id} deleted ✓`);
  }

  // Step 3: Delete the notebook
  console.log(`[Delete] Deleting notebook ${notebookId}...`);
  await deleteDoc(doc(db, "notebooks", notebookId));
  console.log(`[Delete] Notebook ${notebookId} deleted ✓`);
  console.log(`[Delete] Full cascade complete!`);
}
