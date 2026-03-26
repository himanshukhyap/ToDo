import { useState } from "react";
import { useCategories } from "../hooks/useCategories";
import { Plus, Pencil, Trash2, Check, X, Folder } from "lucide-react";

const PRESET_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#f43f5e",
  "#f59e0b","#10b981","#06b6d4","#3b82f6",
  "#84cc16","#f97316",
];

function CategoryRow({ cat, onSave, onDelete }) {
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
      <div className="cat-row editing">
        <input
          className="input-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
        />
        <div className="color-row-sm">
          {PRESET_COLORS.map((c) => (
            <button key={c} className={`color-dot ${color === c ? "selected" : ""}`}
              style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
        <div className="row-actions">
          <button className="icon-btn" onClick={() => setEditing(false)}><X size={14} /></button>
          <button className="icon-btn green" onClick={handleSave}><Check size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="cat-row">
      <span className="cat-dot" style={{ background: cat.color }} />
      <span className="cat-name">{cat.name}</span>
      <div className="row-actions">
        <button className="icon-btn" onClick={() => setEditing(true)}><Pencil size={13} /></button>
        <button className={`icon-btn ${confirmDel ? "danger-active" : ""}`} onClick={handleDelete}>
          {confirmDel ? <Check size={13} /> : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  );
}

export default function CategoryManager({ onClose }) {
  const { categories, error, addCategory, updateCategory, deleteCategory } = useCategories();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addCategory(newName, newColor);
    setNewName("");
    setNewColor("#6366f1");
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div className="modal-title"><Folder size={16} /> Manage Categories</div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="error-banner mx">{error}</div>}

        {/* Add new */}
        <div className="cat-add-row">
          <input
            className="input-sm flex1"
            placeholder="Category name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button className="btn-primary sm" onClick={handleAdd} disabled={!newName.trim()}>
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="color-row-sm px">
          {PRESET_COLORS.map((c) => (
            <button key={c} className={`color-dot ${newColor === c ? "selected" : ""}`}
              style={{ background: c }} onClick={() => setNewColor(c)} />
          ))}
        </div>

        <div className="modal-list">
          {categories.length === 0 ? (
            <div className="empty-sm">No categories yet.</div>
          ) : (
            categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                onSave={updateCategory}
                onDelete={deleteCategory}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
