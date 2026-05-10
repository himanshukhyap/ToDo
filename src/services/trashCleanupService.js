import {
  Timestamp,
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

async function cleanupCollection(collectionName, uid) {
  const now = Timestamp.now();
  const q = query(
    collection(db, collectionName),
    where("uid", "==", uid),
    where("expireAt", "<=", now),
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    // eslint-disable-next-line no-await-in-loop
    await deleteDoc(d.ref);
  }
  return snap.size;
}

export async function cleanupExpiredTrash(uid) {
  if (!uid) return { trash: 0, nb_trash: 0 };
  const [trashCount, nbTrashCount] = await Promise.all([
    cleanupCollection("trash", uid),
    cleanupCollection("nb_trash", uid),
  ]);
  return { trash: trashCount, nb_trash: nbTrashCount };
}

