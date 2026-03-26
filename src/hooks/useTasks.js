import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, where, orderBy, serverTimestamp, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Tasks error:", err);
        setError("Failed to load tasks. Check Firestore rules & indexes.");
        setLoading(false);
      }
    );
    return unsub;
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
      setError("Failed to add task: " + e.message);
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
      setError("Failed to update task: " + e.message);
      throw e;
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch (e) {
      setError("Failed to delete task: " + e.message);
      throw e;
    }
  };

  const toggleTask = (id, current) =>
    updateTask(id, { completed: !current });

  // Subtask operations — stored as array inside task doc
  const addSubtask = async (taskId, text) => {
    if (!text.trim()) return;
    const subtask = { id: genId(), text: text.trim(), completed: false };
    await updateDoc(doc(db, "tasks", taskId), {
      subtasks: arrayUnion(subtask),
      updatedAt: serverTimestamp(),
    });
  };

  const updateSubtask = async (taskId, task, subtaskId, newText) => {
    const updated = (task.subtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, text: newText.trim() } : s
    );
    await updateDoc(doc(db, "tasks", taskId), {
      subtasks: updated,
      updatedAt: serverTimestamp(),
    });
  };

  const toggleSubtask = async (taskId, task, subtaskId) => {
    const updated = (task.subtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    await updateDoc(doc(db, "tasks", taskId), {
      subtasks: updated,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteSubtask = async (taskId, task, subtaskId) => {
    const updated = (task.subtasks || []).filter((s) => s.id !== subtaskId);
    await updateDoc(doc(db, "tasks", taskId), {
      subtasks: updated,
      updatedAt: serverTimestamp(),
    });
  };

  return {
    tasks, loading, error,
    addTask, updateTask, deleteTask, toggleTask,
    addSubtask, updateSubtask, toggleSubtask, deleteSubtask,
  };
}
