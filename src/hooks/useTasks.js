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
    let isMounted = true;

    // Load offline data first so they're visible immediately
    const loadOfflineData = async () => {
      try {
        const offlineTasks = await getTasksOffline(user.uid);
        if (isMounted && offlineTasks.length > 0) {
          console.log("[Tasks] Loaded offline data:", offlineTasks.length);
          setTasks(offlineTasks);
        }
      } catch (err) {
        console.error("[Tasks] Failed to load offline data:", err);
      }
    };

    // Load offline data immediately
    loadOfflineData();

    // Then try to sync with Firebase
    const q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(
      q,
      snap => {
        if (isMounted) {
          const tasksData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setTasks(tasksData);
          setLoading(false);
          setError(null);
        }
      },
      err => {
        console.error("[Tasks] onSnapshot error:", err.code, err.message);
        if (isMounted) {
          setLoading(false);
          if (!isOnline()) {
            setError(null); // Don't show error when offline
          } else {
            setError(`Connection error: ${err.message}`);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user]);

  const addTask = async (title, categoryId) => {
    if (!title.trim()) return;
    
    const id = 'local_' + genId();
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
      // Save locally first
      await saveTaskOffline({ id, ...taskData });
      
      // Update UI immediately
      setTasks(prev => [{ id, ...taskData }, ...prev]);
      
      // Try to sync to Firebase
      if (isOnline()) {
        try {
          const fbRef = await addDoc(collection(db, "tasks"), {
            ...taskData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          console.log("[Tasks] Synced to Firebase:", fbRef.id);
        } catch (fbErr) {
          // Failed to sync - queue for later
          await queueOperation(user.uid, 'add_task', taskData);
          console.log("[Tasks] Firebase failed, queued:", fbErr.message);
        }
      } else {
        // Offline - queue for sync
        await queueOperation(user.uid, 'add_task', taskData);
        console.log("[Tasks] Added offline, queued for sync");
      }
    } catch (e) {
      console.error("[Tasks] addTask error:", e);
      setError(`Failed to save: ${e.message}`);
      throw e;
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date(),
      };

      // Update locally first
      await updateTaskOffline(id, updatedData);
      
      // Update UI immediately
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, ...updatedData } : t
      ));

      // Try to sync to Firebase
      if (isOnline()) {
        try {
          await updateDoc(doc(db, "tasks", id), {
            ...updatedData,
            updatedAt: serverTimestamp(),
          });
          console.log("[Tasks] Updated on Firebase:", id);
        } catch (fbErr) {
          // Failed to sync - queue for later
          await queueOperation(user.uid, 'update_task', { id, ...updatedData });
          console.log("[Tasks] Firebase failed, queued:", fbErr.message);
        }
      } else {
        // Offline - queue for sync
        await queueOperation(user.uid, 'update_task', { id, ...updatedData });
        console.log("[Tasks] Updated offline, queued for sync");
      }
    } catch (e) {
      console.error("[Tasks] updateTask error:", e);
      setError(`Failed to update: ${e.message}`);
      throw e;
    }
  };

  const deleteTask = async (id) => {
    console.log("[Tasks] Deleting task:", id);
    try {
      // Delete locally first
      await deleteTaskOffline(id);
      
      // Update UI immediately
      setTasks(prev => prev.filter(t => t.id !== id));

      // Try to sync deletion to Firebase
      if (isOnline()) {
        try {
          await deleteDoc(doc(db, "tasks", id));
          console.log("[Tasks] Deleted on Firebase:", id);
        } catch (fbErr) {
          // Failed to sync - queue for later
          await queueOperation(user.uid, 'delete_task', { id });
          console.log("[Tasks] Firebase failed, queued:", fbErr.message);
        }
      } else {
        // Offline - queue for sync
        await queueOperation(user.uid, 'delete_task', { id });
        console.log("[Tasks] Deleted offline, queued for sync");
      }
    } catch (e) {
      console.error("[Tasks] deleteTask error:", e);
      setError(`Failed to delete: ${e.message}`);
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
