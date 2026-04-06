import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { Wifi, WifiOff, RefreshCw, CheckCircle } from "lucide-react";

/**
 * OfflineBanner
 * Shows:
 *  - Orange banner when offline  → "You're offline. Changes will sync when reconnected."
 *  - Green flash when back online → "Back online! Syncing your changes…"
 *  - Nothing when normally online
 */
export default function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) return null;  // Normal online state — hide

  if (!isOnline) {
    return (
      <div className="offline-banner offline">
        <WifiOff size={15}/>
        <span>You're offline — all changes saved locally, will sync when reconnected</span>
      </div>
    );
  }

  // wasOffline — just came back online
  return (
    <div className="offline-banner online">
      <CheckCircle size={15}/>
      <span>Back online! Syncing your changes…</span>
    </div>
  );
}

/**
 * Small dot indicator in sidebar footer (always visible)
 */
export function OnlineDot() {
  const { isOnline } = useOnlineStatus();
  return (
    <span
      className={`online-dot ${isOnline ? "online" : "offline"}`}
      title={isOnline ? "Online" : "Offline — working locally"}
    />
  );
}
