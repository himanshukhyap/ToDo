import { useState, useEffect } from "react";

/**
 * useOnlineStatus
 * Returns: { isOnline, wasOffline }
 *   isOnline  — current network status
 *   wasOffline — true briefly after coming back online (to show "Synced!" toast)
 */
export function useOnlineStatus() {
  const [isOnline,   setIsOnline]   = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);          // came back online — show sync toast
      setTimeout(() => setWasOffline(false), 4000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}
