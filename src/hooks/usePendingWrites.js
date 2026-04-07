import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

/**
 * usePendingWrites
 *
 * Tracks whether Firestore has any locally-written documents that have
 * not yet been synced to the server (i.e. written while offline).
 *
 * Firestore sets doc.metadata.hasPendingWrites = true for every document
 * that has been written locally but not yet confirmed by the server.
 * We listen to all three collections with { includeMetadataChanges: true }
 * so we catch the moment each write is synced and the flag clears.
 *
 * Returns:
 *   hasPending  — boolean, true while any doc has an unsynced local write
 *   syncedAt    — Date | null, timestamp of the most recent sync completion
 */
export function usePendingWrites() {
  const { user } = useAuth();
  const [hasPending, setHasPending] = useState(false);
  const [syncedAt,   setSyncedAt]   = useState(null);

  // Track pending state per collection so we combine them correctly
  const pendingMap = useRef({ notes: false, tasks: false, notebooks: false });

  const recalc = () => {
    const any = Object.values(pendingMap.current).some(Boolean);
    setHasPending(prev => {
      if (prev && !any) setSyncedAt(new Date()); // just finished syncing
      return any;
    });
  };

  useEffect(() => {
    if (!user) return;

    const makeListener = (collName) => {
      const q = query(
        collection(db, collName),
        where("uid", "==", user.uid)
      );
      return onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snap) => {
          pendingMap.current[collName] = snap.docs.some(
            (d) => d.metadata.hasPendingWrites
          );
          recalc();
        },
        (err) => {
          // Don't crash if a collection has no offline support
          console.warn(`[usePendingWrites] ${collName}:`, err.code);
        }
      );
    };

    const unsubs = [
      makeListener("notes"),
      makeListener("tasks"),
      makeListener("notebooks"),
    ];

    return () => unsubs.forEach((u) => u());
  }, [user]);

  return { hasPending, syncedAt };
}
