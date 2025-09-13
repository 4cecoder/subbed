import { useState, useEffect } from "react";
import { UseSyncReturn } from "@/lib/types";
import { apiClient } from "@/lib/api-client";

export function useSync(): UseSyncReturn {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const forceSync = async () => {
    try {
      await apiClient.syncData();
    } catch (error) {
      console.error('Manual sync failed:', error);
      throw error;
    }
  };

  const startSync = () => {
    // Sync manager handles this automatically
    console.log('Sync started');
  };

  const stopSync = () => {
    // Sync manager handles this automatically
    console.log('Sync stopped');
  };

  return {
    isOnline,
    forceSync,
    startSync,
    stopSync,
  };
}