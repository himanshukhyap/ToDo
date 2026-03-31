import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useAuth } from "../context/AuthContext";
import { useSections, usePages } from "../hooks/useNotebook";
import {
  deletePage    as svcDeletePage,
  deleteSection as svcDeleteSection,
} from "../services/notebookDeleteService";
import { confirmDelete } from "../utils/swal";
import {
  Plus, Pencil, Trash2, Check, X, FileText, BookOpen,
  Bold, Italic, Underline as UlIcon, List, ListOrdered,
  Strikethrough, Code, Undo, Redo, Save, AlignLeft,
  ChevronRight, AlertCircle,
} from "lucide-react";

const SEC_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f59e0b","#10b981","#06b6d4","#3b82f6","#84cc16","#f97316"];

/* ── Toast ──────────────────────────────────────────── */
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`nb-toast nb-toast-${toast.type}`}>
      {toast.type === "error" && <AlertCircle size={14}/>}
      <span>{toast.msg}</span>
    </div>
  );
}

/* ── TipTap Toolbar ─────────────────────────────────── */
function Toolbar({ editor, onSave, saving, dirty }) {
  if (!editor) return null;
  const B = (active, fn, icon, tip) => (
    <button type="button" className={`nb-tb-btn ${active?"active":""}`}
      onMouseDown={e => { e.preventDefault(); fn(); }} title={tip}>{icon}</button>
  );
  return (
    <div className="nb-toolbar">
      <div className="nb-tb-group">
        {B(false, () => editor.chain().focus().undo().run(), <Undo size={14}/>, "Undo (Ctrl+Z)")}
        {B(false, () => editor.chain().focus().redo().run(), <Redo size={14}/>, "Redo")}
      </div>
      <div className="nb-tb-sep"/>
      <div className="nb-tb-group">
        {B(editor.isActive("bold"),      () => editor.chain().focus().toggleBold().run(),      <Bold size={14}/>,          "Bold")}
        {B(editor.isActive("italic"),    () => editor.chain().focus().toggleItalic().run(),    <Italic size={14}/>,        "Italic")}
        {B(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <UlIcon size={14}/>,        "Underline")}
        {B(editor.isActive("strike"),    () => editor.chain().focus().toggleStrike().run(),    <Strikethrough size={14}/>, "Strike")}
        {B(editor.isActive("code"),      () => editor.chain().focus().toggleCode().run(),      <Code size={14}/>,          "Code")}
      </div>
      <div className="nb-tb-sep"/>
      <div className="nb-tb-group">
        {B(editor.isActive("heading",{level:1}), () => editor.chain().focus().toggleHeading({level:1}).run(), <b className="nb-hn">H1</b>, "Heading 1")}
        {B(editor.isActive("heading",{level:2}), () => editor.chain().focus().toggleHeading({level:2}).run(), <b className="nb-hn">H2</b>, "Heading 2")}
        {B(editor.isActive("heading",{level:3}), () => editor.chain().focus().toggleHeading({level:3}).run(), <b className="nb-hn">H3</b>, "Heading 3")}
      </div>
      <div className="nb-tb-sep"/>
      <div className="nb-tb-group">
        {B(editor.isActive("bulletList"),  () => editor.chain().focus().toggleBulletList().run(),  <List size={14}/>,        "Bullet List")}
        {B(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered size={14}/>, "Numbered List")}
        {B(editor.isActive("blockquote"),  () => editor.chain().focus().toggleBlockquote().run(),  <AlignLeft size={14}/>,   "Blockquote")}
        {B(editor.isActive("codeBlock"),   () => editor.chain().focus().toggleCodeBlock().run(),   <Code size={14}/>,        "Code Block")}
      </div>
      <div className="nb-tb-spacer"/>
      <button type="button"
        className={`nb-save-btn ${dirty?"dirty":""}`}
        onClick={onSave}
        disabled={saving || !dirty}
        title="Save (Ctrl+S)">
        {saving ? <span className="nb-spinner"/> : <><Save size={13}/>{dirty ? " Save" : " Saved"}</>}
      </button>
    </div>
  );
}

/* ── Page Editor ────────────────────────────────────── */
function PageEditor({ page, onSave: saveFn }) {
  const [title,  setTitle]  = useState(page?.pageName || "");
  const [dirty,  setDirty]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Start writing your page…" }),
    ],
    content: page?.htmlContent || "",
    onUpdate: () => setDirty(true),
  }, [page?.id]);

  useEffect(() => {
    setTitle(page?.pageName || "");
    setDirty(false);
    setSaved(false);
  }, [page?.id]);

  const handleSave = useCallback(async () => {
    if (!editor || !page || saving) return;
    setSaving(true);
    try {
      await saveFn(page.id, editor.getHTML(), editor.getText(), title);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error("[Editor] save failed:", e);
    } finally {
      setSaving(false);
    }
  }, [editor, page, saving, saveFn, title]);

  // Ctrl+S
  useEffect(() => {
    const fn = e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  });

  const ts = page?.updatedAt?.toDate
    ? page.updatedAt.toDate().toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
    : "";

  if (!page) return (
    <div className="nb-empty-editor">
      <FileText size={52} strokeWidth={1}/>
      <p>Select a page or create one to start writing</p>
    </div>
  );

  return (
    <div className="nb-editor-panel">
      <div className="nb-page-head">
        <input className="nb-page-title" value={title}
          onChange={e => { setTitle(e.target.value); setDirty(true); }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }}
          placeholder="Page title…"/>
        <div className="nb-page-meta">
          {saving && <span className="nb-meta-tag saving"><span className="nb-spinner"/> Saving…</span>}
          {saved  && !saving && <span className="nb-meta-tag saved"><Check size={11}/> Saved</span>}
          {dirty  && !saving && !saved && <span className="nb-meta-tag unsaved">● Unsaved</span>}
          {ts && !dirty && !saved && !saving && <span className="nb-meta-tag ts">Edited {ts}</span>}
        </div>
      </div>
      <Toolbar editor={editor} onSave={handleSave} saving={saving} dirty={dirty}/>
      <div className="nb-editor-body">
        <EditorContent editor={editor} className="nb-prose"/>
      </div>
    </div>
  );
}

/* ── Pages Panel ────────────────────────────────────── */
function PagesPanel({ section, notebookId, activePage, setActivePage, uid, showToast }) {
  const { pages, createPage, renamePage, savePage } = usePages(section?.id);
  const [editId,   setEditId]   = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Auto-select first page when section changes or pages load
  useEffect(() => {
    if (pages.length > 0 && (!activePage || !pages.find(p => p.id === activePage.id))) {
      setActivePage(pages[0]);
    }
  }, [pages.length, section?.id]);

  const handleAddPage = async () => {
    try {
      await createPage(section.id, notebookId, uid);
    } catch (e) {
      console.error("[Pages] add failed:", e);
      showToast("Could not add page: " + e.message, "error");
    }
  };

  const handleDeletePage = async (page) => {
    const ok = await confirmDelete(`page "${page.pageName || "Untitled"}"`);
    if (!ok) return;

    setDeleting(page.id);

    // Switch away immediately for smooth UX
    if (activePage?.id === page.id) {
      const next = pages.find(p => p.id !== page.id);
      setActivePage(next || null);
    }

    try {
      // Direct hard delete — sequential
      await svcDeletePage(page.id, uid);
      showToast(`Page deleted`, "success");
    } catch (e) {
      console.error("[Pages] delete failed:", e.code, e.message);
      showToast("Delete failed: " + e.message, "error");
      setActivePage(page); // restore if failed
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="nb-pages-col">
      <div className="nb-col-header">
        <span className="nb-col-title" style={{ color: section?.color }}>
          {section?.sectionName || "Pages"}
        </span>
        <button className="nb-col-add" onClick={handleAddPage} title="New page">
          <Plus size={14}/>
        </button>
      </div>

      <div className="nb-pages-list">
        {pages.length === 0 && (
          <div className="nb-col-empty">
            <span className="spinner" style={{width:18,height:18}}/>
          </div>
        )}
        {pages.map(page => (
          <div key={page.id}
            className={`nb-page-item ${activePage?.id === page.id ? "active" : ""} ${deleting === page.id ? "deleting" : ""}`}
            onClick={() => deleting !== page.id && setActivePage(page)}>
            <FileText size={13} className="nb-page-icon"/>
            {editId === page.id ? (
              <input className="nb-item-input" defaultValue={page.pageName || "Untitled"} autoFocus
                onClick={e => e.stopPropagation()}
                onKeyDown={e => {
                  if (e.key === "Enter") { renamePage(page.id, e.target.value); setEditId(null); }
                  if (e.key === "Escape") setEditId(null);
                }}
                onBlur={e => { renamePage(page.id, e.target.value); setEditId(null); }}
              />
            ) : (
              <span className="nb-item-name">{page.pageName || "Untitled"}</span>
            )}
            {deleting === page.id ? (
              <span className="nb-deleting-spinner"><span className="spinner" style={{width:12,height:12}}/></span>
            ) : (
              <div className="nb-item-actions" onClick={e => e.stopPropagation()}>
                <button className="nb-action-btn" onClick={() => setEditId(page.id)} title="Rename">
                  <Pencil size={11}/>
                </button>
                <button className="nb-action-btn danger" onClick={() => handleDeletePage(page)} title="Delete">
                  <Trash2 size={11}/>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hidden savePage passthrough for PageEditor */}
      <PageEditorBridge savePage={savePage}/>
    </div>
  );
}
// This is just a context carrier — not rendered visually
function PageEditorBridge() { return null; }

/* ── Sections Panel ─────────────────────────────────── */
function SectionsPanel({ notebook, activeSection, setActiveSection, setActivePage, uid, showToast }) {
  const { sections, createSection, renameSection } = useSections(notebook?.id);
  const [addingSection, setAddingSection] = useState(false);
  const [newSecName,    setNewSecName]    = useState("");
  const [newSecColor,   setNewSecColor]   = useState(SEC_COLORS[0]);
  const [editId,        setEditId]        = useState(null);
  const [deleting,      setDeleting]      = useState(null);

  // Auto-select first section when sections load
  useEffect(() => {
    if (sections.length > 0 && (!activeSection || !sections.find(s => s.id === activeSection.id))) {
      setActiveSection(sections[0]);
    }
  }, [sections.length, notebook?.id]);

  const handleAddSection = async () => {
    if (!newSecName.trim()) return;
    try {
      await createSection(newSecName, newSecColor);
      setNewSecName("");
      setAddingSection(false);
    } catch (e) {
      console.error("[Sections] add failed:", e);
      showToast("Could not add section: " + e.message, "error");
    }
  };

  const handleDeleteSection = async (sec) => {
    const ok = await confirmDelete(`section "${sec.sectionName}" and all its pages`);
    if (!ok) return;

    setDeleting(sec.id);

    // Switch away immediately
    if (activeSection?.id === sec.id) {
      const next = sections.find(s => s.id !== sec.id);
      setActiveSection(next || null);
      setActivePage(null);
    }

    try {
      // Sequential: pages → section (+ auto-create if last section)
      const result = await svcDeleteSection(sec.id, notebook.id, uid);
      if (result.autoCreated) {
        showToast("Section deleted — default section created", "info");
      } else {
        showToast("Section and pages deleted", "success");
      }
    } catch (e) {
      console.error("[Sections] delete failed:", e.code, e.message);
      showToast("Delete failed: " + e.message, "error");
      setActiveSection(sec); // restore if failed
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="nb-sections-col">
      <div className="nb-col-header">
        <span className="nb-col-title">{notebook?.notebookName}</span>
        <button className="nb-col-add" onClick={() => setAddingSection(true)} title="New section">
          <Plus size={14}/>
        </button>
      </div>

      <div className="nb-sections-list">
        {sections.map(sec => (
          <div key={sec.id}
            className={`nb-sec-item ${activeSection?.id === sec.id ? "active" : ""} ${deleting === sec.id ? "deleting" : ""}`}
            onClick={() => deleting !== sec.id && (setActiveSection(sec), setActivePage(null))}>
            <span className="nb-sec-stripe" style={{ background: sec.color }}/>
            {editId === sec.id ? (
              <input className="nb-item-input" defaultValue={sec.sectionName} autoFocus
                onClick={e => e.stopPropagation()}
                onKeyDown={e => {
                  if (e.key === "Enter") { renameSection(sec.id, e.target.value, sec.color); setEditId(null); }
                  if (e.key === "Escape") setEditId(null);
                }}
                onBlur={e => { renameSection(sec.id, e.target.value, sec.color); setEditId(null); }}
              />
            ) : (
              <span className="nb-item-name">{sec.sectionName}</span>
            )}
            {deleting === sec.id ? (
              <span className="nb-deleting-spinner"><span className="spinner" style={{width:12,height:12}}/></span>
            ) : (
              <div className="nb-item-actions" onClick={e => e.stopPropagation()}>
                <button className="nb-action-btn" onClick={() => setEditId(sec.id)} title="Rename">
                  <Pencil size={11}/>
                </button>
                <button className="nb-action-btn danger" onClick={() => handleDeleteSection(sec)} title="Delete">
                  <Trash2 size={11}/>
                </button>
              </div>
            )}
            {activeSection?.id === sec.id && deleting !== sec.id && (
              <ChevronRight size={12} className="nb-sec-arrow"/>
            )}
          </div>
        ))}

        {addingSection ? (
          <div className="nb-add-sec-form">
            <input className="nb-item-input" placeholder="Section name…" value={newSecName} autoFocus
              onChange={e => setNewSecName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleAddSection();
                if (e.key === "Escape") { setAddingSection(false); setNewSecName(""); }
              }}/>
            <div className="nb-color-row">
              {SEC_COLORS.slice(0, 8).map(c => (
                <button key={c} className={`nb-color-dot ${newSecColor === c ? "sel" : ""}`}
                  style={{ background: c }} onClick={() => setNewSecColor(c)}/>
              ))}
            </div>
            <div className="nb-add-actions">
              <button className="nb-cancel-btn" onClick={() => { setAddingSection(false); setNewSecName(""); }}>
                <X size={12}/>
              </button>
              <button className="nb-ok-btn" onClick={handleAddSection} disabled={!newSecName.trim()}>
                <Check size={12}/>
              </button>
            </div>
          </div>
        ) : sections.length === 0 && (
          <div className="nb-col-empty">
            <span className="spinner" style={{width:18,height:18}}/>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Notebook ───────────────────────────────────── */
export default function Notebook({ notebook }) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState(null);
  const [activePage,    setActivePage]    = useState(null);
  const { toast, show: showToast }        = useToast();

  // Reset on notebook change
  useEffect(() => {
    setActiveSection(null);
    setActivePage(null);
  }, [notebook?.id]);

  const { pages, savePage } = usePages(activeSection?.id);

  // Keep activePage in sync with live data
  const liveActivePage = activePage
    ? pages.find(p => p.id === activePage.id) || activePage
    : null;

  if (!notebook) return (
    <div className="nb-welcome">
      <BookOpen size={64} strokeWidth={0.8}/>
      <h2>No notebook selected</h2>
      <p>Select or create a notebook from the sidebar.<br/>A default section and page will be ready instantly.</p>
    </div>
  );

  return (
    <div className="nb-layout">
      {/* Column 1: Sections */}
      <SectionsPanel
        notebook={notebook}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        setActivePage={setActivePage}
        uid={user?.uid}
        showToast={showToast}
      />

      {/* Column 2: Pages */}
      {activeSection && (
        <PagesPanel
          section={activeSection}
          notebookId={notebook.id}
          activePage={liveActivePage}
          setActivePage={setActivePage}
          uid={user?.uid}
          showToast={showToast}
        />
      )}

      {/* Column 3: Editor */}
      <PageEditor page={liveActivePage} onSave={savePage}/>

      {/* Toast */}
      <Toast toast={toast}/>
    </div>
  );
}
