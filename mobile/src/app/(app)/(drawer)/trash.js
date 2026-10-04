import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { BookOpen, CheckSquare, RotateCcw, StickyNote, Trash2, XCircle } from "lucide-react-native";
import { useAppTrash } from "../../../hooks/useAppTrash";
import { useTrash as useNotebookTrash } from "../../../hooks/useTrash";
import { purgeTrashItem as purgeAppTrashItem } from "../../../services/trashService";
import { purgeTrashItem as purgeNbTrashItem } from "../../../services/notebookDeleteService";
import { useTheme } from "../../../context/ThemeContext";
import { useDialogs } from "../../../context/DialogContext";
import { Badge, Btn, EmptyState, Loading, formatDate } from "../../../components/ui";

function TrashList({ title, icon, items, loading, onRestore, onPurge, onPurgeAll }) {
  const { colors } = useTheme();
  const { confirmDelete, confirmBulkDelete, errorAlert, toast } = useDialogs();
  const [busyId, setBusyId] = useState(null);

  const handleRestore = async (item) => {
    setBusyId(item.id);
    try {
      await onRestore(item);
      toast("success", "Restored");
    } catch (e) {
      const msg =
        e?.code === "permission-denied"
          ? `Restore blocked (permission-denied).\n\nPossible causes:\n1) Wrong Firebase project deployed.\n2) Live Firestore rules still old.\n3) Trash doc me uid missing/galat (old data).\n\nDetails: ${e?.message || "permission-denied"}`
          : (e?.message || "Restore failed.");
      errorAlert(msg);
    } finally {
      setBusyId(null);
    }
  };

  const handlePurge = async (item) => {
    const ok = await confirmDelete("this item permanently");
    if (!ok) return;
    setBusyId(item.id);
    try {
      await onPurge(item.id);
      toast("success", "Deleted permanently");
    } catch (e) {
      errorAlert(e.message || "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handlePurgeAll = async () => {
    const ok = await confirmBulkDelete("trash item", items.length);
    if (!ok) return;
    try {
      await onPurgeAll();
      toast("success", "Trash cleared");
    } catch (e) {
      errorAlert(e.message || "Clear failed.");
    }
  };

  return (
    <FlatList
      data={loading ? [] : items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
      ListHeaderComponent={(
        <View style={styles.panelHead}>
          {icon}
          <Text style={[styles.panelTitle, { color: colors.text }]}>{title}</Text>
          <Badge value={items.length} />
          <View style={{ flex: 1 }} />
          {items.length > 0 && (
            <Btn small variant="ghost" title="Empty" icon={<Trash2 size={14} color={colors.text} />} onPress={handlePurgeAll} />
          )}
        </View>
      )}
      ListEmptyComponent={
        loading
          ? <Loading text="Loading…" />
          : <EmptyState icon={<Trash2 size={38} strokeWidth={1} color={colors.text3} />} text="Trash is empty." sub="Items auto-delete after 30 days." />
      }
      renderItem={({ item }) => (
        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text numberOfLines={2} style={[styles.rowTitle, { color: colors.text }]}>
            {String(item.title || item.notebookName || item.sectionName || item.pageName || item.name || "Untitled").replace(/\s+/g, " ").trim()}
          </Text>
          <View style={styles.meta}>
            <Text style={{ color: colors.text3, fontSize: 12 }}>Deleted: {formatDate(item.deletedAt)}</Text>
            {item.expireAt?.toDate && <Text style={{ color: colors.text3, fontSize: 12 }}>Auto delete: {formatDate(item.expireAt)}</Text>}
          </View>
          <View style={styles.actions}>
            <Btn small variant="ghost" title="Restore" icon={<RotateCcw size={14} color={colors.text} />}
              disabled={busyId === item.id} onPress={() => handleRestore(item)} style={{ flex: 1 }} />
            <Btn small variant="danger" title="Delete" icon={<XCircle size={14} color="#fff" />}
              disabled={busyId === item.id} onPress={() => handlePurge(item)} style={{ flex: 1 }} />
          </View>
        </View>
      )}
    />
  );
}

export default function Trash() {
  const { colors } = useTheme();
  const app = useAppTrash();
  const nb = useNotebookTrash();
  const [tab, setTab] = useState("notes");

  const noteItems = useMemo(() => app.items.filter((i) => i.sourceCollection === "notes"), [app.items]);
  const taskItems = useMemo(() => app.items.filter((i) => i.sourceCollection === "tasks"), [app.items]);

  // "Empty" only clears the list that is on screen
  const purgeList = (list, purge) => async () => { for (const item of list) await purge(item.id); };

  const tabs = [
    { key: "notes", label: "Notes", icon: StickyNote, count: noteItems.length },
    { key: "tasks", label: "Tasks", icon: CheckSquare, count: taskItems.length },
    { key: "notebook", label: "Notebook", icon: BookOpen, count: nb.items.length },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.tabs, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
        {tabs.map((t) => {
          const on = tab === t.key;
          const Icon = t.icon;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, on && { backgroundColor: colors.surface }]}>
              <Icon size={14} color={on ? colors.accent : colors.text2} />
              <Text style={{ color: on ? colors.text : colors.text2, fontWeight: on ? "600" : "400", fontSize: 13 }}>{t.label}</Text>
              <Badge value={t.count} small />
            </Pressable>
          );
        })}
      </View>

      {tab === "notes" && (
        <TrashList title="Notes Trash" icon={<StickyNote size={18} color={colors.text} />}
          items={noteItems} loading={app.loading} onRestore={app.restore} onPurge={app.purge}
          onPurgeAll={purgeList(noteItems, purgeAppTrashItem)} />
      )}
      {tab === "tasks" && (
        <TrashList title="Tasks Trash" icon={<CheckSquare size={18} color={colors.text} />}
          items={taskItems} loading={app.loading} onRestore={app.restore} onPurge={app.purge}
          onPurgeAll={purgeList(taskItems, purgeAppTrashItem)} />
      )}
      {tab === "notebook" && (
        <TrashList title="Notebook Trash" icon={<BookOpen size={18} color={colors.text} />}
          items={nb.items} loading={nb.loading} onRestore={nb.restore} onPurge={nb.purge}
          onPurgeAll={purgeList(nb.items, purgeNbTrashItem)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", borderWidth: 1, borderRadius: 10, padding: 3, margin: 14, marginBottom: 0 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: 8 },
  panelHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  panelTitle: { fontSize: 17, fontWeight: "700" },
  row: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10, gap: 8 },
  rowTitle: { fontSize: 15, fontWeight: "500" },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actions: { flexDirection: "row", gap: 8 },
});
