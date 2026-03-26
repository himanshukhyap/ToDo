import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { useCategories } from "../hooks/useCategories";
import {
  CheckSquare, Plus, Check, X,
  Pencil, Trash2, Copy, ChevronDown, ChevronUp,
  Tag, Circle, CheckCircle2, Folder, Share2, Clock,
} from "lucide-react";
import CategoryManager from "./CategoryManager";

async function shareContent(title, text) {
  if (navigator.share) {
    try { await navigator.share({ title, text }); return "shared"; }
    catch(e) { if (e.name !== "AbortError") throw e; return "cancelled"; }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}

/* ── Subtask row ────────────────────────────────────────── */
function SubtaskRow({ subtask, taskId, task, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText]       = useState(subtask.text);
  const save = () => { if (!text.trim()) return; onEdit(taskId, task, subtask.id, text); setEditing(false); };

  if (editing) return (
    <div className="subtask-edit">
      <input className="input-sm flex1" value={text} autoFocus
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if(e.key==="Enter") save(); if(e.key==="Escape") setEditing(false); }}/>
      <button className="icon-btn" onClick={() => setEditing(false)}><X size={12}/></button>
      <button className="icon-btn green" onClick={save}><Check size={12}/></button>
    </div>
  );

  return (
    <div className={`subtask-row ${subtask.completed ? "done" : ""}`}>
      <button className="subtask-check" onClick={() => onToggle(taskId, task, subtask.id)}>
        {subtask.completed ? <CheckCircle2 size={15}/> : <Circle size={15}/>}
      </button>
      <span className="subtask-text">{subtask.text}</span>
      <div className="subtask-acts">
        <button className="icon-btn xs" onClick={() => setEditing(true)}><Pencil size={11}/></button>
        <button className="icon-btn xs danger-hover" onClick={() => onDelete(taskId, task, subtask.id)}><Trash2 size={11}/></button>
      </div>
    </div>
  );
}

/* ── Quick Category Picker (inline on task) ─────────────── */
function QuickCatPicker({ categories, current, onSelect, onManage }) {
  const [open, setOpen] = useState(false);
  const cat = categories.find(c => c.id === current);

  return (
    <div className="qcat-wrap">
      <button className="qcat-btn" onClick={() => setOpen(!open)} title="Change category">
        {cat
          ? <span className="cat-pill" style={{ background: cat.color+"22", color: cat.color }}><Tag size={10}/>{cat.name}</span>
          : <span className="qcat-placeholder"><Tag size={11}/> Category</span>
        }
        <ChevronDown size={11}/>
      </button>
      {open && (
        <div className="qcat-dropdown">
          <button className="qcat-item" onClick={() => { onSelect(null); setOpen(false); }}>
            <span className="cat-dot" style={{ background: "var(--text3)" }}/> No category
          </button>
          {categories.map(c => (
            <button key={c.id} className={`qcat-item ${current===c.id?"active":""}`}
              onClick={() => { onSelect(c.id); setOpen(false); }}>
              <span className="cat-dot" style={{ background: c.color }}/>{c.name}
              {current===c.id && <Check size={11} style={{ marginLeft:"auto" }}/>}
            </button>
          ))}
          <div className="qcat-divider"/>
          <button className="qcat-item manage" onClick={() => { onManage(); setOpen(false); }}>
            <Folder size={11}/> Manage categories
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Task Card ──────────────────────────────────────────── */
function TaskCard({ task, categories, onToggle, onUpdate, onDelete,
  onAddSubtask, onEditSubtask, onToggleSubtask, onDeleteSubtask, onManageCat }) {
  const [expanded,   setExpanded]   = useState(false);
  const [editing,    setEditing]    = useState(false);
  const [editTitle,  setEditTitle]  = useState(task.title);
  const [editCat,    setEditCat]    = useState(task.categoryId || "");
  const [newSub,     setNewSub]     = useState("");
  const [addingSub,  setAddingSub]  = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [shared,     setShared]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const cat      = categories.find(c => c.id === task.categoryId);
  const subtasks = task.subtasks || [];
  const doneCount = subtasks.filter(s => s.completed).length;

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
    if (subtasks.length) { lines.push(""); subtasks.forEach(s => lines.push(`  ${s.completed?"✅":"⬜"} ${s.text}`)); }
    return lines.join("\n");
  };
  const handleCopy = () => { navigator.clipboard.writeText(getShareText()); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const handleShare = async () => {
    const r = await shareContent(task.title, getShareText());
    if (r==="copied"||r==="shared") { setShared(true); setTimeout(()=>setShared(false),2000); }
  };
  const handleDelete = () => {
    if (confirmDel) onDelete(task.id);
    else { setConfirmDel(true); setTimeout(()=>setConfirmDel(false),2500); }
  };

  return (
    <div className={`task-card ${task.completed ? "task-done" : ""}`}>
      <div className="task-main-row">
        <button className="task-check" onClick={() => onToggle(task.id, task.completed)}>
          {task.completed ? <CheckCircle2 size={20}/> : <Circle size={20}/>}
        </button>

        <div className="task-body">
          {editing ? (
            <div className="task-edit-inline">
              <input className="input-sm flex1" value={editTitle} autoFocus
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter") saveEdit(); if(e.key==="Escape") setEditing(false); }}/>
              <select className="input-sm cat-select" value={editCat} onChange={e => setEditCat(e.target.value)}>
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="icon-btn" onClick={() => setEditing(false)}><X size={13}/></button>
              <button className="icon-btn green" onClick={saveEdit}><Check size={13}/></button>
            </div>
          ) : (
            <span className="task-title">{task.title}</span>
          )}

          {/* Meta row — category pill is now a quick-picker */}
          {!editing && (
            <div className="task-meta-row">
              <QuickCatPicker
                categories={categories}
                current={task.categoryId}
                onSelect={catId => onUpdate(task.id, { categoryId: catId })}
                onManage={onManageCat}
              />
              {subtasks.length > 0 && (
                <span className="subtask-count">{doneCount}/{subtasks.length} subtasks</span>
              )}
            </div>
          )}
        </div>

        <div className="task-inline-actions">
          <button className="task-action-btn" title="Add subtask" onClick={() => { setAddingSub(true); setExpanded(true); }}>
            <Plus size={14}/>
          </button>
          <button className="task-action-btn" title="Edit" onClick={() => setEditing(true)}>
            <Pencil size={14}/>
          </button>
          <button className="task-action-btn share-btn" title="Share" onClick={handleShare}>
            {shared ? <Check size={14} style={{color:"var(--green)"}}/> : <Share2 size={14}/>}
          </button>
          <button className="task-action-btn" title="Copy" onClick={handleCopy}>
            {copied ? <Check size={14} style={{color:"var(--green)"}}/> : <Copy size={14}/>}
          </button>
          <button className={`task-action-btn ${confirmDel?"del-confirm":""}`} title="Delete" onClick={handleDelete}>
            {confirmDel ? <Check size={14}/> : <Trash2 size={14}/>}
          </button>
          <button className="task-action-btn expand-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
        </div>
      </div>

      {subtasks.length > 0 && (
        <div className="subtask-progress">
          <div className="sub-bar" style={{ width:`${(doneCount/subtasks.length)*100}%` }}/>
        </div>
      )}

      {expanded && (
        <div className="subtask-area">
          {subtasks.map(sub => (
            <SubtaskRow key={sub.id} subtask={sub} taskId={task.id} task={task}
              onToggle={onToggleSubtask} onEdit={onEditSubtask} onDelete={onDeleteSubtask}/>
          ))}
          {addingSub ? (
            <div className="subtask-add-row">
              <input className="input-sm flex1" placeholder="Subtask…" value={newSub} autoFocus
                onChange={e => setNewSub(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter") addSub(); if(e.key==="Escape") setAddingSub(false); }}/>
              <button className="icon-btn" onClick={() => setAddingSub(false)}><X size={12}/></button>
              <button className="icon-btn green" onClick={addSub}><Check size={12}/></button>
            </div>
          ) : (
            <button className="add-subtask-btn" onClick={() => setAddingSub(true)}>
              <Plus size={13}/> Add subtask
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Inline Add Task row ────────────────────────────────── */
function AddTaskRow({ categories, onAdd, onManageCat }) {
  const [title,   setTitle]   = useState("");
  const [catId,   setCatId]   = useState("");
  const [focused, setFocused] = useState(false);

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title, catId || null);
    setTitle(""); setCatId(""); setFocused(false);
  };

  return (
    <div className={`add-task-row ${focused ? "focused" : ""}`}>
      <div className="add-task-icon"><Plus size={16}/></div>
      <input className="add-task-input" placeholder="Add a task…" value={title}
        onChange={e => setTitle(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={e => { if(e.key==="Enter") handleAdd(); if(e.key==="Escape"){ setFocused(false); setTitle(""); } }}
      />
      {focused && (
        <>
          <select className="input-sm cat-select" value={catId} onChange={e => setCatId(e.target.value)}>
            <option value="">No category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-primary sm" onClick={handleAdd} disabled={!title.trim()}>Add</button>
        </>
      )}
    </div>
  );
}

/* ── Task list ──────────────────────────────────────────── */
function TaskList({ tasks, categories, emptyMsg, handlers, onManageCat }) {
  if (tasks.length === 0) return <div className="empty-sm">{emptyMsg}</div>;
  return tasks.map(t => (
    <TaskCard key={t.id} task={t} categories={categories} onManageCat={onManageCat} {...handlers}/>
  ));
}

/* ── Main Tasks panel ───────────────────────────────────── */
export default function Tasks() {
  const { tasks, loading, error, addTask, updateTask, deleteTask, toggleTask,
    addSubtask, updateSubtask, toggleSubtask, deleteSubtask } = useTasks();
  const { categories } = useCategories();
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [filterCat,  setFilterCat]  = useState("");
  const [search,     setSearch]     = useState("");
  const [mobileTab,  setMobileTab]  = useState("pending"); // pending | completed

  const filtered = tasks.filter(t => {
    const ms = t.title?.toLowerCase().includes(search.toLowerCase());
    const mc = !filterCat || t.categoryId === filterCat;
    return ms && mc;
  });

  const pending   = filtered.filter(t => !t.completed);
  const completed = filtered.filter(t =>  t.completed);

  const handlers = {
    onToggle: toggleTask, onUpdate: updateTask, onDelete: deleteTask,
    onAddSubtask: addSubtask, onEditSubtask: updateSubtask,
    onToggleSubtask: toggleSubtask, onDeleteSubtask: deleteSubtask,
  };

  return (
    <div className="tab-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title">
          <CheckSquare size={18}/><span>Tasks</span>
          <span className="badge">{tasks.length}</span>
        </div>
        <div className="panel-header-right">
          <input className="search-input" placeholder="Search tasks…" value={search}
            onChange={e => setSearch(e.target.value)}/>
          <button className="btn-ghost sm" onClick={() => setShowCatMgr(true)}>
            <Folder size={14}/> Categories
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <AddTaskRow categories={categories} onAdd={addTask} onManageCat={() => setShowCatMgr(true)}/>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="cat-filter-bar">
          <button className={`cat-filter-btn ${!filterCat?"active":""}`} onClick={() => setFilterCat("")}>All</button>
          {categories.map(c => (
            <button key={c.id}
              className={`cat-filter-btn ${filterCat===c.id?"active":""}`}
              style={filterCat===c.id ? {background:c.color+"22",color:c.color,borderColor:c.color+"66"} : {}}
              onClick={() => setFilterCat(filterCat===c.id?"":c.id)}>
              <span className="cat-dot-xs" style={{background:c.color}}/>{c.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading-state"><span className="spinner"/></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={40} strokeWidth={1}/>
          <p>No tasks yet. Type above to add your first task.</p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="overall-progress">
            <span>{completed.length}/{tasks.length} completed</span>
            <div className="prog-bar"><div className="prog-fill" style={{width:`${(completed.length/tasks.length)*100}%`}}/></div>
          </div>

          {/* ── Desktop: collapsible sections ── */}
          <div className="tasks-desktop">
            {/* Pending section */}
            <DesktopSection title="Pending" icon={<Clock size={14}/>} tasks={pending}
              categories={categories} handlers={handlers} onManageCat={() => setShowCatMgr(true)}
              emptyMsg="Nothing pending 🎉" defaultOpen={true}/>
            {/* Completed section */}
            <DesktopSection title="Completed" icon={<CheckCircle2 size={14}/>} tasks={completed}
              categories={categories} handlers={handlers} onManageCat={() => setShowCatMgr(true)}
              emptyMsg="No completed tasks." defaultOpen={false}/>
          </div>

          {/* ── Mobile: tab switch ── */}
          <div className="tasks-mobile">
            <div className="mobile-task-tabs">
              <button className={`mobile-tab ${mobileTab==="pending"?"active":""}`} onClick={() => setMobileTab("pending")}>
                <Clock size={14}/> Pending <span className="badge sm">{pending.length}</span>
              </button>
              <button className={`mobile-tab ${mobileTab==="completed"?"active":""}`} onClick={() => setMobileTab("completed")}>
                <CheckCircle2 size={14}/> Done <span className="badge sm">{completed.length}</span>
              </button>
            </div>
            <div className="mobile-task-body">
              <TaskList
                tasks={mobileTab==="pending" ? pending : completed}
                categories={categories}
                emptyMsg={mobileTab==="pending" ? "Nothing pending 🎉" : "No completed tasks."}
                handlers={handlers}
                onManageCat={() => setShowCatMgr(true)}
              />
            </div>
          </div>
        </>
      )}

      {showCatMgr && <CategoryManager onClose={() => setShowCatMgr(false)}/>}
    </div>
  );
}

/* ── Desktop collapsible section ────────────────────────── */
function DesktopSection({ title, icon, tasks, categories, handlers, onManageCat, emptyMsg, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="task-section">
      <button className="section-toggle" onClick={() => setOpen(!open)}>
        <span className="section-toggle-left">{icon}<span>{title}</span><span className="badge sm">{tasks.length}</span></span>
        {open ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
      </button>
      {open && (
        <div className="section-body">
          <TaskList tasks={tasks} categories={categories} emptyMsg={emptyMsg}
            handlers={handlers} onManageCat={onManageCat}/>
        </div>
      )}
    </div>
  );
}
