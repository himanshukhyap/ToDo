import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft, BookOpen, CheckSquare, FileText, Folder, Layers, Search, StickyNote, X,
} from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useSearchData } from "../../hooks/useSearchData";
import { highlightParts, searchAll, tokenize } from "../../utils/search";
import { IconBtn } from "../../components/ui";

const ICONS = {
  task: CheckSquare,
  note: StickyNote,
  page: FileText,
  notebook: BookOpen,
  section: Layers,
  category: Folder,
};

/** Open the thing a search result points to */
function openTarget(target) {
  switch (target.kind) {
    case "task":
      router.navigate({ pathname: "/tasks", params: { category: "", q: target.title } });
      break;
    case "note":
      router.navigate({ pathname: "/notes", params: { open: target.id } });
      break;
    case "page":
      router.replace(`/page/${target.id}`);
      break;
    case "notebook":
      router.navigate({ pathname: "/notebook", params: { id: target.id } });
      break;
    case "section":
      router.navigate({ pathname: "/notebook", params: { id: target.notebookId, section: target.id } });
      break;
    case "category":
      router.navigate({ pathname: "/tasks", params: { category: target.id } });
      break;
    default:
      router.back();
  }
}

function Highlight({ text, tokens, style, numberOfLines }) {
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {highlightParts(text, tokens).map((p, i) =>
        p.match
          ? <Text key={i} style={styles.mark}>{p.text}</Text>
          : p.text
      )}
    </Text>
  );
}

export default function SearchScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const { data, loading } = useSearchData(true);

  const tokens = useMemo(() => tokenize(query), [query]);
  const groups = useMemo(() => searchAll(query, data), [query, data]);
  const sections = groups.map((g) => ({ key: g.key, title: g.label, total: g.total, data: g.items }));
  const total = groups.reduce((n, g) => n + g.total, 0);

  let empty;
  if (!tokens.length) {
    empty = (
      <View style={styles.empty}>
        <Search size={40} strokeWidth={1.2} color={colors.text3} />
        <Text style={[styles.emptyText, { color: colors.text2 }]}>Search across your whole workspace</Text>
        <Text style={[styles.emptySub, { color: colors.text3 }]}>
          Tasks & subtasks · Notes · Notebook pages · Notebooks · Sections · Categories
        </Text>
      </View>
    );
  } else if (loading) {
    empty = <View style={styles.empty}><ActivityIndicator color={colors.accent} /></View>;
  } else {
    empty = (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.text2 }]}>No results for “{query.trim()}”</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "bottom"]}>
      <View style={[styles.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <IconBtn onPress={() => router.back()}><ArrowLeft size={21} color={colors.text} /></IconBtn>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tasks, notes, pages…"
          placeholderTextColor={colors.text3}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, { color: colors.text }]}
        />
        {!!query && (
          <IconBtn onPress={() => setQuery("")}><X size={18} color={colors.text2} /></IconBtn>
        )}
      </View>

      {!!total && (
        <Text style={[styles.count, { color: colors.text3 }]}>{total} result{total !== 1 ? "s" : ""}</Text>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        ListEmptyComponent={empty}
        renderSectionHeader={({ section }) => (
          <View style={styles.groupHead}>
            <Text style={[styles.groupLabel, { color: colors.text3 }]}>{section.title.toUpperCase()}</Text>
            <View style={[styles.badge, { backgroundColor: colors.surface3 }]}>
              <Text style={{ color: colors.text2, fontSize: 10, fontWeight: "600" }}>{section.total}</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => {
          const Icon = ICONS[item.type];
          return (
            <Pressable
              onPress={() => openTarget(item.target)}
              style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.surface2 }]}
            >
              <View style={styles.itemIcon}>
                <Icon size={17} color={item.color || colors.text3} />
              </View>
              <View style={{ flex: 1 }}>
                <Highlight
                  text={item.title}
                  tokens={tokens}
                  numberOfLines={1}
                  style={[
                    styles.itemTitle,
                    { color: item.done ? colors.text3 : colors.text },
                    item.done && { textDecorationLine: "line-through" },
                  ]}
                />
                {!!item.snippet && (
                  <Highlight text={item.snippet} tokens={tokens} numberOfLines={2} style={[styles.snippet, { color: colors.text2 }]} />
                )}
                {!!item.meta && <Text numberOfLines={1} style={[styles.meta, { color: colors.text3 }]}>{item.meta}</Text>}
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: 6, height: 58, paddingHorizontal: 8, borderBottomWidth: 1 },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
  count: { fontSize: 12, paddingHorizontal: 16, paddingTop: 10 },
  groupHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  groupLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.7 },
  badge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  item: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 11 },
  itemIcon: { paddingTop: 2 },
  itemTitle: { fontSize: 15, fontWeight: "500" },
  snippet: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  meta: { fontSize: 12, marginTop: 3 },
  mark: { backgroundColor: "rgba(250,204,21,0.38)" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 10, minHeight: 300 },
  emptyText: { fontSize: 15, textAlign: "center" },
  emptySub: { fontSize: 12.5, textAlign: "center", lineHeight: 18 },
});
