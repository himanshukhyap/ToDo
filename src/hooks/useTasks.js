import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, where, orderBy, serverTimestamp, arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { isOnline } from "../services/syncService";
import {
  saveTaskOffline,
  getTasksOffline,
  deleteTaskOffline,
  updateTaskOffline,
  queueOperation,
} from "../services/offlineService";

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
        const tasksData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTasks(tasksData);
        setLoading(false);
        setError(null);
      },
      err => {
        console.error("[Tasks] onSnapshot error:", err.code, err.message);
        // If offline or error, load from offline storage
        if (!isOnline() || err.code === 'unavailable') {
          console.log("[Tasks] Loading from offline storage");
          getTasksOffline(user.uid)
            .then(offlineTasks => {
              setTasks(offlineTasks);
              setError("Offline - showing local data");
              setLoading(false);
            })
            .catch(offlineErr => {
              console.error("[Tasks] Offline load error:", offlineErr);
              setError(`Failed to load tasks: ${err.message}`);
              setLoading(false);
            });
        } else {
          setError(`Failed to load tasks: ${err.message}`);
          setLoading(false);
        }
      }
    );
  }, [user]);

  const addTask = async (title, categoryId) => {
    if (!title.trim()) return;
    
    const taskData = {
      title: title.trim(),
      categoryId: categoryId || null,
      completed: false,
      subtasks: [],
      uid: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      if (isOnline()) {
        // Add to Firebase
        await addDoc(collection(db, "tasks"), {
          ...taskData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Offline: save locally and queue for sync
        const id = 'local_' + genId();
        await saveTaskOffline({ id, ...taskData });
        await queueOperation(user.uid, 'add_task', taskData);
        console.log("[Tasks] Added offline, queued for sync");
      }
    } catch (e) {
      console.error("[Tasks] addTask error:", e.code, e.message);
      // Fallback: still try to save offline
      try {
        const id = 'local_' + genId();
        await saveTaskOffline({ id, ...taskData });
        await queueOperation(user.uid, 'add_task', taskData);
      } catch (offlineErr) {
        console.error("[Tasks] Offline save failed:", offlineErr);
      }
      setError(`Add failed: ${e.message}`);
      throw e;
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date(),
      };

      if (isOnline()) {
        // Update Firebase
        await updateDoc(doc(db, "tasks", id), {
          ...updatedData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Offline: update locally and queue for sync
        await updateTaskOffline(id, updatedData);
        await queueOperation(user.uid, 'update_task', { id, ...updatedData });
        console.log("[Tasks] Updated offline, queued for sync");
      }
    } catch (e) {
      console.error("[Tasks] updateTask error:", e.code, e.message);
      // Fallback: try offline
      try {
        await updateTaskOffline(id, updates);
        await queueOperation(user.uid, 'update_task', { id, ...updates });
      } catch (offlineErr) {
        console.error("[Tasks] Offline update failed:", offlineErr);
      }
      setError(`Update failed: ${e.message}`);
      throw e;
    }
  };

  const deleteTask = async (id) => {
    console.log("[Tasks] Deleting task:", id);
    try {
      if (isOnline()) {
        await deleteDoc(doc(db, "tasks", id));
      } else {
        await deleteTaskOffline(id);
        await queueOperation(user.uid, 'delete_task', { id });
        console.log("[Tasks] Deleted offline, queued for sync");
      }
      console.log("[Tasks] Deleted successfully:", id);
    } catch (e) {
      console.error("[Tasks] deleteTask error:", e.code, e.message);
      // Fallback: try offline delete
      try {
        await deleteTaskOffline(id);
        await queueOperation(user.uid, 'delete_task', { id });
      } catch (offlineErr) {
        console.error("[Tasks] Offline delete failed:", offlineErr);
      }
      setError(`Delete failed: ${e.message}`);
      throw e;
    }
  };

  const toggleTask = (id, current) =>
    updateTask(id, { completed: !current });

  const addSubtask = async (taskId, text) => {
    if (!text.trim()) return;
    const subtask = { id: genId(), text: text.trim(), completed: false };
    try {
      if (isOnline()) {
        await updateDoc(doc(db, "tasks", taskId), {
          subtasks: arrayUnion(subtask),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Offline: fetch, update, save
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          const updated = [...(task.subtasks || []), subtask];
          await updateTaskOffline(taskId, { 
            subtasks: updated,
            updatedAt: new Date(),
          });
          await queueOperation(user.uid, 'update_task', { 
            id: taskId, 
            subtasks: updated 
          });
        }
      }
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
      if (isOnline()) {
        await updateDoc(doc(db, "tasks", taskId), {
          subtasks: updated,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateTaskOffline(taskId, { 
          subtasks: updated,
          updatedAt: new Date(),
        });
        await queueOperation(user.uid, 'update_task', { 
          id: taskId, 
          subtasks: updated 
        });
      }
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
      if (isOnline()) {
        await updateDoc(doc(db, "tasks", taskId), {
          subtasks: updated,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateTaskOffline(taskId, { 
          subtasks: updated,
          updatedAt: new Date(),
        });
        await queueOperation(user.uid, 'update_task', { 
          id: taskId, 
          subtasks: updated 
        });
      }
    } catch (e) {
      console.error("[Tasks] toggleSubtask error:", e.code, e.message);
      throw e;
    }
  };

  const deleteSubtask = async (taskId, task, subtaskId) => {
    const updated = (task.subtasks || []).filter(s => s.id !== subtaskId);
    try {
      if (isOnline()) {
        await updateDoc(doc(db, "tasks", taskId), {
          subtasks: updated,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateTaskOffline(taskId, { 
          subtasks: updated,
          updatedAt: new Date(),
        });
        await queueOperation(user.uid, 'update_task', { 
          id: taskId, 
          subtasks: updated 
        });
      }
    } catch (e) {
      console.error("[Tasks] deleteSubtask error:", e.code, e.message);
      throw e;
    }
  };

  return {
    tasks, loading, error,
    addTask, updateTask, deleteTask, toggleTask,
    addSubtask, updateSubtask, toggleSubtask, deleteSubtask,
  };
}
