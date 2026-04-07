import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { usePendingWrites } from "../hooks/usePendingWrites";
import { WifiOff, CheckCircle, RefreshCw } from "lucide-react";

/**
 * OfflineBanner
 *
 * Renders one of three states at the top of the app:
 *  1. Offline  → orange banner explaining local-save mode
 *  2. Syncing  → blue pulsing banner while pending writes are flushing
 *  3. Synced   → green flash (4 s) confirming everything is saved
 *  4. Nothing  → hidden when fully online and in sync
 */
export default function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { hasPending, syncedAt  } = usePendingWrites();

  // Fully online, nothing pending, no recent sync → hide
  if (isOnline && !hasPending && !wasOffline) return null;

  // Offline
  if (!isOnline) {
    return (
      <div className="offline-banner offline">
        <WifiOff size={15} />
        <span>
          You're offline — all changes are saved locally
          {hasPending && " and will sync automatically when reconnected"}
        </span>
      </div>
    );
  }

  // Back online and still flushing unsynced writes
  if (isOnline && hasPending) {
    return (
      <div className="offline-banner syncing">
        <RefreshCw size={15} className="spin" />
        <span>Back online — syncing your offline changes…</span>
      </div>
    );
  }

  // Just finished syncing (wasOffline briefly true) or syncedAt just set
  return (
    <div className="offline-banner online">
      <CheckCircle size={15} />
      <span>
        All changes synced
        {syncedAt ? ` at ${syncedAt.toLocaleTimeString()}` : ""}
      </span>
    </div>
  );
}

/**
 * OnlineDot — small indicator used in the Sidebar footer (unchanged API).
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

