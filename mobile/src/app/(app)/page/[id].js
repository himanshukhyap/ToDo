import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Check } from "lucide-react-native";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { useTheme } from "../../../context/ThemeContext";
import { RichEditorView, useRichEditor } from "../../../components/RichEditor";
import { IconBtn, Loading, formatDate } from "../../../components/ui";

// Same fields as usePages().savePage in the web app
function savePage(id, htmlContent, textContent, pageName) {
  return updateDoc(doc(db, "nb_pages", id), {
    htmlContent,
    textContent,
    pageName: pageName || "Untitled Page",
    updatedAt: serverTimestamp(),
  });
}

function PageEditor({ page }) {
  const { colors } = useTheme();
  const [title, setTitle] = useState(page.pageName || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const titleRef = useRef(title);
  const contentRef = useRef(null); // { html, text } — latest editor content
  const timerRef = useRef(null);
  const dirtyRef = useRef(false);

  const flush = useCallback(async () => {
    clearTimeout(timerRef.current);
    if (!dirtyRef.current) return;
    const content = contentRef.current;
    dirtyRef.current = false;
    setSaving(true);
    try {
      await savePage(
        page.id,
        content ? content.html : page.htmlContent || "",
        content ? content.text : page.textContent || "",
        titleRef.current,
      );
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("[Editor] save failed:", e);
      dirtyRef.current = true;
    } finally {
      setSaving(false);
    }
  }, [page.id, page.htmlContent, page.textContent]);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    setDirty(true);
    setSaved(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 800);
  }, [flush]);

  const editorRef = useRef(null);
  const editor = useRichEditor({
    initialContent: page.htmlContent || "",
    placeholder: "Start writing your page…",
    bg: colors.surface,
    text: colors.text,
    onChange: async () => {
      const ed = editorRef.current;
      if (!ed) return;
      const [html, text] = await Promise.all([ed.getHTML(), ed.getText()]);
      // The editor can emit a change while loading the initial content — ignore it
      const unchanged = contentRef.current === null &&
        (html === (page.htmlContent || "") || (!text.trim() && !(page.textContent || "").trim()));
      if (unchanged) return;
      contentRef.current = { html, text };
      scheduleSave();
    },
  });
  editorRef.current = editor;

  // Save any pending edits when leaving the page
  useEffect(() => () => {
    clearTimeout(timerRef.current);
    if (dirtyRef.current) {
      const content = contentRef.current;
      savePage(
        page.id,
        content ? content.html : page.htmlContent || "",
        content ? content.text : page.textContent || "",
        titleRef.current,
      ).catch((e) => console.error("[Editor] final save failed:", e));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ts = formatDate(page.updatedAt, true);
  const status = saving ? "Saving…" : saved ? "Saved" : dirty ? "● Unsaved" : ts ? `Edited ${ts}` : "";
  const statusColor = saving ? colors.accent : saved ? colors.green : dirty ? colors.orange : colors.text3;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      <View style={[styles.head, { borderBottomColor: colors.border }]}>
        <IconBtn onPress={() => router.back()}><ChevronLeft size={22} color={colors.text} /></IconBtn>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: colors.text2, fontSize: 12 }}>{title || "Page"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {saved && !saving && <Check size={11} color={colors.green} />}
            <Text style={{ color: statusColor, fontSize: 11.5 }}>{status}</Text>
          </View>
        </View>
      </View>

      <TextInput
        value={title}
        onChangeText={(v) => { setTitle(v); titleRef.current = v; scheduleSave(); }}
        placeholder="Page title…"
        placeholderTextColor={colors.text3}
        returnKeyType="next"
        onSubmitEditing={() => editor.focus("end")}
        style={[styles.title, { color: colors.text, borderBottomColor: colors.border }]}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <RichEditorView editor={editor} bg={colors.surface} full />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function PageScreen() {
  const { id } = useLocalSearchParams();
  const [page, setPage] = useState(undefined);

  useEffect(() => {
    if (!id) return undefined;
    return onSnapshot(
      doc(db, "nb_pages", id),
      (snap) => setPage(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (err) => { console.error("[Page]", err.code, err.message); setPage(null); }
    );
  }, [id]);

  if (page === undefined) return <Loading />;
  if (page === null) return <Loading text="Page not found" />;
  return <PageEditor key={page.id} page={page} />;
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 6, height: 56, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
});
