import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, ChevronDown, X } from "lucide-react-native";
import { useNotes } from "../../../hooks/useNotes";
import { useTheme } from "../../../context/ThemeContext";
import { useDialogs } from "../../../context/DialogContext";
import { RichEditorView, useRichEditor } from "../../../components/RichEditor";
import { IconBtn, Loading, Sheet } from "../../../components/ui";
import { NOTE_COLORS, getNoteColor } from "../../../theme";

function NoteEditor({ note, onSave }) {
  const { colors } = useTheme();
  const { confirmDiscard } = useDialogs();
  const navigation = useNavigation();
  const [color, setColor] = useState(note?.color || NOTE_COLORS[0].bg);
  const changedRef = useRef(false);
  const allowLeaveRef = useRef(false);
  const colorRef = useRef(color);
  colorRef.current = color;
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const cfg = getNoteColor(color);

  const editor = useRichEditor({
    initialContent: note?.htmlContent || (note?.content ? `<p>${note.content}</p>` : ""),
    placeholder: "Write your note…",
    bg: cfg.bg,
    text: cfg.text,
    autofocus: !note,
    onChange: () => { changedRef.current = true; },
  });

  // Back button / Cancel / X: ask before throwing away unsaved text
  useEffect(() => navigation.addListener("beforeRemove", (e) => {
    if (allowLeaveRef.current || !changedRef.current) return;
    e.preventDefault();
    const leave = () => { allowLeaveRef.current = true; navigation.dispatch(e.data.action); };
    (async () => {
      let unchanged = false;
      try {
        const [html, text] = await Promise.all([editor.getHTML(), editor.getText()]);
        unchanged = colorRef.current === (note?.color || NOTE_COLORS[0].bg) &&
          (note ? html === (note.htmlContent || "") : !text.trim());
      } catch {
        // editor already gone — fall through to the prompt
      }
      if (unchanged || (await confirmDiscard())) leave();
    })();
  }), [navigation, confirmDiscard, editor, note]);

  const handleSave = async () => {
    const html = await editor.getHTML();
    const text = await editor.getText();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onSave(html, text, color);
      allowLeaveRef.current = true;
      router.back();
    } catch {
      // onSave already showed the error
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      <View style={[styles.head, { borderBottomColor: colors.border }]}>
        <IconBtn onPress={() => router.back()}><X size={20} color={colors.text} /></IconBtn>
        <Text style={[styles.title, { color: colors.text }]}>{note ? "Edit note" : "New note"}</Text>
        <Pressable style={[styles.swatchBtn, { borderColor: colors.border2 }]} onPress={() => setPicker(true)}>
          <View style={[styles.swatchDot, { backgroundColor: color }]} />
          <Text style={{ color: colors.text, fontSize: 13 }}>{cfg.label}</Text>
          <ChevronDown size={13} color={colors.text2} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <RichEditorView editor={editor} bg={cfg.bg} />
        <View style={[styles.actions, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <Pressable style={[styles.btn, { backgroundColor: colors.surface3 }]} onPress={() => router.back()}>
            <X size={15} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: "600" }}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]} onPress={handleSave} disabled={saving}>
            <Check size={15} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600" }}>{note ? "Update" : "Save"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Sheet visible={picker} onClose={() => setPicker(false)} title="Note colour">
        <View style={styles.swatchGrid}>
          {NOTE_COLORS.map((c) => (
            <Pressable
              key={c.bg}
              onPress={() => { if (c.bg !== color) changedRef.current = true; setColor(c.bg); setPicker(false); }}
              style={[styles.swatchItem, { backgroundColor: c.bg }, color === c.bg && { borderColor: colors.accent, borderWidth: 3 }]}
            >
              <Text style={{ color: c.text, fontWeight: "600", fontSize: 13 }}>{c.label}</Text>
              {color === c.bg && <Check size={14} color={c.text} />}
            </Pressable>
          ))}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams();
  const { notes, loading, addNote, updateNote } = useNotes();
  const { errorAlert } = useDialogs();
  const isNew = id === "new";
  const note = isNew ? null : notes.find((n) => n.id === id);

  if (!isNew && loading) return <Loading />;
  if (!isNew && !note) return <Loading text="Note not found" />;

  const handleSave = async (html, text, color) => {
    try {
      if (note) await updateNote(note.id, html, text, color);
      else await addNote(html, text, color);
    } catch (e) {
      errorAlert(e.message || "Save failed.");
      throw e;
    }
  };

  // key keeps the editor stable for this note instance
  return <NoteEditor key={note?.id || "new"} note={note} onSave={handleSave} />;
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8, height: 56, borderBottomWidth: 1 },
  title: { flex: 1, fontSize: 17, fontWeight: "700" },
  swatchBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6 },
  swatchDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: "rgba(0,0,0,0.15)" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, padding: 12, borderTopWidth: 1 },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 8 },
  swatchGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatchItem: { width: "30%", flexGrow: 1, height: 54, borderRadius: 10, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
});
