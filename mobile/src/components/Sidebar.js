import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useGlobalSearchParams, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CheckSquare, StickyNote, BookOpen, ChevronDown, ChevronRight,
  Plus, Sun, Moon, LogOut, MoreHorizontal, Pencil, Trash2, Check, X, Shield,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useDialogs } from "../context/DialogContext";
import { useCategories } from "../hooks/useCategories";
import { useNotebooks } from "../hooks/useNotebook";
import { deleteNotebook as svcDeleteNotebook } from "../services/notebookDeleteService";
import { OnlineDot } from "./OfflineBanner";
import { BrandIcon } from "./Splash";
import { ColorDots, Sheet } from "./ui";
import { COLORS } from "../theme";

function InlineEdit({ value, onSave, onCancel }) {
  const { colors } = useTheme();
  const [v, setV] = useState(value);
  return (
    <TextInput
      value={v}
      onChangeText={setV}
      autoFocus
      selectTextOnFocus
      onSubmitEditing={() => (v.trim() ? onSave(v.trim()) : onCancel())}
      onBlur={() => (v.trim() ? onSave(v.trim()) : onCancel())}
      style={[styles.inlineEdit, { color: colors.text, borderColor: colors.accent, backgroundColor: colors.surface2 }]}
    />
  );
}

function SbGroup({ label, icon, children }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(true);
  return (
    <View style={{ marginBottom: 4 }}>
      <Pressable style={styles.groupHead} onPress={() => setOpen((o) => !o)}>
        {icon}
        <Text style={[styles.groupLabel, { color: colors.text2 }]}>{label}</Text>
        {open ? <ChevronDown size={13} color={colors.text3} /> : <ChevronRight size={13} color={colors.text3} />}
      </Pressable>
      {open && <View>{children}</View>}
    </View>
  );
}

function Item({ label, color, active, onPress, onMenu, right }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        active && { backgroundColor: colors.accent + "22" },
        pressed && !active && { backgroundColor: colors.surface2 },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text numberOfLines={1} style={[styles.itemLabel, { color: active ? colors.accent : colors.text, fontWeight: active ? "600" : "400" }]}>
        {label}
      </Text>
      {right}
      {onMenu && (
        <Pressable onPress={onMenu} hitSlop={10} style={styles.menuBtn}>
          <MoreHorizontal size={16} color={colors.text3} />
        </Pressable>
      )}
    </Pressable>
  );
}

function AddForm({ placeholder, onAdd, onCancel }) {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const submit = () => { if (name.trim()) onAdd(name.trim(), color); };
  return (
    <View style={[styles.addForm, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        autoFocus
        onSubmitEditing={submit}
        style={[styles.addInput, { color: colors.text, borderColor: colors.border2 }]}
      />
      <ColorDots colors={COLORS.slice(0, 6)} value={color} onChange={setColor} size={22} />
      <View style={styles.addActions}>
        <Pressable onPress={onCancel} style={[styles.addBtn, { backgroundColor: colors.surface3 }]}>
          <X size={14} color={colors.text2} />
        </Pressable>
        <Pressable onPress={submit} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Check size={14} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

export default function Sidebar({ navigation }) {
  const { user, logout, isAdmin, sessionTimeoutMs } = useAuth();
  const { theme, colors, toggle } = useTheme();
  const { confirmDelete, confirmLogout, errorAlert } = useDialogs();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { notebooks, createNotebook, renameNotebook } = useNotebooks();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const params = useGlobalSearchParams();

  const [addingCat, setAddingCat] = useState(false);
  const [editCatId, setEditCatId] = useState(null);
  const [addingNb, setAddingNb] = useState(false);
  const [editNbId, setEditNbId] = useState(null);
  const [menu, setMenu] = useState(null); // { type: "cat"|"nb", item }
  const [userOpen, setUserOpen] = useState(false);

  const active = pathname.split("/")[1] || "tasks";
  const activeCat = active === "tasks" ? params.category || null : null;
  const activeNbId = active === "notebook" ? params.id || null : null;

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initials = displayName[0]?.toUpperCase() || "U";

  const go = (pathnameTo, p) => {
    router.navigate(p ? { pathname: pathnameTo, params: p } : pathnameTo);
    navigation.closeDrawer();
  };

  const handleAddNotebook = async (name, color) => {
    setAddingNb(false);
    try {
      const { notebookId } = await createNotebook(name, color);
      go("/notebook", { id: notebookId });
    } catch (e) {
      errorAlert(`Could not create notebook: ${e.message}`);
    }
  };

  const handleDeleteNotebook = async (nb) => {
    const ok = await confirmDelete(`notebook "${nb.notebookName}" and ALL its sections & pages`);
    if (!ok) return;
    try {
      await svcDeleteNotebook(nb.id, user.uid);
      if (activeNbId === nb.id) router.setParams({ id: "" });
    } catch (e) {
      errorAlert(`Delete failed: ${e.message}\n\nMake sure Firestore rules are deployed.`);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const ok = await confirmDelete(`category "${cat.name}"`);
    if (!ok) return;
    try {
      await deleteCategory(cat.id);
      if (activeCat === cat.id) router.setParams({ category: "" });
    } catch (e) {
      errorAlert(`Could not delete category: ${e.message}`);
    }
  };

  const onMenuAction = (action) => {
    const m = menu;
    setMenu(null);
    if (!m) return;
    if (action === "rename") {
      if (m.type === "cat") setEditCatId(m.item.id);
      else setEditNbId(m.item.id);
    } else if (m.type === "cat") {
      handleDeleteCategory(m.item);
    } else {
      handleDeleteNotebook(m.item);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.sbBg, paddingTop: insets.top }]}>
      <View style={[styles.brand, { borderBottomColor: colors.border }]}>
        <BrandIcon size={32} />
        <Text style={[styles.brandName, { color: colors.text }]}>NoteTask</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }} keyboardShouldPersistTaps="handled">
        <SbGroup label="Tasks" icon={<CheckSquare size={15} color={colors.text2} />}>
          <Item label="All Tasks" color={colors.text3} active={active === "tasks" && !activeCat} onPress={() => go("/tasks", { category: "" })} />
          {categories.map((cat) =>
            editCatId === cat.id ? (
              <View key={cat.id} style={styles.item}>
                <View style={[styles.dot, { backgroundColor: cat.color }]} />
                <InlineEdit
                  value={cat.name}
                  onSave={(v) => { updateCategory(cat.id, v, cat.color); setEditCatId(null); }}
                  onCancel={() => setEditCatId(null)}
                />
              </View>
            ) : (
              <Item
                key={cat.id}
                label={cat.name}
                color={cat.color}
                active={active === "tasks" && activeCat === cat.id}
                onPress={() => go("/tasks", { category: cat.id })}
                onMenu={() => setMenu({ type: "cat", item: cat })}
              />
            )
          )}
          {addingCat ? (
            <AddForm
              placeholder="Category name…"
              onAdd={(n, c) => { addCategory(n, c); setAddingCat(false); }}
              onCancel={() => setAddingCat(false)}
            />
          ) : (
            <Pressable style={styles.addLink} onPress={() => setAddingCat(true)}>
              <Plus size={13} color={colors.text2} />
              <Text style={{ color: colors.text2, fontSize: 13 }}>Add category</Text>
            </Pressable>
          )}
        </SbGroup>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <SbGroup label="Notes" icon={<StickyNote size={15} color={colors.text2} />}>
          <Item label="All Notes" color={colors.text3} active={active === "notes"} onPress={() => go("/notes")} />
        </SbGroup>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Item
          label="Trash"
          color={colors.red}
          active={active === "trash"}
          onPress={() => go("/trash")}
          right={<Trash2 size={14} color={colors.text3} />}
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <SbGroup label="Notebook" icon={<BookOpen size={15} color={colors.text2} />}>
          {notebooks.map((nb) =>
            editNbId === nb.id ? (
              <View key={nb.id} style={styles.item}>
                <View style={[styles.dot, { backgroundColor: nb.color }]} />
                <InlineEdit
                  value={nb.notebookName}
                  onSave={(v) => { renameNotebook(nb.id, v, nb.color); setEditNbId(null); }}
                  onCancel={() => setEditNbId(null)}
                />
              </View>
            ) : (
              <Item
                key={nb.id}
                label={nb.notebookName}
                color={nb.color}
                active={active === "notebook" && activeNbId === nb.id}
                onPress={() => go("/notebook", { id: nb.id })}
                onMenu={() => setMenu({ type: "nb", item: nb })}
              />
            )
          )}
          {addingNb ? (
            <AddForm placeholder="Notebook name…" onAdd={handleAddNotebook} onCancel={() => setAddingNb(false)} />
          ) : (
            <Pressable style={styles.addLink} onPress={() => setAddingNb(true)}>
              <Plus size={13} color={colors.text2} />
              <Text style={{ color: colors.text2, fontSize: 13 }}>New notebook</Text>
            </Pressable>
          )}
        </SbGroup>

        {isAdmin && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SbGroup label="Admin" icon={<Shield size={15} color={colors.text2} />}>
              <Item
                label="Admin Panel"
                color={colors.green}
                active={active === "admin"}
                onPress={() => go("/admin")}
                right={(
                  <View style={[styles.badge, { backgroundColor: colors.surface3 }]}>
                    <Text style={{ color: colors.text2, fontSize: 10, fontWeight: "600" }}>
                      {Math.round(sessionTimeoutMs / 60000)} min
                    </Text>
                  </View>
                )}
              />
            </SbGroup>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.footerRow}>
          <Pressable style={styles.footerBtn} onPress={toggle}>
            {theme === "dark" ? <Sun size={16} color={colors.text2} /> : <Moon size={16} color={colors.text2} />}
            <Text style={{ color: colors.text2, fontSize: 13 }}>{theme === "dark" ? "Light mode" : "Dark mode"}</Text>
          </Pressable>
          <OnlineDot />
        </View>

        <Pressable style={styles.userRow} onPress={() => setUserOpen((o) => !o)}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>{initials}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>{displayName.split(" ")[0]}</Text>
            <Text numberOfLines={1} style={{ color: colors.text3, fontSize: 11 }}>{user?.email}</Text>
          </View>
          <ChevronDown size={14} color={colors.text3} style={{ transform: [{ rotate: userOpen ? "180deg" : "0deg" }] }} />
        </Pressable>
        {userOpen && (
          <Pressable
            style={[styles.logout, { backgroundColor: colors.red + "18" }]}
            onPress={async () => {
              const ok = await confirmLogout();
              setUserOpen(false);
              if (ok) logout();
            }}
          >
            <LogOut size={15} color={colors.red} />
            <Text style={{ color: colors.red, fontWeight: "600" }}>Sign out</Text>
          </Pressable>
        )}
      </View>

      <Sheet
        visible={!!menu}
        onClose={() => setMenu(null)}
        title={menu?.type === "cat" ? menu?.item?.name : menu?.item?.notebookName}
      >
        <Pressable style={styles.sheetItem} onPress={() => onMenuAction("rename")}>
          <Pencil size={17} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 15 }}>Rename</Text>
        </Pressable>
        <Pressable style={styles.sheetItem} onPress={() => onMenuAction("delete")}>
          <Trash2 size={17} color={colors.red} />
          <Text style={{ color: colors.red, fontSize: 15 }}>Delete</Text>
        </Pressable>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  brandName: { fontSize: 18, fontWeight: "800" },
  groupHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8, paddingVertical: 8 },
  groupLabel: { flex: 1, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  item: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, minHeight: 42 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  itemLabel: { flex: 1, fontSize: 14 },
  menuBtn: { padding: 2 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  inlineEdit: { flex: 1, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 14 },
  addLink: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 9 },
  addForm: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 10, marginVertical: 4 },
  addInput: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7, fontSize: 14 },
  addActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  addBtn: { width: 34, height: 30, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, marginVertical: 8 },
  footer: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 8, gap: 6 },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: 6 },
  footerBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 4 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, paddingHorizontal: 4 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  logout: { flexDirection: "row", alignItems: "center", gap: 8, padding: 11, borderRadius: 8 },
  sheetItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 4 },
});
