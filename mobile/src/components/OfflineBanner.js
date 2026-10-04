import { StyleSheet, Text, View } from "react-native";
import { CheckCircle, RefreshCw, WifiOff } from "lucide-react-native";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { usePendingWrites } from "../hooks/usePendingWrites";
import { useTheme } from "../context/ThemeContext";

/**
 *  1. Offline  → orange banner explaining local-save mode
 *  2. Syncing  → blue banner while pending writes are flushing
 *  3. Synced   → green flash confirming everything is saved
 *  4. Nothing  → hidden when fully online and in sync
 */
export default function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { hasPending, syncedAt } = usePendingWrites();

  if (isOnline && !hasPending && !wasOffline) return null;

  if (!isOnline) {
    return (
      <Banner bg="#b45309" icon={<WifiOff size={15} color="#fff" />}>
        You're offline — changes are saved on this device
        {hasPending ? " and will sync automatically when reconnected" : ""}
      </Banner>
    );
  }

  if (hasPending) {
    return (
      <Banner bg="#2563eb" icon={<RefreshCw size={15} color="#fff" />}>
        Back online — syncing your offline changes…
      </Banner>
    );
  }

  return (
    <Banner bg="#059669" icon={<CheckCircle size={15} color="#fff" />}>
      All changes synced{syncedAt ? ` at ${syncedAt.toLocaleTimeString()}` : ""}
    </Banner>
  );
}

function Banner({ bg, icon, children }) {
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      {icon}
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

export function OnlineDot() {
  const { isOnline } = useOnlineStatus();
  const { colors } = useTheme();
  return <View style={[styles.dot, { backgroundColor: isOnline ? colors.green : colors.orange }]} />;
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  text: { color: "#fff", fontSize: 12.5, fontWeight: "500", flexShrink: 1 },
  dot: { width: 9, height: 9, borderRadius: 5 },
});
