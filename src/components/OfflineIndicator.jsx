import React, { useState, useEffect } from 'react';
import { useOffline } from '../context/OfflineContext';

export function OfflineIndicator() {
  const { isOnlineMode, isSyncing, syncError } = useOffline();
  const [showAlert, setShowAlert] = useState(!isOnlineMode);

  useEffect(() => {
    if (!isOnlineMode) {
      setShowAlert(true);
    } else {
      // Auto-hide after 3 seconds when back online
      const timer = setTimeout(() => {
        if (!syncError) {
          setShowAlert(false);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnlineMode, syncError]);

  if (!showAlert) return null;

  if (!isOnlineMode) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-100 border-b-2 border-amber-400 text-amber-900 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">📍 Offline Mode - Data saves locally, syncs when online</span>
        </div>
        <button 
          onClick={() => setShowAlert(false)} 
          className="text-xs px-2 py-1 hover:bg-amber-200 rounded transition"
        >
          ✕
        </button>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-100 border-b-2 border-blue-400 text-blue-900 px-4 py-2 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">⏳ Syncing data with server...</span>
        </div>
      </div>
    );
  }

  if (syncError) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-100 border-b-2 border-red-400 text-red-900 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">⚠️ Sync Error: {syncError}</span>
        </div>
        <button 
          onClick={() => setShowAlert(false)} 
          className="text-xs px-2 py-1 hover:bg-red-200 rounded transition"
        >
          ✕
        </button>
      </div>
    );
  }

  if (isOnlineMode) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-100 border-b-2 border-green-400 text-green-900 px-4 py-2 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <span className="text-sm font-medium">✓ Back Online - Data synced</span>
        </div>
      </div>
    );
  }

  return null;
}
