// Sync pending operations with Firebase when online
import { 
  addDoc, updateDoc, deleteDoc, doc, collection, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  getPendingOperations,
  updateOperationStatus,
  deleteTaskOffline,
  deleteNoteOffline,
} from './offlineService';

export async function syncPendingOperations(uid) {
  try {
    const operations = await getPendingOperations(uid);
    
    if (operations.length === 0) {
      console.log('[Sync] No pending operations');
      return { synced: 0, failed: 0 };
    }

    console.log(`[Sync] Processing ${operations.length} pending operations`);
    
    let synced = 0;
    let failed = 0;

    for (const op of operations) {
      try {
        await updateOperationStatus(op.id, 'syncing');
        
        switch (op.type) {
          case 'add_task':
            await addDoc(collection(db, 'tasks'), {
              ...op.data,
              uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            synced++;
            break;

          case 'add_note':
            await addDoc(collection(db, 'notes'), {
              ...op.data,
              uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            synced++;
            break;

          case 'update_task':
            if (op.data.id) {
              await updateDoc(doc(db, 'tasks', op.data.id), {
                ...op.data,
                updatedAt: serverTimestamp(),
              });
              synced++;
            } else {
              throw new Error('Task ID missing');
            }
            break;

          case 'update_note':
            if (op.data.id) {
              await updateDoc(doc(db, 'notes', op.data.id), {
                ...op.data,
                updatedAt: serverTimestamp(),
              });
              synced++;
            } else {
              throw new Error('Note ID missing');
            }
            break;

          case 'delete_task':
            if (op.data.id) {
              await deleteDoc(doc(db, 'tasks', op.data.id));
              await deleteTaskOffline(op.data.id);
              synced++;
            } else {
              throw new Error('Task ID missing');
            }
            break;

          case 'delete_note':
            if (op.data.id) {
              await deleteDoc(doc(db, 'notes', op.data.id));
              await deleteNoteOffline(op.data.id);
              synced++;
            } else {
              throw new Error('Note ID missing');
            }
            break;

          default:
            console.warn(`[Sync] Unknown operation type: ${op.type}`);
            failed++;
        }

        await updateOperationStatus(op.id, 'synced');
      } catch (err) {
        console.error(`[Sync] Error syncing operation ${op.id}:`, err);
        failed++;
        await updateOperationStatus(op.id, 'failed');
      }
    }

    console.log(`[Sync] Completed: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  } catch (err) {
    console.error('[Sync] Fatal error:', err);
    return { synced: 0, failed: operations?.length || 0 };
  }
}

// Monitor online/offline status
export function initOnlineOfflineListener(callback) {
  const handleOnline = () => {
    console.log('[Network] Back Online!');
    callback(true);
  };

  const handleOffline = () => {
    console.log('[Network] Went Offline');
    callback(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Check if we're currently online
export function isOnline() {
  return navigator.onLine;
}
