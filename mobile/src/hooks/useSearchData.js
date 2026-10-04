/**
 * useSearchData — everything the global search looks through, for the signed-in user.
 * Shared by the web app and the Android app (keep both copies identical).
 *
 * Listeners are only attached while `enabled` is true (the search panel is open).
 * Queries filter on uid only, so they need no extra Firestore indexes.
 */
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const SOURCES = {
  tasks: "tasks",
  notes: "notes",
  notebooks: "notebooks",
  sections: "nb_sections",
  pages: "nb_pages",
  categories: "categories",
};

const EMPTY = { tasks: [], notes: [], notebooks: [], sections: [], pages: [], categories: [] };

export function useSearchData(enabled) {
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !user) return undefined;
    setLoading(true);
    const pending = new Set(Object.keys(SOURCES));

    const unsubs = Object.entries(SOURCES).map(([key, name]) =>
      onSnapshot(
        query(collection(db, name), where("uid", "==", user.uid)),
        (snap) => {
          setData((prev) => ({ ...prev, [key]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
          pending.delete(key);
          if (!pending.size) setLoading(false);
        },
        (err) => {
          console.warn(`[Search] ${name}:`, err.code, err.message);
          pending.delete(key);
          if (!pending.size) setLoading(false);
        }
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [enabled, user]);

  return { data, loading };
}
