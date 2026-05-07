import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, where, orderBy, serverTimestamp, arrayUnion, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(
      q,
      snap => {
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      err => {
        console.error("[Tasks] onSnapshot error:", err.code, err.message);
        setError(`Failed to load tasks: ${err.message}`);
        setLoading(false);
      }
    );
  }, [user]);

  const addTask = async (title, categoryId) => {
    if (!title.trim()) return;
    try {
      await addDoc(collection(db, "tasks"), {
        title: title.trim(),
        categoryId: categoryId || null,
        completed: false,
        subtasks: [],
        uid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[Tasks] addDoc error:", e.code, e.message);
      setError(`Add failed: ${e.message}`);
      throw e;
    }
  };

  const updateTask = async (id, updates) => {
    try {
      await updateDoc(doc(db, "tasks", id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[Tasks] updateDoc error:", e.code, e.message);
      setError(`Update failed: ${e.message}`);
      throw e;
    }
  };

  const deleteTask = async (id) => {
    console.log("[Tasks] Deleting task:", id);
    try {
      await deleteDoc(doc(db, "tasks", id));
      console.log("[Tasks] Deleted successfully:", id);
    } catch (e) {
      console.error("[Tasks] deleteDoc error:", e.code, e.message);
      setError(`Delete failed: ${e.message} — Check Firestore rules are deployed.`);
      throw e;
    }
  };

  const deleteAllTasks = async (taskIds = []) => {
    if (!taskIds.length) return;
    try {
      for (let i = 0; i < taskIds.length; i += 450) {
        const batch = writeBatch(db);
        taskIds.slice(i, i + 450).forEach((id) => {
          batch.delete(doc(db, "tasks", id));
        });
        await batch.commit();
      }
    } catch (e) {
      console.error("[Tasks] deleteAllTasks error:", e.code, e.message);
      setError(`Delete all failed: ${e.message}`);
      throw e;
    }
  };

  const toggleTask = (id, current) =>
    updateTask(id, { completed: !current });

  const addSubtask = async (taskId, text) => {
    if (!text.trim()) return;
    const subtask = { id: genId(), text: text.trim(), completed: false };
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        subtasks: arrayUnion(subtask),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[Tasks] addSubtask error:", e.code, e.message);
      throw e;
    }
  };

  const updateSubtask = async (taskId, task, subtaskId, newText) => {
    const updated = (task.subtasks || []).map(s =>
      s.id === subtaskId ? { ...s, text: newText.trim() } : s
    );
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        subtasks: updated,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[Tasks] updateSubtask error:", e.code, e.message);
      throw e;
    }
  };

  const toggleSubtask = async (taskId, task, subtaskId) => {
    const updated = (task.subtasks || []).map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        subtasks: updated,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[Tasks] toggleSubtask error:", e.code, e.message);
      throw e;
    }
  };

  const deleteSubtask = async (taskId, task, subtaskId) => {
    const updated = (task.subtasks || []).filter(s => s.id !== subtaskId);
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        subtasks: updated,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[Tasks] deleteSubtask error:", e.code, e.message);
      throw e;
    }
  };

  return {
    tasks, loading, error,
    addTask, updateTask, deleteTask, toggleTask,
    addSubtask, updateSubtask, toggleSubtask, deleteSubtask, deleteAllTasks,
  };
}
