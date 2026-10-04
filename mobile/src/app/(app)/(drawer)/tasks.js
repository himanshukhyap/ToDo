import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import {
  Check, CheckCircle2, CheckSquare, ChevronDown, ChevronUp, Circle, Clock,
  Copy, Folder, Pencil, Plus, Share2, Trash2, X,
} from "lucide-react-native";
import { useTasks } from "../../../hooks/useTasks";
import { useCategories } from "../../../hooks/useCategories";
import { useTheme } from "../../../context/ThemeContext";
import { useDialogs } from "../../../context/DialogContext";
import CategoryManager, { CategoryPicker } from "../../../components/CategoryManager";
import { Badge, EmptyState, ErrorBanner, IconBtn, Loading, ProgressBar, SearchBar } from "../../../components/ui";
import { copyText, shareContent } from "../../../utils/share";

const SWIPE_ACTIONS_WIDTH = 150;

/* ── Subtask row ────────────────────────────────────────── */
function SubtaskRow({ subtask, taskId, task, onToggle, onEdit, onDelete }) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(subtask.text);
  const save = () => { if (!text.trim()) return; onEdit(taskId, task, subtask.id, text); setEditing(false); };

  if (editing) return (
    <View style={styles.subEdit}>
      <TextInput
        value={text}
        onChangeText={setText}
        autoFocus
        onSubmitEditing={save}
        style={[styles.smallInput, { flex: 1, color: colors.text, borderColor: colors.border2, backgroundColor: colors.surface }]}
      />
      <IconBtn size={30} onPress={() => setEditing(false)}><X size={15} color={colors.text2} /></IconBtn>
      <IconBtn size={30} onPress={save}><Check size={15} color={colors.green} /></IconBtn>
    </View>
  );

  return (
    <View style={styles.subRow}>
      <IconBtn size={30} onPress={() => onToggle(taskId, task, subtask.id)}>
        {subtask.completed ? <CheckCircle2 size={17} color={colors.green} /> : <Circle size={17} color={colors.text3} />}
      </IconBtn>
      <Text style={[styles.subText, { color: subtask.completed ? colors.text3 : colors.text }, subtask.completed && styles.strike]}>
        {subtask.text}
      </Text>
      <IconBtn size={30} onPress={() => setEditing(true)}><Pencil size={13} color={colors.text3} /></IconBtn>
      <IconBtn size={30} onPress={() => onDelete(taskId, task, subtask.id)}><Trash2 size={13} color={colors.text3} /></IconBtn>
    </View>
  );
}

/* ── Task row — swipe left to edit/delete, tap to expand ── */
function TaskCard({
  task, categories, onToggle, onUpdate, onDelete,
  onAddSubtask, onEditSubtask, onToggleSubtask, onDeleteSubtask, onManageCat,
}) {
  const { colors } = useTheme();
  const { confirmDelete, errorAlert } = useDialogs();
  const swipeRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editCat, setEditCat] = useState(task.categoryId || null);
  const [newSub, setNewSub] = useState("");
  const [addingSub, setAddingSub] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [picker, setPicker] = useState(null); // "edit" | "quick"

  const cat = categories.find((c) => c.id === task.categoryId);
  const editCatObj = categories.find((c) => c.id === editCat);
  const subtasks = task.subtasks || [];
  const doneCount = subtasks.filter((s) => s.completed).length;

  const startEdit = () => {
    setEditTitle(task.title);
    setEditCat(task.categoryId || null);
    setEditing(true);
    swipeRef.current?.close();
  };
  const saveEdit = () => {
    if (!editTitle.trim()) return;
    onUpdate(task.id, { title: editTitle.trim(), categoryId: editCat || null });
    setEditing(false);
  };
  const addSub = () => {
    if (!newSub.trim()) return;
    onAddSubtask(task.id, newSub);
    setNewSub(""); setAddingSub(false);
  };

  const getShareText = () => {
    const s = task.completed ? "✅" : "⬜";
    const lines = [`${s} *${task.title}*`];
    if (subtasks.length) { lines.push(""); subtasks.forEach((st) => lines.push(`  ${st.completed ? "✅" : "⬜"} ${st.text}`)); }
    return lines.join("\n");
  };
  const handleCopy = async () => { await copyText(getShareText()); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleShare = async () => {
    const r = await shareContent(task.title, getShareText());
    if (r === "copied" || r === "shared") { setShared(true); setTimeout(() => setShared(false), 2000); }
  };
  const handleDelete = async () => {
    swipeRef.current?.close();
    const ok = await confirmDelete(`task "${task.title}"`);
    if (!ok) return;
    try {
      await onDelete(task.id);
    } catch (e) {
      errorAlert(`Could not delete task: ${e.message}\n\nMake sure Firestore rules are deployed.`);
    }
  };

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <Pressable style={[styles.swipeBtn, { backgroundColor: colors.accent }]} onPress={startEdit}>
        <Pencil size={16} color="#fff" />
        <Text style={styles.swipeText}>Edit</Text>
      </Pressable>
      <Pressable style={[styles.swipeBtn, { backgroundColor: colors.red }]} onPress={handleDelete}>
        <Trash2 size={16} color="#fff" />
        <Text style={styles.swipeText}>Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {editing ? (
        <View style={styles.editWrap}>
          <TextInput
            value={editTitle}
            onChangeText={setEditTitle}
            autoFocus
            onSubmitEditing={saveEdit}
            style={[styles.smallInput, { color: colors.text, borderColor: colors.border2, backgroundColor: colors.surface2 }]}
          />
          <View style={styles.editRow}>
            <Pressable style={[styles.catChip, { borderColor: colors.border2 }]} onPress={() => setPicker("edit")}>
              <View style={[styles.stripeDot, { backgroundColor: editCatObj?.color || colors.text3 }]} />
              <Text style={{ color: colors.text2, fontSize: 13 }}>{editCatObj?.name || "No category"}</Text>
              <ChevronDown size={12} color={colors.text3} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <IconBtn onPress={() => setEditing(false)}><X size={17} color={colors.text2} /></IconBtn>
            <IconBtn onPress={saveEdit}><Check size={17} color={colors.green} /></IconBtn>
          </View>
        </View>
      ) : (
        <ReanimatedSwipeable
          ref={swipeRef}
          friction={2}
          rightThreshold={40}
          overshootRight={false}
          renderRightActions={renderRightActions}
        >
          <Pressable style={[styles.main, { backgroundColor: colors.surface }]} onPress={() => setExpanded((e) => !e)}>
            <IconBtn size={32} onPress={() => onToggle(task.id, task.completed)}>
              {task.completed ? <CheckCircle2 size={21} color={colors.green} /> : <Circle size={21} color={colors.text3} />}
            </IconBtn>
            <View style={[styles.stripe, { backgroundColor: cat?.color || colors.text3 }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: task.completed ? colors.text3 : colors.text }, task.completed && styles.strike]}>
                {task.title}
              </Text>
              <Text style={[styles.meta, { color: colors.text3 }]}>
                {cat ? cat.name : "No category"}
                {subtasks.length > 0 ? ` · ${doneCount}/${subtasks.length} subtasks` : ""}
              </Text>
            </View>
            {expanded ? <ChevronUp size={17} color={colors.text3} /> : <ChevronDown size={17} color={colors.text3} />}
          </Pressable>
        </ReanimatedSwipeable>
      )}

      {subtasks.length > 0 && (
        <View style={{ paddingHorizontal: 12, paddingBottom: expanded ? 4 : 10 }}>
          <ProgressBar value={doneCount / subtasks.length} color={colors.green} height={3} />
        </View>
      )}

      {expanded && !editing && (
        <View style={[styles.subArea, { borderTopColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
            <QuickBtn icon={<Pencil size={13} color={colors.text2} />} label="Edit" onPress={startEdit} />
            <QuickBtn
              icon={<Folder size={13} color={colors.text2} />}
              label="Category"
              onPress={() => setPicker("quick")}
            />
            <QuickBtn icon={shared ? <Check size={13} color={colors.green} /> : <Share2 size={13} color={colors.text2} />} label="Share" onPress={handleShare} />
            <QuickBtn icon={copied ? <Check size={13} color={colors.green} /> : <Copy size={13} color={colors.text2} />} label="Copy" onPress={handleCopy} />
            <QuickBtn icon={<Trash2 size={13} color={colors.red} />} label="Delete" danger onPress={handleDelete} />
          </ScrollView>

          {subtasks.map((sub) => (
            <SubtaskRow key={sub.id} subtask={sub} taskId={task.id} task={task}
              onToggle={onToggleSubtask} onEdit={onEditSubtask} onDelete={onDeleteSubtask} />
          ))}

          {addingSub ? (
            <View style={styles.subEdit}>
              <TextInput
                value={newSub}
                onChangeText={setNewSub}
                placeholder="Subtask…"
                placeholderTextColor={colors.text3}
                autoFocus
                onSubmitEditing={addSub}
                style={[styles.smallInput, { flex: 1, color: colors.text, borderColor: colors.border2, backgroundColor: colors.surface2 }]}
              />
              <IconBtn size={30} onPress={() => setAddingSub(false)}><X size={15} color={colors.text2} /></IconBtn>
              <IconBtn size={30} onPress={addSub}><Check size={15} color={colors.green} /></IconBtn>
            </View>
          ) : (
            <Pressable style={styles.addSub} onPress={() => setAddingSub(true)}>
              <Plus size={14} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "500" }}>Add subtask</Text>
            </Pressable>
          )}
        </View>
      )}

      <CategoryPicker
        visible={!!picker}
        onClose={() => setPicker(null)}
        categories={categories}
        current={picker === "edit" ? editCat : task.categoryId || null}
        onSelect={(id) => (picker === "edit" ? setEditCat(id) : onUpdate(task.id, { categoryId: id }))}
        onManage={picker === "quick" ? onManageCat : undefined}
      />
    </View>
  );
}

function QuickBtn({ icon, label, onPress, danger }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.quickBtn, { borderColor: danger ? colors.red + "55" : colors.border2 }]}>
      {icon}
      <Text style={{ color: danger ? colors.red : colors.text2, fontSize: 12.5 }}>{label}</Text>
    </Pressable>
  );
}

/* ── Inline Add Task row ────────────────────────────────── */
function AddTaskRow({ categories, onAdd, defaultCatId, onManageCat }) {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [catId, setCatId] = useState(defaultCatId || null);
  const [focused, setFocused] = useState(false);
  const [picker, setPicker] = useState(false);
  const [lastDefault, setLastDefault] = useState(defaultCatId);

  // Keep in sync if the sidebar category changes
  if (lastDefault !== defaultCatId) {
    setLastDefault(defaultCatId);
    setCatId(defaultCatId || null);
  }

  const cat = categories.find((c) => c.id === catId);
  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title, catId || null);
    setTitle(""); setCatId(defaultCatId || null);
  };

  return (
    <View style={[styles.addRow, { backgroundColor: colors.surface, borderColor: focused ? colors.accent : colors.border }]}>
      <View style={styles.addTop}>
        <Plus size={18} color={colors.text3} />
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Add a task…"
          placeholderTextColor={colors.text3}
          onFocus={() => setFocused(true)}
          onBlur={() => !title && setFocused(false)}
          onSubmitEditing={handleAdd}
          submitBehavior="submit"
          returnKeyType="done"
          style={[styles.addInput, { color: colors.text }]}
        />
      </View>
      {(focused || !!title) && (
        <View style={styles.addBottom}>
          <Pressable style={[styles.catChip, { borderColor: colors.border2 }]} onPress={() => setPicker(true)}>
            <View style={[styles.stripeDot, { backgroundColor: cat?.color || colors.text3 }]} />
            <Text style={{ color: colors.text2, fontSize: 13 }}>{cat?.name || "No category"}</Text>
            <ChevronDown size={12} color={colors.text3} />
          </Pressable>
          <Pressable
            onPress={handleAdd}
            disabled={!title.trim()}
            style={[styles.addBtn, { backgroundColor: colors.accent, opacity: title.trim() ? 1 : 0.5 }]}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Add</Text>
          </Pressable>
        </View>
      )}
      <CategoryPicker
        visible={picker}
        onClose={() => setPicker(false)}
        categories={categories}
        current={catId}
        onSelect={setCatId}
        onManage={onManageCat}
      />
    </View>
  );
}

/* ── Main Tasks screen ──────────────────────────────────── */
export default function Tasks() {
  const { colors } = useTheme();
  const { confirmBulkDelete, errorAlert, toast } = useDialogs();
  const { category, q } = useLocalSearchParams();
  const externalCat = category || null;
  const {
    tasks, loading, error, addTask, updateTask, deleteTask, toggleTask,
    addSubtask, updateSubtask, toggleSubtask, deleteSubtask, deleteAllTasks,
  } = useTasks();
  const { categories } = useCategories();
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileTab, setMobileTab] = useState("pending");
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Opened from global search: /tasks?q=<task title>
  useEffect(() => {
    if (typeof q !== "string" || !q) return;
    setSearch(q);
    router.setParams({ q: "" });
  }, [q]);

  const isSearching = search.trim().length > 0;

  const filtered = useMemo(() => tasks.filter((t) => {
    const ms = !isSearching || t.title?.toLowerCase().includes(search.toLowerCase());
    const mc = !externalCat || t.categoryId === externalCat;
    return ms && mc;
  }), [tasks, search, isSearching, externalCat]);

  const pending = filtered.filter((t) => !t.completed);
  const completed = filtered.filter((t) => t.completed);

  const handlers = {
    onToggle: toggleTask, onUpdate: updateTask, onDelete: deleteTask,
    onAddSubtask: addSubtask, onEditSubtask: updateSubtask,
    onToggleSubtask: toggleSubtask, onDeleteSubtask: deleteSubtask,
  };

  const activeTab = isSearching ? (pending.length > 0 ? "pending" : "completed") : mobileTab;
  const activeCatName = externalCat ? categories.find((c) => c.id === externalCat)?.name : null;
  const list = activeTab === "pending" ? pending : completed;

  const handleDeleteAllTasks = async () => {
    if (!tasks.length || bulkDeleting) return;
    const ok = await confirmBulkDelete("tasks", tasks.length);
    if (!ok) return;
    setBulkDeleting(true);
    try {
      await deleteAllTasks(tasks.map((task) => task.id));
      toast("success", `${tasks.length} tasks deleted`);
    } catch (e) {
      errorAlert(`Could not delete all tasks: ${e.message}`);
    } finally {
      setBulkDeleting(false);
    }
  };

  const doneCount = filtered.filter((t) => t.completed).length;

  const header = (
    <View style={{ gap: 12, marginBottom: 12 }}>
      <View style={styles.panelHead}>
        <CheckSquare size={18} color={colors.text} />
        <Text style={[styles.panelTitle, { color: colors.text }]}>Tasks</Text>
        {!!activeCatName && (
          <Pressable
            onPress={() => router.setParams({ category: "" })}
            style={[styles.catPill, { backgroundColor: colors.accent + "22" }]}
          >
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>{activeCatName}</Text>
            <X size={12} color={colors.accent} />
          </Pressable>
        )}
        <Badge value={filtered.length} />
        <View style={{ flex: 1 }} />
        <IconBtn onPress={() => setShowCatMgr(true)}><Folder size={18} color={colors.text2} /></IconBtn>
        <IconBtn onPress={handleDeleteAllTasks} disabled={!tasks.length || bulkDeleting}>
          <Trash2 size={18} color={colors.text2} />
        </IconBtn>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search tasks…" />

      {isSearching && (
        <Text style={{ color: colors.text2, fontSize: 12.5 }}>
          {filtered.length === 0
            ? `No tasks found for "${search}"`
            : `${filtered.length} task${filtered.length !== 1 ? "s" : ""} — ${pending.length} pending, ${completed.length} completed`}
        </Text>
      )}

      <ErrorBanner text={error} />

      <AddTaskRow categories={categories} onAdd={addTask} defaultCatId={externalCat} onManageCat={() => setShowCatMgr(true)} />

      {categories.length > 0 && !externalCat && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.setParams({ category: c.id })}
              style={[styles.filterTag, { backgroundColor: c.color + "18", borderColor: c.color + "33" }]}
            >
              <View style={[styles.stripeDot, { backgroundColor: c.color }]} />
              <Text style={{ color: c.color, fontSize: 12.5, fontWeight: "500" }}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.text2, fontSize: 12 }}>{doneCount}/{filtered.length} completed</Text>
            <ProgressBar value={doneCount / filtered.length} />
          </View>
          <View style={[styles.tabs, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            {[
              { key: "pending", label: "Pending", icon: Clock, count: pending.length },
              { key: "completed", label: "Done", icon: CheckCircle2, count: completed.length },
            ].map((t) => {
              const on = activeTab === t.key;
              const Icon = t.icon;
              return (
                <Pressable key={t.key} onPress={() => setMobileTab(t.key)} style={[styles.tab, on && { backgroundColor: colors.surface }]}>
                  <Icon size={14} color={on ? colors.accent : colors.text2} />
                  <Text style={{ color: on ? colors.text : colors.text2, fontWeight: on ? "600" : "400", fontSize: 13.5 }}>{t.label}</Text>
                  <Badge value={t.count} small />
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );

  let empty = null;
  if (loading) empty = <Loading />;
  else if (tasks.length === 0) empty = <EmptyState icon={<CheckSquare size={40} strokeWidth={1} color={colors.text3} />} text="No tasks yet. Type above to add your first task." />;
  else if (filtered.length === 0) empty = <EmptyState text={`No tasks match "${search || activeCatName}".`} />;
  else empty = (
    <Text style={[styles.emptySm, { color: colors.text3 }]}>
      {activeTab === "pending"
        ? (isSearching ? `No pending tasks match "${search}"` : "Nothing pending 🎉")
        : (isSearching ? `No completed tasks match "${search}"` : "No completed tasks.")}
    </Text>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={loading ? [] : list}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        renderItem={({ item }) => (
          <TaskCard task={item} categories={categories} onManageCat={() => setShowCatMgr(true)} {...handlers} />
        )}
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      />
      <CategoryManager visible={showCatMgr} onClose={() => setShowCatMgr(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  panelHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  panelTitle: { fontSize: 18, fontWeight: "700" },
  catPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  filterTag: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  tabs: { flexDirection: "row", borderWidth: 1, borderRadius: 10, padding: 3 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 8 },
  card: { borderWidth: 1, borderRadius: 12, marginBottom: 10, overflow: "hidden" },
  main: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingLeft: 6, paddingRight: 12 },
  stripe: { width: 3, alignSelf: "stretch", borderRadius: 2 },
  stripeDot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 15, fontWeight: "500" },
  meta: { fontSize: 12, marginTop: 2 },
  strike: { textDecorationLine: "line-through" },
  swipeActions: { flexDirection: "row", width: SWIPE_ACTIONS_WIDTH },
  swipeBtn: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  swipeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  editWrap: { padding: 10, gap: 8 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  smallInput: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 7, fontSize: 14 },
  subArea: { borderTopWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  quickRow: { gap: 8, paddingBottom: 6 },
  quickBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  subText: { flex: 1, fontSize: 14 },
  subEdit: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 },
  addSub: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 6 },
  addRow: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  addTop: { flexDirection: "row", alignItems: "center", gap: 10, height: 48 },
  addInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  addBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 },
  addBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 7 },
  emptySm: { textAlign: "center", paddingVertical: 24, fontSize: 13.5 },
});
