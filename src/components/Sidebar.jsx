import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCategories } from "../hooks/useCategories";
import { useNotebooks } from "../hooks/useNotebook";
import { deleteNotebook as svcDeleteNotebook } from "../services/notebookDeleteService";
import { confirmDelete, confirmLogout, errorAlert } from "../utils/swal";
import { OnlineDot } from "./OfflineBanner";
import {
  CheckSquare, StickyNote, BookOpen, ChevronDown, ChevronRight,
  Plus, Sun, Moon, LogOut, MoreHorizontal, Pencil, Trash2,
  Check, X, Menu, PanelLeftClose,
} from "lucide-react";

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f59e0b","#10b981","#06b6d4","#3b82f6","#84cc16","#f97316"];

/* ── Inline rename input ──────────────────────── */
function InlineEdit({ value, onSave, onCancel }) {
  const [v, setV] = useState(value);
  const ref = useRef(null);
  useEffect(() => { ref.current?.select(); }, []);
  return (
    <input ref={ref} className="sb-inline-edit" value={v}
      onChange={e => setV(e.target.value)}
      onKeyDown={e => {
        if (e.key === "Enter") { e.preventDefault(); if (v.trim()) onSave(v.trim()); }
        if (e.key === "Escape") onCancel();
      }}
      onBlur={() => { if (v.trim()) onSave(v.trim()); else onCancel(); }}
    />
  );
}

/* ── Item row dots menu ───────────────────────── */
function ItemMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div className="sb-item-menu" ref={ref} onClick={e => e.stopPropagation()}>
      <button className="sb-item-menu-btn" onClick={() => setOpen(o => !o)}>
        <MoreHorizontal size={13}/>
      </button>
      {open && (
        <div className="sb-item-dropdown">
          <button className="sb-item-dd-btn" onClick={() => { onEdit(); setOpen(false); }}>
            <Pencil size={12}/> Rename
          </button>
          <button className="sb-item-dd-btn danger" onClick={() => { onDelete(); setOpen(false); }}>
            <Trash2 size={12}/> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Collapsible group ────────────────────────── */
function SbGroup({ label, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sb-group">
      <button className="sb-group-header" onClick={() => setOpen(o => !o)}>
        <span className="sb-group-icon">{icon}</span>
        <span className="sb-group-label">{label}</span>
        {open ? <ChevronDown size={12} className="sb-chevron"/> : <ChevronRight size={12} className="sb-chevron"/>}
      </button>
      {open && <div className="sb-group-body">{children}</div>}
    </div>
  );
}

/* ── Main Sidebar ─────────────────────────────── */
export default function Sidebar({
  active, setActive, activeCat, setActiveCat,
  activeNotebook, setActiveNotebook, collapsed, setCollapsed
}) {
  const { user, logout }  = useAuth();
  const { theme, toggle } = useTheme();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { notebooks, createNotebook, renameNotebook } = useNotebooks();

  // Category form state
  const [addingCat,   setAddingCat]   = useState(false);
  const [newCatName,  setNewCatName]  = useState("");
  const [newCatColor, setNewCatColor] = useState(COLORS[0]);
  const [editCatId,   setEditCatId]   = useState(null);

  // Notebook form state
  const [addingNb,    setAddingNb]    = useState(false);
  const [newNbName,   setNewNbName]   = useState("");
  const [newNbColor,  setNewNbColor]  = useState(COLORS[0]);
  const [editNbId,    setEditNbId]    = useState(null);

  // User dropdown
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);
  useEffect(() => {
    const fn = e => { if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initials    = displayName[0]?.toUpperCase() || "U";

  /* ── Handlers ──────────────────────────────── */
  const handleAddNotebook = async () => {
    if (!newNbName.trim()) return;
    try {
      const { notebookId } = await createNotebook(newNbName, newNbColor);
      // onSnapshot will add it to list — navigate to it
      setActive("notebook");
      setActiveNotebook({ id: notebookId, notebookName: newNbName.trim(), color: newNbColor });
    } catch (e) {
      console.error("[Sidebar] createNotebook:", e);
      errorAlert(`Could not create notebook: ${e.message}`);
    }
    setNewNbName(""); setAddingNb(false);
  };

  const handleDeleteNotebook = async (nb) => {
    const ok = await confirmDelete(`notebook "${nb.notebookName}" and ALL its sections & pages`);
    if (!ok) return;
    try {
      // Sequential hard delete: pages → sections → notebook
      await svcDeleteNotebook(nb.id, user.uid);
      if (activeNotebook?.id === nb.id) setActiveNotebook(null);
    } catch (e) {
      console.error("[Sidebar] deleteNotebook error:", e.code, e.message);
      errorAlert(`Delete failed: ${e.message}\n\nMake sure Firestore rules are deployed.`);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const ok = await confirmDelete(`category "${cat.name}"`);
    if (!ok) return;
    try {
      await deleteCategory(cat.id);
      if (activeCat === cat.id) setActiveCat(null);
    } catch (e) {
      errorAlert(`Could not delete category: ${e.message}`);
    }
  };

  /* ── Collapsed sidebar ─────────────────────── */
  if (collapsed) return (
    <aside className="sidebar sidebar-collapsed">
      <button className="sb-collapse-btn" onClick={() => setCollapsed(false)} title="Expand sidebar">
        <Menu size={18}/>
      </button>
      <div className="sb-collapsed-icons">
        <button className={`sb-col-icon ${active==="tasks"    ? "active":""}`} onClick={()=>setActive("tasks")}    title="Tasks"><CheckSquare size={18}/></button>
        <button className={`sb-col-icon ${active==="notes"    ? "active":""}`} onClick={()=>setActive("notes")}    title="Notes"><StickyNote size={18}/></button>
        <button className={`sb-col-icon ${active==="notebook" ? "active":""}`} onClick={()=>setActive("notebook")} title="Notebook"><BookOpen size={18}/></button>
      </div>
      <div className="sb-collapsed-bottom">
        <button className="sb-col-icon" onClick={toggle} title="Toggle theme">
          {theme==="dark" ? <Sun size={17}/> : <Moon size={17}/>}
        </button>
        <div className="avatar-fallback sm" style={{cursor:"pointer"}} onClick={()=>setCollapsed(false)}>{initials}</div>
      </div>
    </aside>
  );

  /* ── Full sidebar ──────────────────────────── */
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sb-brand">
        <div className="brand-icon sm">NT</div>
        <span className="sb-brand-name">NoteTask</span>
        <button className="sb-collapse-btn ml-auto" onClick={() => setCollapsed(true)} title="Collapse">
          <PanelLeftClose size={16}/>
        </button>
      </div>

      <nav className="sb-nav">
        {/* ── TASKS ────────────────────────────── */}
        <SbGroup label="Tasks" icon={<CheckSquare size={15}/>}>
          <button className={`sb-item ${active==="tasks" && !activeCat ? "active" : ""}`}
            onClick={() => { setActive("tasks"); setActiveCat(null); }}>
            <span className="sb-item-dot" style={{background:"var(--text3)"}}/> All Tasks
          </button>
          {categories.map(cat => (
            editCatId === cat.id ? (
              <div key={cat.id} className="sb-item">
                <span className="sb-item-dot" style={{background:cat.color}}/>
                <InlineEdit value={cat.name}
                  onSave={v => { updateCategory(cat.id, v, cat.color); setEditCatId(null); }}
                  onCancel={() => setEditCatId(null)}/>
              </div>
            ) : (
              <button key={cat.id}
                className={`sb-item ${active==="tasks" && activeCat===cat.id ? "active" : ""}`}
                onClick={() => { setActive("tasks"); setActiveCat(cat.id); }}>
                <span className="sb-item-dot" style={{background:cat.color}}/>
                <span className="sb-item-label">{cat.name}</span>
                <ItemMenu
                  onEdit={() => setEditCatId(cat.id)}
                  onDelete={() => handleDeleteCategory(cat)}
                />
              </button>
            )
          ))}
          {addingCat ? (
            <div className="sb-add-form">
              <input className="sb-add-input" placeholder="Category name…" value={newCatName} autoFocus
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => {
                  if (e.key==="Enter" && newCatName.trim()) { addCategory(newCatName, newCatColor); setNewCatName(""); setAddingCat(false); }
                  if (e.key==="Escape") setAddingCat(false);
                }}/>
              <div className="sb-add-colors">
                {COLORS.slice(0,6).map(c => (
                  <button key={c} className={`sb-color-dot ${newCatColor===c?"sel":""}`}
                    style={{background:c}} onClick={()=>setNewCatColor(c)}/>
                ))}
              </div>
              <div className="sb-add-actions">
                <button className="sb-add-cancel" onClick={()=>setAddingCat(false)}><X size={12}/></button>
                <button className="sb-add-ok" onClick={()=>{ if(newCatName.trim()){ addCategory(newCatName,newCatColor); setNewCatName(""); setAddingCat(false); } }}><Check size={12}/></button>
              </div>
            </div>
          ) : (
            <button className="sb-add-btn" onClick={()=>setAddingCat(true)}>
              <Plus size={12}/> Add category
            </button>
          )}
        </SbGroup>

        <div className="sb-divider"/>

        {/* ── NOTES ────────────────────────────── */}
        <SbGroup label="Notes" icon={<StickyNote size={15}/>}>
          <button className={`sb-item ${active==="notes" ? "active" : ""}`} onClick={() => setActive("notes")}>
            <span className="sb-item-dot" style={{background:"var(--text3)"}}/> All Notes
          </button>
        </SbGroup>

        <div className="sb-divider"/>

        {/* ── NOTEBOOK ─────────────────────────── */}
        <SbGroup label="Notebook" icon={<BookOpen size={15}/>}>
          {notebooks.map(nb => (
            editNbId === nb.id ? (
              <div key={nb.id} className="sb-item">
                <span className="sb-item-dot" style={{background:nb.color}}/>
                <InlineEdit value={nb.notebookName}
                  onSave={v => { renameNotebook(nb.id, v, nb.color); setEditNbId(null); }}
                  onCancel={() => setEditNbId(null)}/>
              </div>
            ) : (
              <button key={nb.id}
                className={`sb-item ${active==="notebook" && activeNotebook?.id===nb.id ? "active" : ""}`}
                onClick={() => { setActive("notebook"); setActiveNotebook(nb); }}>
                <span className="sb-item-dot" style={{background:nb.color}}/>
                <span className="sb-item-label">{nb.notebookName}</span>
                <ItemMenu
                  onEdit={() => setEditNbId(nb.id)}
                  onDelete={() => handleDeleteNotebook(nb)}
                />
              </button>
            )
          ))}
          {addingNb ? (
            <div className="sb-add-form">
              <input className="sb-add-input" placeholder="Notebook name…" value={newNbName} autoFocus
                onChange={e => setNewNbName(e.target.value)}
                onKeyDown={e => {
                  if (e.key==="Enter") handleAddNotebook();
                  if (e.key==="Escape") setAddingNb(false);
                }}/>
              <div className="sb-add-colors">
                {COLORS.slice(0,6).map(c => (
                  <button key={c} className={`sb-color-dot ${newNbColor===c?"sel":""}`}
                    style={{background:c}} onClick={()=>setNewNbColor(c)}/>
                ))}
              </div>
              <div className="sb-add-actions">
                <button className="sb-add-cancel" onClick={()=>setAddingNb(false)}><X size={12}/></button>
                <button className="sb-add-ok" onClick={handleAddNotebook}><Check size={12}/></button>
              </div>
            </div>
          ) : (
            <button className="sb-add-btn" onClick={()=>setAddingNb(true)}>
              <Plus size={12}/> New notebook
            </button>
          )}
        </SbGroup>
      </nav>

      {/* Footer */}
      <div className="sb-footer">
        <div className="sb-footer-row">
          <button className="sb-footer-btn" onClick={toggle}>
            {theme==="dark" ? <Sun size={16}/> : <Moon size={16}/>}
            <span>{theme==="dark" ? "Light mode" : "Dark mode"}</span>
          </button>
          <OnlineDot/>
        </div>
        <div className="sb-user" ref={userRef}>
          <button className="sb-user-trigger" onClick={() => setUserOpen(o => !o)}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="avatar sm" referrerPolicy="no-referrer"/>
              : <div className="avatar-fallback sm">{initials}</div>
            }
            <div className="sb-user-info">
              <span className="sb-user-name">{displayName.split(" ")[0]}</span>
              <span className="sb-user-email">{user?.email}</span>
            </div>
            <ChevronDown size={12} className={`sb-chevron ${userOpen?"open":""}`}/>
          </button>
          {userOpen && (
            <div className="sb-user-dropdown">
              <button className="sb-user-dd-item logout" onClick={async () => {
                const ok = await confirmLogout();
                if (ok) logout();
                setUserOpen(false);
              }}>
                <LogOut size={14}/> Sign out
              </button>
            </div>
          )}
        </div>
      </div>  {/* /sb-footer */}
    </aside>
  );
}
