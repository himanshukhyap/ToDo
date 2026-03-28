import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useSections, usePages } from "../hooks/useNotebook";
import { confirmDelete, errorAlert } from "../utils/swal";
import {
  Plus, Pencil, Trash2, Check, X, FileText, BookOpen,
  Bold, Italic, Underline as UlIcon, List, ListOrdered,
  Strikethrough, AlignLeft, Code, Undo, Redo, Save,
} from "lucide-react";

const SECTION_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f59e0b","#10b981","#06b6d4","#3b82f6","#84cc16","#f97316"];

/* ── Toolbar ─────────────────────────────────────── */
function Toolbar({ editor, onSave, saving, dirty }) {
  if (!editor) return null;
  const btn = (active, fn, icon, title) => (
    <button type="button" className={`tt-btn ${active?"tt-active":""}`}
      onMouseDown={e=>{ e.preventDefault(); fn(); }} title={title}>{icon}</button>
  );
  return (
    <div className="nb-toolbar">
      <div className="nb-toolbar-group">
        {btn(false,()=>editor.chain().focus().undo().run(),<Undo size={14}/>,"Undo")}
        {btn(false,()=>editor.chain().focus().redo().run(),<Redo size={14}/>,"Redo")}
      </div>
      <div className="nb-toolbar-sep"/>
      <div className="nb-toolbar-group">
        {btn(editor.isActive("bold"),()=>editor.chain().focus().toggleBold().run(),<Bold size={14}/>,"Bold")}
        {btn(editor.isActive("italic"),()=>editor.chain().focus().toggleItalic().run(),<Italic size={14}/>,"Italic")}
        {btn(editor.isActive("underline"),()=>editor.chain().focus().toggleUnderline().run(),<UlIcon size={14}/>,"Underline")}
        {btn(editor.isActive("strike"),()=>editor.chain().focus().toggleStrike().run(),<Strikethrough size={14}/>,"Strike")}
        {btn(editor.isActive("code"),()=>editor.chain().focus().toggleCode().run(),<Code size={14}/>,"Inline code")}
      </div>
      <div className="nb-toolbar-sep"/>
      <div className="nb-toolbar-group">
        {btn(editor.isActive("heading",{level:1}),()=>editor.chain().focus().toggleHeading({level:1}).run(),<span className="tt-h">H1</span>,"Heading 1")}
        {btn(editor.isActive("heading",{level:2}),()=>editor.chain().focus().toggleHeading({level:2}).run(),<span className="tt-h">H2</span>,"Heading 2")}
        {btn(editor.isActive("heading",{level:3}),()=>editor.chain().focus().toggleHeading({level:3}).run(),<span className="tt-h">H3</span>,"Heading 3")}
      </div>
      <div className="nb-toolbar-sep"/>
      <div className="nb-toolbar-group">
        {btn(editor.isActive("bulletList"),()=>editor.chain().focus().toggleBulletList().run(),<List size={14}/>,"Bullet list")}
        {btn(editor.isActive("orderedList"),()=>editor.chain().focus().toggleOrderedList().run(),<ListOrdered size={14}/>,"Numbered list")}
        {btn(editor.isActive("blockquote"),()=>editor.chain().focus().toggleBlockquote().run(),<AlignLeft size={14}/>,"Blockquote")}
        {btn(editor.isActive("codeBlock"),()=>editor.chain().focus().toggleCodeBlock().run(),<Code size={14}/>,"Code block")}
      </div>
      {/* Manual save button */}
      <div className="nb-toolbar-save-area">
        <button
          type="button"
          className={`nb-save-btn ${dirty?"dirty":""}`}
          onClick={onSave}
          disabled={saving || !dirty}
          title="Save page (Ctrl+S)">
          {saving
            ? <span className="nb-save-spinner"/>
            : <><Save size={14}/> {dirty ? "Save" : "Saved"}</>
          }
        </button>
      </div>
    </div>
  );
}

/* ── Page Editor ─────────────────────────────────── */
function PageEditor({ page, onUpdate }) {
  const [title, setTitle]   = useState(page?.title || "");
  const [dirty, setDirty]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJS]  = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Start writing your page… use toolbar or Markdown shortcuts" }),
    ],
    content: page?.htmlContent || "",
    onUpdate: () => setDirty(true),
  }, [page?.id]);

  // Reset state when page changes
  useEffect(() => {
    setTitle(page?.title || "");
    setDirty(false);
    setJS(false);
  }, [page?.id]);

  const handleSave = async () => {
    if (!editor || !page || saving) return;
    setSaving(true);
    await onUpdate(page.id, editor.getHTML(), editor.getText(), title);
    setSaving(false);
    setDirty(false);
    setJS(true);
    setTimeout(() => setJS(false), 2500);
  };

  // Ctrl+S / Cmd+S shortcut — no deps array so it always gets fresh handleSave
  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  });

  const ts = page?.updatedAt?.toDate
    ? page.updatedAt.toDate().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
    : "";

  if (!page) return (
    <div className="nb-no-page">
      <FileText size={48} strokeWidth={1}/>
      <p>Select a page or create a new one to start writing</p>
    </div>
  );

  return (
    <div className="nb-editor-panel">
      <div className="nb-editor-head">
        <input className="nb-page-title-input" value={title}
          onChange={e => { setTitle(e.target.value); setDirty(true); }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }}
          placeholder="Page title…"/>
        <div className="nb-editor-meta">
          {saving && <span className="nb-save-status saving"><span className="nb-save-spinner"/> Saving…</span>}
          {justSaved && !saving && <span className="nb-save-status saved"><Check size={12}/> Saved</span>}
          {dirty && !saving && !justSaved && <span className="nb-save-status unsaved">● Unsaved changes</span>}
          {ts && !dirty && !justSaved && !saving && <span className="nb-last-edited">Edited {ts}</span>}
        </div>
      </div>
      <Toolbar editor={editor} onSave={handleSave} saving={saving} dirty={dirty}/>
      <div className="nb-editor-content">
        <EditorContent editor={editor} className="nb-prosemirror"/>
      </div>
    </div>
  );
}

/* ── Pages panel ─────────────────────────────────── */
function PagesPanel({ sectionId, notebookId, section, activePage, setActivePage }) {
  const { pages, add, remove, updateTitle } = usePages(sectionId);
  const [editId, setEditId] = useState(null);

  const handleAdd = () => add("Untitled Page", sectionId, notebookId);

  const handleDelete = async (page) => {
    const ok = await confirmDelete(`page "${page.title}"`);
    if (!ok) return;
    try {
      await remove(page.id);
      if (activePage?.id === page.id) setActivePage(null);
    } catch (e) {
      errorAlert(`Could not delete page: ${e.message}\n\nMake sure Firestore rules are deployed.`);
    }
  };

  return (
    <div className="nb-pages-panel">
      <div className="nb-pages-header">
        <span className="nb-pages-title" style={{color:section?.color}}>{section?.name||"Pages"}</span>
        <button className="nb-add-btn" onClick={handleAdd} title="New page"><Plus size={14}/></button>
      </div>
      <div className="nb-pages-list">
        {pages.length === 0 && (
          <div className="nb-empty-pages">
            <FileText size={28} strokeWidth={1}/>
            <p>No pages yet</p>
            <button className="btn-primary sm" onClick={handleAdd}><Plus size={13}/> New Page</button>
          </div>
        )}
        {pages.map(page => (
          editId === page.id ? (
            <div key={page.id} className="nb-page-item editing">
              <input className="nb-page-edit-input" defaultValue={page.title} autoFocus
                onKeyDown={e=>{ if(e.key==="Enter"){ updateTitle(page.id,e.target.value); setEditId(null); } if(e.key==="Escape") setEditId(null); }}
                onBlur={e=>{ updateTitle(page.id,e.target.value); setEditId(null); }}/>
            </div>
          ) : (
            <button key={page.id}
              className={`nb-page-item ${activePage?.id===page.id?"active":""}`}
              onClick={()=>setActivePage(page)}>
              <FileText size={13}/>
              <span className="nb-page-name">{page.title||"Untitled"}</span>
              <div className="nb-page-actions" onClick={e=>e.stopPropagation()}>
                <button className="icon-btn xs" onClick={()=>setEditId(page.id)}><Pencil size={11}/></button>
                <button className="icon-btn xs danger-hover" onClick={()=>handleDelete(page)}><Trash2 size={11}/></button>
              </div>
            </button>
          )
        ))}
      </div>
    </div>
  );
}

/* ── Main Notebook ───────────────────────────────── */
export default function Notebook({ notebook }) {
  const { sections, add:addSection, update:updateSection, remove:removeSection } = useSections(notebook?.id);
  const [activeSection, setActiveSection] = useState(null);
  const [activePage,    setActivePage]    = useState(null);
  const [editSectionId, setEditSectionId] = useState(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSecName,    setNewSecName]    = useState("");
  const [newSecColor,   setNewSecColor]   = useState(SECTION_COLORS[0]);

  useEffect(()=>{ if(sections.length>0&&!activeSection) setActiveSection(sections[0]); },[sections]);
  const { pages, update:updatePage } = usePages(activeSection?.id);
  useEffect(()=>{ setActivePage(null); },[activeSection?.id]);
  useEffect(()=>{ if(pages.length>0&&!activePage) setActivePage(pages[0]); },[pages]);

  const liveActivePage = pages.find(p=>p.id===activePage?.id)||activePage;

  const handleDeleteSection = async (sec) => {
    const ok = await confirmDelete(`section "${sec.name}"`);
    if (!ok) return;
    try {
      await removeSection(sec.id);
      if (activeSection?.id === sec.id) { setActiveSection(null); setActivePage(null); }
    } catch (e) {
      errorAlert(`Could not delete section: ${e.message}\n\nMake sure Firestore rules are deployed.`);
    }
  };

  if (!notebook) return (
    <div className="nb-no-notebook">
      <BookOpen size={56} strokeWidth={1}/>
      <h3>No notebook selected</h3>
      <p>Create a notebook from the sidebar to get started</p>
    </div>
  );

  return (
    <div className="nb-layout">
      {/* Sections */}
      <div className="nb-sections-panel">
        <div className="nb-sections-header">
          <span className="nb-notebook-name">{notebook.name}</span>
          <button className="nb-add-btn" onClick={()=>setAddingSection(true)}><Plus size={14}/></button>
        </div>
        <div className="nb-sections-list">
          {sections.map(sec=>(
            editSectionId===sec.id ? (
              <div key={sec.id} className="nb-section-item editing">
                <span className="nb-sec-tab" style={{background:sec.color}}/>
                <input className="nb-sec-edit-input" defaultValue={sec.name} autoFocus
                  onKeyDown={e=>{ if(e.key==="Enter"){ updateSection(sec.id,e.target.value,sec.color); setEditSectionId(null); } if(e.key==="Escape") setEditSectionId(null); }}
                  onBlur={e=>{ updateSection(sec.id,e.target.value,sec.color); setEditSectionId(null); }}/>
              </div>
            ):(
              <button key={sec.id}
                className={`nb-section-item ${activeSection?.id===sec.id?"active":""}`}
                onClick={()=>setActiveSection(sec)}>
                <span className="nb-sec-tab" style={{background:sec.color}}/>
                <span className="nb-sec-name">{sec.name}</span>
                <div className="nb-sec-actions" onClick={e=>e.stopPropagation()}>
                  <button className="icon-btn xs" onClick={()=>setEditSectionId(sec.id)}><Pencil size={10}/></button>
                  <button className="icon-btn xs danger-hover" onClick={()=>handleDeleteSection(sec)}><Trash2 size={10}/></button>
                </div>
              </button>
            )
          ))}
          {addingSection?(
            <div className="nb-add-section-form">
              <input className="sb-add-input" placeholder="Section name…" value={newSecName} autoFocus
                onChange={e=>setNewSecName(e.target.value)}
                onKeyDown={e=>{
                  if(e.key==="Enter"&&newSecName.trim()){ addSection(newSecName,newSecColor); setNewSecName(""); setAddingSection(false); }
                  if(e.key==="Escape") setAddingSection(false);
                }}/>
              <div className="sb-add-colors mt4">
                {SECTION_COLORS.slice(0,8).map(c=>(
                  <button key={c} className={`sb-color-dot ${newSecColor===c?"sel":""}`}
                    style={{background:c}} onClick={()=>setNewSecColor(c)}/>
                ))}
              </div>
              <div className="sb-add-actions">
                <button className="sb-add-cancel" onClick={()=>setAddingSection(false)}><X size={12}/></button>
                <button className="sb-add-ok" onClick={()=>{ if(newSecName.trim()){ addSection(newSecName,newSecColor); setNewSecName(""); setAddingSection(false); } }}><Check size={12}/></button>
              </div>
            </div>
          ):sections.length===0&&(
            <div className="nb-empty-sections">
              <p>No sections yet</p>
              <button className="btn-primary sm" onClick={()=>setAddingSection(true)}><Plus size={13}/> Add Section</button>
            </div>
          )}
        </div>
      </div>

      {/* Pages */}
      {activeSection && (
        <PagesPanel sectionId={activeSection.id} notebookId={notebook.id}
          section={activeSection} activePage={liveActivePage} setActivePage={setActivePage}/>
      )}

      {/* Editor */}
      <PageEditor page={liveActivePage} onUpdate={updatePage}/>
    </div>
  );
}
