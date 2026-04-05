import React, { createContext, useContext, useEffect, useState } from 'react';
import { initOnlineOfflineListener, isOnline, syncPendingOperations } from '../services/syncService';
import { useAuth } from './AuthContext';

const OfflineContext = createContext();

export function OfflineProvider({ children }) {
  const { user } = useAuth();
  const [isOnlineMode, setIsOnlineMode] = useState(isOnline());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Listen for online/offline changes
  useEffect(() => {
    const cleanup = initOnlineOfflineListener(async (online) => {
      setIsOnlineMode(online);
      setSyncError(null);

      // When coming back online, sync pending operations
      if (online && user?.uid) {
        setIsSyncing(true);
        try {
          const result = await syncPendingOperations(user.uid);
          if (result.failed > 0) {
            setSyncError(`${result.failed} operation(s) failed to sync`);
          }
        } catch (err) {
          console.error('Sync error:', err);
          setSyncError('Failed to sync data');
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return cleanup;
  }, [user?.uid]);

  return (
    <OfflineContext.Provider value={{ isOnlineMode, isSyncing, syncError }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
}
