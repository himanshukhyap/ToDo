import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BookOpen, FileText, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react-native";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { useDialogs } from "../../../context/DialogContext";
import { useNotebooks, usePages, useSections } from "../../../hooks/useNotebook";
import {
  deletePage as svcDeletePage,
  deleteSection as svcDeleteSection,
} from "../../../services/notebookDeleteService";
import { Btn, ColorDots, EmptyState, IconBtn, Input, Loading, Sheet } from "../../../components/ui";
import { COLORS } from "../../../theme";

function snippetOf(page) {
  const t = (page?.textContent || "").replace(/\s+/g, " ").trim();
  if (!t) return "No content yet";
  return t.length > 90 ? t.slice(0, 90) + "…" : t;
}

function dateOf(page) {
  if (!page?.updatedAt?.toDate) return "";
  try {
    return page.updatedAt.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

function NameSheet({ visible, title, initial = "", withColor, initialColor, onSubmit, onClose, submitLabel = "Save" }) {
  const [name, setName] = useState(initial);
  const [color, setColor] = useState(initialColor || COLORS[0]);
  useEffect(() => {
    if (visible) { setName(initial); setColor(initialColor || COLORS[0]); }
  }, [visible, initial, initialColor]);
  const submit = () => { if (name.trim()) onSubmit(name.trim(), color); };
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={{ gap: 14 }}>
        <Input value={name} onChangeText={setName} autoFocus selectTextOnFocus placeholder="Name…" onSubmitEditing={submit} />
        {withColor && <ColorDots colors={COLORS.slice(0, 8)} value={color} onChange={setColor} />}
        <Btn title={submitLabel} onPress={submit} disabled={!name.trim()} />
      </View>
    </Sheet>
  );
}

function ActionSheet({ target, onRename, onDelete, onClose }) {
  const { colors } = useTheme();
  return (
    <Sheet visible={!!target} onClose={onClose} title={target?.label}>
      <Pressable style={styles.sheetItem} onPress={onRename}>
        <Pencil size={17} color={colors.text} />
        <Text style={{ color: colors.text, fontSize: 15 }}>Rename</Text>
      </Pressable>
      <Pressable style={styles.sheetItem} onPress={onDelete}>
        <Trash2 size={17} color={colors.red} />
        <Text style={{ color: colors.red, fontSize: 15 }}>Delete</Text>
      </Pressable>
    </Sheet>
  );
}

function NotebookView({ notebook, targetSectionId }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { confirmDelete, toast } = useDialogs();
  const { sections, loading: secLoading, createSection, renameSection } = useSections(notebook.id);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const activeSection = sections.find((s) => s.id === activeSectionId) || null;
  const { pages, loading: pagesLoading, createPage, renamePage } = usePages(activeSection?.id);
  const [deleting, setDeleting] = useState(null);
  const [sheet, setSheet] = useState(null); // { kind: "addSection" | "renameSection" | "renamePage", item }
  const [actions, setActions] = useState(null); // { type, item, label }

  // Reset when switching notebooks; keep a valid active section selected
  useEffect(() => { setActiveSectionId(null); }, [notebook.id]);

  // Opened from global search: /notebook?id=<nb>&section=<section>
  useEffect(() => {
    if (!targetSectionId || !sections.some((s) => s.id === targetSectionId)) return;
    setActiveSectionId(targetSectionId);
    router.setParams({ section: "" });
  }, [targetSectionId, sections]);
  useEffect(() => {
    if (targetSectionId) return; // a section from search is about to be selected
    if (sections.length > 0 && !sections.find((s) => s.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId, targetSectionId]);

  const handleAddPage = async () => {
    if (!activeSection) return;
    try {
      const ref = await createPage(activeSection.id, notebook.id, user.uid);
      router.push(`/page/${ref.id}`);
    } catch (e) {
      toast("error", "Could not add page: " + e.message);
    }
  };

  const handleDeletePage = async (page) => {
    const ok = await confirmDelete(`page "${page.pageName || "Untitled"}"`);
    if (!ok) return;
    setDeleting(page.id);
    try {
      await svcDeletePage(page.id, user.uid);
      toast("success", "Page deleted");
    } catch (e) {
      toast("error", "Delete failed: " + e.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteSection = async (sec) => {
    const ok = await confirmDelete(`section "${sec.sectionName}" and all its pages`);
    if (!ok) return;
    setDeleting(sec.id);
    if (activeSectionId === sec.id) {
      const next = sections.find((s) => s.id !== sec.id);
      setActiveSectionId(next?.id || null);
    }
    try {
      const result = await svcDeleteSection(sec.id, notebook.id, sec.uid);
      toast(result.autoCreated ? "info" : "success", result.autoCreated ? "Section deleted — default section created" : "Section and pages deleted");
    } catch (e) {
      toast("error", "Delete failed: " + e.message);
      setActiveSectionId(sec.id);
    } finally {
      setDeleting(null);
    }
  };

  const onSheetSubmit = async (name, color) => {
    const s = sheet;
    setSheet(null);
    try {
      if (s.kind === "addSection") {
        const { sectionId } = await createSection(name, color);
        setActiveSectionId(sectionId);
      } else if (s.kind === "renameSection") {
        await renameSection(s.item.id, name, color);
      } else if (s.kind === "renamePage") {
        await renamePage(s.item.id, name);
      }
    } catch (e) {
      toast("error", e.message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Notebook title */}
      <View style={[styles.topbar, { borderBottomColor: colors.border }]}>
        <View style={[styles.nbDot, { backgroundColor: notebook.color || colors.accent }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { color: colors.text3 }]}>NOTEBOOK</Text>
          <Text numberOfLines={1} style={[styles.nbTitle, { color: colors.text }]}>{notebook.notebookName || "Notebook"}</Text>
        </View>
      </View>

      {/* Sections rail */}
      <View style={[styles.sectionsBar, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionsInner}>
          {secLoading && !sections.length && <ActivityIndicator color={colors.accent} />}
          {sections.map((sec) => {
            const on = sec.id === activeSectionId;
            return (
              <Pressable
                key={sec.id}
                onPress={() => deleting !== sec.id && setActiveSectionId(sec.id)}
                onLongPress={() => setActions({ type: "section", item: sec, label: sec.sectionName })}
                style={[
                  styles.secChip,
                  { borderColor: on ? sec.color || colors.accent : colors.border2, backgroundColor: on ? (sec.color || colors.accent) + "22" : "transparent" },
                  deleting === sec.id && { opacity: 0.4 },
                ]}
              >
                <View style={[styles.secStripe, { backgroundColor: sec.color || colors.accent }]} />
                <Text numberOfLines={1} style={{ color: on ? colors.text : colors.text2, fontWeight: on ? "600" : "400", fontSize: 13.5, maxWidth: 150 }}>
                  {sec.sectionName || "Section"}
                </Text>
                {on && (
                  <Pressable hitSlop={10} onPress={() => setActions({ type: "section", item: sec, label: sec.sectionName })}>
                    <MoreHorizontal size={15} color={colors.text2} />
                  </Pressable>
                )}
              </Pressable>
            );
          })}
          <Pressable style={[styles.secChip, { borderColor: colors.border2, borderStyle: "dashed" }]} onPress={() => setSheet({ kind: "addSection" })}>
            <Plus size={14} color={colors.text2} />
            <Text style={{ color: colors.text2, fontSize: 13 }}>New section</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Pages */}
      <View style={styles.pagesHead}>
        <Text style={[styles.pagesTitle, { color: activeSection?.color || colors.text }]} numberOfLines={1}>
          {activeSection?.sectionName || "Pages"}
        </Text>
        <Btn small title="New page" icon={<Plus size={14} color="#fff" />} onPress={handleAddPage} disabled={!activeSection} />
      </View>

      <FlatList
        data={pages}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40 }}
        ListEmptyComponent={
          pagesLoading || secLoading
            ? <Loading />
            : <EmptyState icon={<FileText size={40} strokeWidth={1} color={colors.text3} />} text="No pages in this section yet." />
        }
        renderItem={({ item: page }) => (
          <Pressable
            onPress={() => deleting !== page.id && router.push(`/page/${page.id}`)}
            onLongPress={() => setActions({ type: "page", item: page, label: page.pageName || "Untitled" })}
            style={({ pressed }) => [
              styles.pageRow,
              { backgroundColor: pressed ? colors.surface2 : colors.surface, borderColor: colors.border },
              deleting === page.id && { opacity: 0.4 },
            ]}
          >
            <FileText size={16} color={colors.text3} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[styles.pageName, { color: colors.text }]}>{page.pageName || "Untitled"}</Text>
              <Text numberOfLines={2} style={[styles.snippet, { color: colors.text3 }]}>{snippetOf(page)}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={{ color: colors.text3, fontSize: 11 }}>{dateOf(page)}</Text>
              {deleting === page.id ? (
                <ActivityIndicator size="small" color={colors.text3} />
              ) : (
                <IconBtn size={28} onPress={() => setActions({ type: "page", item: page, label: page.pageName || "Untitled" })}>
                  <MoreHorizontal size={16} color={colors.text2} />
                </IconBtn>
              )}
            </View>
          </Pressable>
        )}
      />

      <ActionSheet
        target={actions}
        onClose={() => setActions(null)}
        onRename={() => {
          const a = actions;
          setActions(null);
          setSheet({ kind: a.type === "section" ? "renameSection" : "renamePage", item: a.item });
        }}
        onDelete={() => {
          const a = actions;
          setActions(null);
          if (a.type === "section") handleDeleteSection(a.item);
          else handleDeletePage(a.item);
        }}
      />

      <NameSheet
        visible={!!sheet}
        onClose={() => setSheet(null)}
        title={sheet?.kind === "addSection" ? "New section" : sheet?.kind === "renameSection" ? "Rename section" : "Rename page"}
        submitLabel={sheet?.kind === "addSection" ? "Create" : "Save"}
        initial={sheet?.kind === "renameSection" ? sheet.item.sectionName : sheet?.kind === "renamePage" ? sheet.item.pageName : ""}
        initialColor={sheet?.item?.color}
        withColor={sheet?.kind === "addSection"}
        onSubmit={onSheetSubmit}
      />
    </View>
  );
}

export default function NotebookScreen() {
  const { colors } = useTheme();
  const { id, section } = useLocalSearchParams();
  const { notebooks, loading } = useNotebooks();
  const notebook = notebooks.find((nb) => nb.id === id) || null;

  // Same as the web NotebookRoute: fall back to the first notebook
  useEffect(() => {
    if (notebook || !notebooks.length) return;
    router.setParams({ id: notebooks[0].id });
  }, [notebook, notebooks]);

  if (loading) return <Loading />;
  if (!notebook) {
    return (
      <View style={styles.welcome}>
        <BookOpen size={64} strokeWidth={0.8} color={colors.text3} />
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>No notebook selected</Text>
        <Text style={{ color: colors.text2, textAlign: "center", lineHeight: 20 }}>
          Select or create a notebook from the sidebar.{"\n"}A default section and page will be ready instantly.
        </Text>
      </View>
    );
  }
  return <NotebookView notebook={notebook} targetSectionId={typeof section === "string" ? section : null} />;
}

const styles = StyleSheet.create({
  topbar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  nbDot: { width: 12, height: 12, borderRadius: 6 },
  kicker: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  nbTitle: { fontSize: 17, fontWeight: "700" },
  sectionsBar: { borderBottomWidth: 1 },
  sectionsInner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  secChip: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  secStripe: { width: 4, height: 14, borderRadius: 2 },
  pagesHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  pagesTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  pageRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  pageName: { fontSize: 15, fontWeight: "600" },
  snippet: { fontSize: 12.5, marginTop: 2 },
  welcome: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 12 },
  welcomeTitle: { fontSize: 20, fontWeight: "700" },
  sheetItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 4 },
});
