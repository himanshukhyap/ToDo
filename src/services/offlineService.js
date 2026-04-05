// Offline data management using IndexedDB
const DB_NAME = 'NoteTaskOffline';
const DB_VERSION = 1;

let db = null;

const STORES = {
  TASKS: 'tasks',
  NOTES: 'notes',
  OPERATIONS: 'pending_operations',
};

// Initialize IndexedDB
export async function initOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const newDB = event.target.result;

      // Create object stores
      if (!newDB.objectStoreNames.contains(STORES.TASKS)) {
        const taskStore = newDB.createObjectStore(STORES.TASKS, { keyPath: 'id' });
        taskStore.createIndex('uid', 'uid', { unique: false });
        taskStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!newDB.objectStoreNames.contains(STORES.NOTES)) {
        const noteStore = newDB.createObjectStore(STORES.NOTES, { keyPath: 'id' });
        noteStore.createIndex('uid', 'uid', { unique: false });
        noteStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!newDB.objectStoreNames.contains(STORES.OPERATIONS)) {
        const opStore = newDB.createObjectStore(STORES.OPERATIONS, { keyPath: 'id', autoIncrement: true });
        opStore.createIndex('uid', 'uid', { unique: false });
        opStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

// Save task to offline storage
export async function saveTaskOffline(task) {
  if (!db) await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.TASKS], 'readwrite');
    const store = tx.objectStore(STORES.TASKS);
    const request = store.put({
      ...task,
      _local: true,
      _lastSynced: null,
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Save note to offline storage
export async function saveNoteOffline(note) {
  if (!db) await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.NOTES], 'readwrite');
    const store = tx.objectStore(STORES.NOTES);
    const request = store.put({
      ...note,
      _local: true,
      _lastSynced: null,
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Get all tasks for user (offline)
export async function getTasksOffline(uid) {
  if (!db) await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.TASKS], 'readonly');
    const store = tx.objectStore(STORES.TASKS);
    const index = store.index('uid');
    const request = index.getAll(uid);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const tasks = request.result.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      resolve(tasks);
    };
  });
}

// Get all notes for user (offline)
export async function getNotesOffline(uid) {
  if (!db) await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.NOTES], 'readonly');
    const store = tx.objectStore(STORES.NOTES);
    const index = store.index('uid');
    const request = index.getAll(uid);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const notes = request.result.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      resolve(notes);
    };
  });
}

// Delete task from offline storage
export async function deleteTaskOffline(taskId) {
  if (!db) await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.TASKS], 'readwrite');
    const store = tx.objectStore(STORES.TASKS);
    const request = store.delete(taskId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Delete note from offline storage
export async function deleteNoteOffline(noteId) {
  if (!db) await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.NOTES], 'readwrite');
    const store = tx.objectStore(STORES.NOTES);
    const request = store.delete(noteId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Add pending operation queue (for sync later)
export async function queueOperation(uid, type, data) {
  if (!db) await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.OPERATIONS], 'readwrite');
    const store = tx.objectStore(STORES.OPERATIONS);
    const request = store.add({
      uid,
      type, // 'add_task', 'update_task', 'delete_task', 'add_note', 'update_note', 'delete_note'
      data,
      status: 'pending', // pending, syncing, synced, failed
      createdAt: new Date(),
      attempts: 0,
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Get pending operations for user
export async function getPendingOperations(uid) {
  if (!db) await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.OPERATIONS], 'readonly');
    const store = tx.objectStore(STORES.OPERATIONS);
    const index = store.index('uid');
    const request = index.getAll(uid);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const ops = request.result.filter(op => op.status === 'pending');
      resolve(ops);
    };
  });
}

// Update operation status
export async function updateOperationStatus(opId, status) {
  if (!db) await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.OPERATIONS], 'readwrite');
    const store = tx.objectStore(STORES.OPERATIONS);
    const getRequest = store.get(opId);

    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const op = getRequest.result;
      if (op) {
        op.status = status;
        const updateRequest = store.put(op);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      } else {
        reject(new Error('Operation not found'));
      }
    };
  });
}

// Clear all offline data (careful!)
export async function clearOfflineDB() {
  if (!db) await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.TASKS, STORES.NOTES, STORES.OPERATIONS], 'readwrite');
    
    const requests = [
      tx.objectStore(STORES.TASKS).clear(),
      tx.objectStore(STORES.NOTES).clear(),
      tx.objectStore(STORES.OPERATIONS).clear(),
    ];

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
  });
}

// Update task in offline storage
export async function updateTaskOffline(taskId, updates) {
  if (!db) await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.TASKS], 'readwrite');
    const store = tx.objectStore(STORES.TASKS);
    const getRequest = store.get(taskId);

    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const task = getRequest.result;
      if (task) {
        const updated = { ...task, ...updates, _lastSynced: null };
        const putRequest = store.put(updated);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve(updated);
      } else {
        reject(new Error('Task not found'));
      }
    };
  });
}

// Update note in offline storage
export async function updateNoteOffline(noteId, updates) {
  if (!db) await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.NOTES], 'readwrite');
    const store = tx.objectStore(STORES.NOTES);
    const getRequest = store.get(noteId);

    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const note = getRequest.result;
      if (note) {
        const updated = { ...note, ...updates, _lastSynced: null };
        const putRequest = store.put(updated);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve(updated);
      } else {
        reject(new Error('Note not found'));
      }
    };
  });
}
