import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Copy, Eye, FileText, Pencil, Plus, Share2, Trash2, X } from "lucide-react-native";
import { useNotes } from "../../../hooks/useNotes";
import { useTheme } from "../../../context/ThemeContext";
import { useDialogs } from "../../../context/DialogContext";
import HtmlView from "../../../components/HtmlView";
import { Badge, Btn, EmptyState, ErrorBanner, IconBtn, Loading, SearchBar, formatDate } from "../../../components/ui";
import { getNoteColor } from "../../../theme";
import { copyText, shareContent } from "../../../utils/share";

const PREVIEW_HEIGHT = 220;

function noteHtml(note) {
  return note.htmlContent || `<p>${note.content || ""}</p>`;
}

/* ── Note Card ───────────────────────────────────────── */
function NoteCard({ note, onDelete, onOpen }) {
  const { confirmDelete, errorAlert } = useDialogs();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const cfg = getColorCfg(note.color);

  const handleCopy = async () => {
    await copyText(note.textContent || note.content || "");
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const handleShare = async () => {
    const r = await shareContent("Note", note.textContent || note.content || "");
    if (r === "copied" || r === "shared") { setShared(true); setTimeout(() => setShared(false), 2000); }
  };
  const handleDelete = async () => {
    const ok = await confirmDelete("this note");
    if (!ok) return;
    try {
      await onDelete(note.id);
    } catch (e) {
      errorAlert(`Could not delete note: ${e.message}\n\nMake sure Firestore rules are deployed.`);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: cfg.bg }]}>
      <Pressable onPress={() => onOpen(note)}>
        <View style={{ maxHeight: PREVIEW_HEIGHT, overflow: "hidden" }}>
          <View onLayout={(e) => setOverflow(e.nativeEvent.layout.height > PREVIEW_HEIGHT + 4)}>
            <HtmlView html={noteHtml(note)} color={cfg.text} fontSize={13.5} />
          </View>
        </View>
        {overflow && (
          <View style={styles.readMore}>
            <Eye size={12} color={cfg.text} />
            <Text style={{ color: cfg.text, fontSize: 12, fontWeight: "600" }}>Read more</Text>
          </View>
        )}
      </Pressable>

      <View style={[styles.footer, { borderTopColor: cfg.text + "22" }]}>
        <Text style={[styles.ts, { color: cfg.text + "aa" }]}>{formatDate(note.updatedAt)}</Text>
        <View style={styles.actions}>
          <IconBtn size={28} onPress={handleShare}>{shared ? <Check size={14} color={cfg.text} /> : <Share2 size={14} color={cfg.text} />}</IconBtn>
          <IconBtn size={28} onPress={handleCopy}>{copied ? <Check size={14} color={cfg.text} /> : <Copy size={14} color={cfg.text} />}</IconBtn>
          <IconBtn size={28} onPress={() => router.push(`/note/${note.id}`)}><Pencil size={14} color={cfg.text} /></IconBtn>
          <IconBtn size={28} onPress={handleDelete}><Trash2 size={14} color={cfg.text} /></IconBtn>
        </View>
      </View>
    </View>
  );
}

function getColorCfg(bg) {
  return getNoteColor(bg);
}

/* ── Full note view (Read more) ──────────────────────── */
function NoteModal({ note, onClose }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  if (!note) return null;
  const cfg = getColorCfg(note.color);
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modal, { backgroundColor: cfg.bg }]}>
          <View style={styles.modalHead}>
            <Text style={{ color: cfg.text + "aa", fontSize: 12 }}>{formatDate(note.updatedAt)}</Text>
            <View style={{ flexDirection: "row" }}>
              <IconBtn onPress={() => { onClose(); router.push(`/note/${note.id}`); }}><Pencil size={16} color={cfg.text} /></IconBtn>
              <IconBtn onPress={onClose}><X size={18} color={cfg.text} /></IconBtn>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 4 }}>
            <HtmlView html={noteHtml(note)} color={cfg.text} fontSize={15.5} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ── Main Notes screen ───────────────────────────────── */
export default function Notes() {
  const { colors } = useTheme();
  const { notes, loading, error, deleteNote } = useNotes();
  const [search, setSearch] = useState("");
  const [activeNoteId, setActiveNoteId] = useState(null);
  const { open } = useLocalSearchParams();

  // Opened from global search: /notes?open=<id>
  useEffect(() => {
    if (typeof open !== "string" || !open) return;
    setActiveNoteId(open);
    router.setParams({ open: "" });
  }, [open]);

  const filtered = notes.filter((n) =>
    (n.textContent || n.content || "").toLowerCase().includes(search.toLowerCase())
  );
  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  // Two-column masonry
  const cols = [[], []];
  filtered.forEach((n, i) => cols[i % 2].push(n));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <View style={styles.panelHead}>
          <FileText size={18} color={colors.text} />
          <Text style={[styles.panelTitle, { color: colors.text }]}>Notes</Text>
          <Badge value={notes.length} />
          <View style={{ flex: 1 }} />
          <Btn small title="New Note" icon={<Plus size={15} color="#fff" />} onPress={() => router.push("/note/new")} />
        </View>
        <View style={{ marginVertical: 12 }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search notes…" />
        </View>

        <ErrorBanner text={error} />

        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={40} strokeWidth={1} color={colors.text3} />}
            text={search ? "No notes match your search." : "No notes yet. Tap 'New Note' to start."}
          />
        ) : (
          <View style={styles.grid}>
            {cols.map((col, ci) => (
              <View key={ci} style={styles.col}>
                {col.map((note) => (
                  <NoteCard key={note.id} note={note} onDelete={deleteNote} onOpen={(n) => setActiveNoteId(n.id)} />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push("/note/new")}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}
      >
        <Plus size={26} color="#fff" />
      </Pressable>

      <NoteModal note={activeNote} onClose={() => setActiveNoteId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  panelHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  panelTitle: { fontSize: 18, fontWeight: "700" },
  grid: { flexDirection: "row", gap: 10 },
  col: { flex: 1, gap: 10 },
  card: { borderRadius: 12, padding: 12, paddingBottom: 6 },
  readMore: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, marginTop: 8, paddingTop: 4, flexWrap: "wrap" },
  ts: { fontSize: 10.5 },
  actions: { flexDirection: "row", marginLeft: "auto" },
  fab: {
    position: "absolute", right: 20, bottom: 28, width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center", elevation: 6,
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  modalOverlay: { flex: 1, paddingHorizontal: 16, justifyContent: "center" },
  modal: { borderRadius: 16, maxHeight: "100%", overflow: "hidden" },
  modalHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 18, paddingRight: 6, paddingTop: 6 },
});
