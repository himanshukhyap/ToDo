import { useState, useRef, useEffect } from "react";
import { useTasks } from "../hooks/useTasks";
import { useCategories } from "../hooks/useCategories";
import {
  CheckSquare, Plus, Check, X, MoreVertical,
  Pencil, Trash2, Copy, ChevronDown, ChevronUp,
  Tag, Circle, CheckCircle2, Folder
} from "lucide-react";
import CategoryManager from "./CategoryManager";

/* ── Three-dot dropdown ─────────────────────────────────── */
function DotsMenu({ options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="dots-menu" ref={ref}>
      <button className="icon-btn dots-btn" onClick={() => setOpen(!open)}>
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="dots-dropdown">
          {options.map((opt) => (
            <button key={opt.label} className={`dots-item ${opt.danger ? "danger" : ""}`}
              onClick={() => { opt.action(); setOpen(false); }}>
              {opt.icon}{opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Subtask row ────────────────────────────────────────── */
function SubtaskRow({ subtask, taskId, task, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(subtask.text);

  const handleSave = () => {
    if (!text.trim()) return;
    onEdit(taskId, task, subtask.id, text);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="subtask-edit">
        <input className="input-sm flex1" value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
          autoFocus />
        <button className="icon-btn" onClick={() => setEditing(false)}><X size={12} /></button>
        <button className="icon-btn green" onClick={handleSave}><Check size={12} /></button>
      </div>
    );
  }

  return (
    <div className={`subtask-row ${subtask.completed ? "done" : ""}`}>
      <button className="subtask-check" onClick={() => onToggle(taskId, task, subtask.id)}>
        {subtask.completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
      </button>
      <span className="subtask-text">{subtask.text}</span>
      <div className="subtask-acts">
        <button className="icon-btn xs" onClick={() => setEditing(true)}><Pencil size={11} /></button>
        <button className="icon-btn xs danger-hover" onClick={() => onDelete(taskId, task, subtask.id)}><Trash2 size={11} /></button>
      </div>
    </div>
  );
}

/* ── Task card ──────────────────────────────────────────── */
function TaskCard({ task, categories, onToggle, onUpdate, onDelete,
  onAddSubtask, onEditSubtask, onToggleSubtask, onDeleteSubtask }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editCat, setEditCat] = useState(task.categoryId || "");
  const [newSub, setNewSub] = useState("");
  const [addingSub, setAddingSub] = useState(false);

  const cat = categories.find((c) => c.id === task.categoryId);
  const subtasks = task.subtasks || [];
  const doneCount = subtasks.filter((s) => s.completed).length;

  const handleEditSave = () => {
    if (!editTitle.trim()) return;
    onUpdate(task.id, { title: editTitle.trim(), categoryId: editCat || null });
    setEditing(false);
  };

  const handleAddSub = () => {
    if (!newSub.trim()) return;
    onAddSubtask(task.id, newSub);
    setNewSub("");
    setAddingSub(false);
  };

  const handleCopy = () => {
    const text = [task.title, ...subtasks.map((s) => `  • ${s.text}`)].join("\n");
    navigator.clipboard.writeText(text);
  };

  const menuOptions = [
    { label: "Edit", icon: <Pencil size={13} />, action: () => { setEditing(true); setExpanded(true); } },
    { label: "Copy", icon: <Copy size={13} />, action: handleCopy },
    { label: "Add Subtask", icon: <Plus size={13} />, action: () => { setAddingSub(true); setExpanded(true); } },
    { label: "Delete", icon: <Trash2 size={13} />, action: () => onDelete(task.id), danger: true },
  ];

  return (
    <div className={`task-card ${task.completed ? "task-done" : ""}`}>
      {/* Main row */}
      <div className="task-main-row">
        <button className="task-check" onClick={() => onToggle(task.id, task.completed)}>
          {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </button>

        <div className="task-body">
          {editing ? (
            <div className="task-edit-inline">
              <input className="input-sm flex1" value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(); if (e.key === "Escape") setEditing(false); }}
                autoFocus />
              <select className="input-sm cat-select" value={editCat} onChange={(e) => setEditCat(e.target.value)}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="icon-btn" onClick={() => setEditing(false)}><X size={13} /></button>
              <button className="icon-btn green" onClick={handleEditSave}><Check size={13} /></button>
            </div>
          ) : (
            <span className="task-title" onDoubleClick={() => setEditing(true)}>{task.title}</span>
          )}

          <div className="task-meta-row">
            {cat && (
              <span className="cat-pill" style={{ background: cat.color + "22", color: cat.color }}>
                <Tag size={10} />{cat.name}
              </span>
            )}
            {subtasks.length > 0 && (
              <span className="subtask-count">{doneCount}/{subtasks.length} subtasks</span>
            )}
          </div>
        </div>

        <div className="task-right">
          <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <DotsMenu options={menuOptions} />
        </div>
      </div>

      {/* Subtask progress */}
      {subtasks.length > 0 && (
        <div className="subtask-progress">
          <div className="sub-bar" style={{ width: `${(doneCount / subtasks.length) * 100}%` }} />
        </div>
      )}

      {/* Expanded: subtasks */}
      {expanded && (
        <div className="subtask-area">
          {subtasks.map((sub) => (
            <SubtaskRow
              key={sub.id}
              subtask={sub}
              taskId={task.id}
              task={task}
              onToggle={onToggleSubtask}
              onEdit={onEditSubtask}
              onDelete={onDeleteSubtask}
            />
          ))}

          {addingSub ? (
            <div className="subtask-add-row">
              <input className="input-sm flex1" placeholder="Subtask…" value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddSub(); if (e.key === "Escape") setAddingSub(false); }}
                autoFocus />
              <button className="icon-btn" onClick={() => setAddingSub(false)}><X size={12} /></button>
              <button className="icon-btn green" onClick={handleAddSub}><Check size={12} /></button>
            </div>
          ) : (
            <button className="add-subtask-btn" onClick={() => setAddingSub(true)}>
              <Plus size={13} /> Add subtask
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Inline Add Task row ────────────────────────────────── */
function AddTaskRow({ categories, onAdd }) {
  const [title, setTitle] = useState("");
  const [catId, setCatId] = useState("");
  const [focused, setFocused] = useState(false);

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title, catId || null);
    setTitle("");
    setCatId("");
    setFocused(false);
  };

  return (
    <div className={`add-task-row ${focused ? "focused" : ""}`}>
      <div className="add-task-icon"><Plus size={16} /></div>
      <input
        className="add-task-input"
        placeholder="Add a task…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
          if (e.key === "Escape") { setFocused(false); setTitle(""); }
        }}
      />
      {focused && (
        <>
          <select className="input-sm cat-select" value={catId} onChange={(e) => setCatId(e.target.value)}>
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-primary sm" onClick={handleAdd} disabled={!title.trim()}>
            Add
          </button>
        </>
      )}
    </div>
  );
}

/* ── Task section (pending / completed) ─────────────────── */
function TaskSection({ title, icon, tasks, categories, defaultOpen, ...handlers }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="task-section">
      <button className="section-toggle" onClick={() => setOpen(!open)}>
        <span className="section-toggle-left">{icon}<span>{title}</span><span className="badge sm">{tasks.length}</span></span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && (
        <div className="section-body">
          {tasks.length === 0 ? (
            <div className="empty-sm">{title === "Pending" ? "Nothing pending 🎉" : "No completed tasks."}</div>
          ) : (
            tasks.map((t) => <TaskCard key={t.id} task={t} categories={categories} {...handlers} />)
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Tasks panel ───────────────────────────────────── */
export default function Tasks() {
  const {
    tasks, loading, error,
    addTask, updateTask, deleteTask, toggleTask,
    addSubtask, updateSubtask, toggleSubtask, deleteSubtask,
  } = useTasks();
  const { categories } = useCategories();
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [search, setSearch] = useState("");

  const filtered = tasks.filter((t) => {
    const ms = t.title?.toLowerCase().includes(search.toLowerCase());
    const mc = !filterCat || t.categoryId === filterCat;
    return ms && mc;
  });

  const pending = filtered.filter((t) => !t.completed);
  const completed = filtered.filter((t) => t.completed);

  const handlers = {
    onToggle: toggleTask,
    onUpdate: updateTask,
    onDelete: deleteTask,
    onAddSubtask: addSubtask,
    onEditSubtask: updateSubtask,
    onToggleSubtask: toggleSubtask,
    onDeleteSubtask: deleteSubtask,
  };

  return (
    <div className="tab-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title">
          <CheckSquare size={18} />
          <span>Tasks</span>
          <span className="badge">{tasks.length}</span>
        </div>
        <div className="panel-header-right">
          <input className="search-input" placeholder="Search tasks…" value={search}
            onChange={(e) => setSearch(e.target.value)} />
          <button className="btn-ghost sm" onClick={() => setShowCatMgr(true)}>
            <Folder size={14} /> Categories
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Inline add task */}
      <AddTaskRow categories={categories} onAdd={addTask} />

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="cat-filter-bar">
          <button className={`cat-filter-btn ${!filterCat ? "active" : ""}`} onClick={() => setFilterCat("")}>All</button>
          {categories.map((c) => (
            <button key={c.id}
              className={`cat-filter-btn ${filterCat === c.id ? "active" : ""}`}
              style={filterCat === c.id ? { background: c.color + "22", color: c.color, borderColor: c.color + "66" } : {}}
              onClick={() => setFilterCat(filterCat === c.id ? "" : c.id)}>
              <span className="cat-dot-xs" style={{ background: c.color }} />{c.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading-state"><span className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={40} strokeWidth={1} />
          <p>No tasks yet. Type above to add your first task.</p>
        </div>
      ) : (
        <>
          {/* Progress */}
          {tasks.length > 0 && (
            <div className="overall-progress">
              <span>{completed.length}/{tasks.length} completed</span>
              <div className="prog-bar"><div className="prog-fill" style={{ width: `${(completed.length / tasks.length) * 100}%` }} /></div>
            </div>
          )}

          <TaskSection title="Pending" icon={<Circle size={14} />}
            tasks={pending} categories={categories} defaultOpen={true} {...handlers} />
          <TaskSection title="Completed" icon={<CheckCircle2 size={14} />}
            tasks={completed} categories={categories} defaultOpen={false} {...handlers} />
        </>
      )}

      {showCatMgr && <CategoryManager onClose={() => setShowCatMgr(false)} />}
    </div>
  );
}
