import { useState, useEffect } from "react";
import {
  collection, onSnapshot, query, where, orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { restoreFromTrash, purgeTrashItem } from "../services/notebookDeleteService";

export function useTrash() {
  const { user } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(
      collection(db, "nb_trash"),
      where("uid",      "==", user.uid),
      where("restored", "==", false),
      orderBy("deletedAt", "desc")
    );
    return onSnapshot(q,
      snap => {
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => { console.error("[Trash]", err); setLoading(false); }
    );
  }, [user]);

  const restore = (item) => restoreFromTrash(item);
  const purge   = (id)   => purgeTrashItem(id);

  // Purge all items permanently
  const purgeAll = async () => {
    for (const item of items) await purgeTrashItem(item.id);
  };

  return { items, loading, restore, purge, purgeAll };
}
