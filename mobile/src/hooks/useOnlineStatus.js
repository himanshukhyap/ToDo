import { useState, useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";

/**
 * useOnlineStatus
 * Returns: { isOnline, wasOffline }
 *   isOnline   — current network status
 *   wasOffline — true briefly after coming back online (to show "Synced!" banner)
 */
export function useOnlineStatus() {
  const [isOnline,   setIsOnline]   = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const prevRef = useRef(true);
  const timerRef = useRef(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      if (online && !prevRef.current) {
        setWasOffline(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setWasOffline(false), 4000);
      }
      if (!online) setWasOffline(false);
      prevRef.current = online;
      setIsOnline(online);
    });
    return () => { unsub(); clearTimeout(timerRef.current); };
  }, []);

  return { isOnline, wasOffline };
}
