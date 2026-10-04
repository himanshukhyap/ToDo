import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, Folder, Pencil, Plus, Trash2, X } from "lucide-react-native";
import { useCategories } from "../hooks/useCategories";
import { useTheme } from "../context/ThemeContext";
import { Btn, ColorDots, ErrorBanner, IconBtn, Input, Sheet } from "./ui";
import { COLORS } from "../theme";

function CategoryRow({ cat, onSave, onDelete }) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [color, setColor] = useState(cat.color);
  const [confirmDel, setConfirmDel] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave(cat.id, name, color);
    setEditing(false);
  };

  const handleDelete = () => {
    if (confirmDel) { onDelete(cat.id); }
    else { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 2500); }
  };

  if (editing) {
    return (
      <View style={[styles.row, styles.editing, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
        <Input value={name} onChangeText={setName} autoFocus onSubmitEditing={handleSave} />
        <ColorDots colors={COLORS} value={color} onChange={setColor} size={22} />
        <View style={styles.actions}>
          <IconBtn onPress={() => setEditing(false)}><X size={16} color={colors.text2} /></IconBtn>
          <IconBtn onPress={handleSave}><Check size={16} color={colors.green} /></IconBtn>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: cat.color }]} />
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{cat.name}</Text>
      <IconBtn onPress={() => setEditing(true)}><Pencil size={15} color={colors.text2} /></IconBtn>
      <IconBtn onPress={handleDelete} style={confirmDel && { backgroundColor: colors.red + "22" }}>
        {confirmDel ? <Check size={15} color={colors.red} /> : <Trash2 size={15} color={colors.text2} />}
      </IconBtn>
    </View>
  );
}

export default function CategoryManager({ visible, onClose }) {
  const { colors } = useTheme();
  const { categories, error, addCategory, updateCategory, deleteCategory } = useCategories();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addCategory(newName, newColor);
    setNewName("");
    setNewColor(COLORS[0]);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Manage Categories" icon={<Folder size={17} color={colors.text} />}>
      <ErrorBanner text={error} />
      <View style={styles.addRow}>
        <Input style={{ flex: 1 }} placeholder="Category name…" value={newName} onChangeText={setNewName} onSubmitEditing={handleAdd} />
        <Btn small title="Add" icon={<Plus size={14} color="#fff" />} onPress={handleAdd} disabled={!newName.trim()} />
      </View>
      <View style={{ marginVertical: 12 }}>
        <ColorDots colors={COLORS} value={newColor} onChange={setNewColor} />
      </View>
      {categories.length === 0 ? (
        <Text style={{ color: colors.text3, textAlign: "center", paddingVertical: 16 }}>No categories yet.</Text>
      ) : (
        categories.map((cat) => (
          <CategoryRow key={cat.id} cat={cat} onSave={updateCategory} onDelete={deleteCategory} />
        ))
      )}
    </Sheet>
  );
}

/** Pick a category (or none) — replaces the web <select> / quick picker */
export function CategoryPicker({ visible, onClose, categories, current, onSelect, onManage }) {
  const { colors } = useTheme();
  const Row = ({ id, name, color }) => (
    <Pressable
      style={[styles.pickRow, current === id && { backgroundColor: colors.accent + "1f" }]}
      onPress={() => { onSelect(id); onClose(); }}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={{ color: colors.text, fontSize: 15, flex: 1 }}>{name}</Text>
      {current === id && <Check size={16} color={colors.accent} />}
    </Pressable>
  );
  return (
    <Sheet visible={visible} onClose={onClose} title="Category" icon={<Folder size={17} color={colors.text} />}>
      <Row id={null} name="No category" color={colors.text3} />
      {categories.map((c) => <Row key={c.id} id={c.id} name={c.name} color={c.color} />)}
      {onManage && (
        <Pressable style={[styles.pickRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 6 }]} onPress={() => { onClose(); onManage(); }}>
          <Folder size={15} color={colors.text2} />
          <Text style={{ color: colors.text2, fontSize: 14 }}>Manage categories</Text>
        </Pressable>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  editing: { flexDirection: "column", alignItems: "stretch", borderWidth: 1, borderRadius: 10, padding: 10, marginVertical: 6 },
  actions: { flexDirection: "row", justifyContent: "flex-end" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1, fontSize: 15 },
  pickRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 8, borderRadius: 8 },
});
