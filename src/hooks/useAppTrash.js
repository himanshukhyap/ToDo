import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { purgeTrashItem, restoreTrashItem } from "../services/trashService";

export function useAppTrash() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setItems([]); setLoading(false); return; }
    const q = query(
      collection(db, "trash"),
      where("uid", "==", user.uid),
      where("restored", "==", false),
      orderBy("deletedAt", "desc")
    );
    return onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => { console.error("[AppTrash]", err); setLoading(false); }
    );
  }, [user]);

  const restore = (item) => restoreTrashItem(item);
  const purge = (id) => purgeTrashItem(id);
  const purgeAll = async () => { for (const item of items) await purgeTrashItem(item.id); };

  return { items, loading, restore, purge, purgeAll };
}

