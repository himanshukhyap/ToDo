import { useState, useEffect } from "react";
import { useNotes } from "../hooks/useNotes";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Plus, Pencil, Trash2, Copy, Check, X, FileText, Share2,
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Strikethrough,
} from "lucide-react";

async function shareContent(title, text) {
  if (navigator.share) {
    try { await navigator.share({ title, text }); return "shared"; }
    catch(e) { if (e.name !== "AbortError") throw e; return "cancelled"; }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}

const NOTE_COLORS = [
  { bg: "#fef08a", text: "#713f12", label: "Yellow"  },
  { bg: "#fdba74", text: "#7c2d12", label: "Orange"  },
  { bg: "#f9a8d4", text: "#831843", label: "Pink"    },
  { bg: "#86efac", text: "#14532d", label: "Green"   },
  { bg: "#93c5fd", text: "#1e3a5f", label: "Blue"    },
  { bg: "#c4b5fd", text: "#4c1d95", label: "Violet"  },
  { bg: "#f87171", text: "#7f1d1d", label: "Red"     },
  { bg: "#67e8f9", text: "#164e63", label: "Cyan"    },
  { bg: "#d9f99d", text: "#365314", label: "Lime"    },
  { bg: "#e2e8f0", text: "#1e293b", label: "White"   },
  { bg: "#334155", text: "#e2e8f0", label: "Slate"   },
  { bg: "#1e1b4b", text: "#c7d2fe", label: "Indigo"  },
];

function getColorCfg(bg) {
  return NOTE_COLORS.find(c => c.bg === bg) || NOTE_COLORS[10];
}

/* ── Toolbar ────────────────────────────────────────────── */
function EditorToolbar({ editor, textColor }) {
  if (!editor) return null;
  const btn = (active, action, icon, title) => (
    <button type="button"
      className={`tt-btn ${active ? "tt-active" : ""}`}
      style={{ color: textColor }}
      onMouseDown={e => { e.preventDefault(); action(); }}
      title={title}>
      {icon}
    </button>
  );
  return (
    <div className="tt-toolbar" style={{ borderColor: textColor + "20" }}>
      {btn(editor.isActive("bold"),         () => editor.chain().focus().toggleBold().run(),         <Bold size={13}/>,          "Bold")}
      {btn(editor.isActive("italic"),       () => editor.chain().focus().toggleItalic().run(),       <Italic size={13}/>,        "Italic")}
      {btn(editor.isActive("underline"),    () => editor.chain().focus().toggleUnderline().run(),    <UnderlineIcon size={13}/>, "Underline")}
      {btn(editor.isActive("strike"),       () => editor.chain().focus().toggleStrike().run(),       <Strikethrough size={13}/>,"Strike")}
      <div className="tt-divider" style={{ background: textColor + "20" }}/>
      {btn(editor.isActive("bulletList"),   () => editor.chain().focus().toggleBulletList().run(),   <List size={13}/>,          "Bullet list")}
      {btn(editor.isActive("orderedList"),  () => editor.chain().focus().toggleOrderedList().run(),  <ListOrdered size={13}/>,   "Numbered list")}
    </div>
  );
}

/* ── Note Editor (inline card) ──────────────────────────── */
function NoteEditor({ note, onSave, onCancel }) {
  const [color, setColor] = useState(note?.color || NOTE_COLORS[0].bg);
  const cfg = getColorCfg(color);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Write your note… (rich text supported)" }),
    ],
    content: note?.htmlContent || "",
    autofocus: true,
  });

  const handleSave = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const text = editor.getText();
    if (!text.trim()) return;
    onSave(html, text, color);
  };

  return (
    <div className="note-editor-card" style={{ "--note-bg": cfg.bg, "--note-text": cfg.text }}>
      <div className="note-fold"/>
      <EditorToolbar editor={editor} textColor={cfg.text}/>
      <EditorContent editor={editor} className="tt-editor-content"/>
      <div className="note-color-picker">
        {NOTE_COLORS.map(c => (
          <button key={c.bg} type="button"
            className={`note-color-dot ${color === c.bg ? "active" : ""}`}
            style={{ background: c.bg }}
            onClick={() => setColor(c.bg)} title={c.label}/>
        ))}
      </div>
      <div className="editor-actions">
        <button className="btn-note-cancel" onClick={onCancel}><X size={14}/> Cancel</button>
        <button className="btn-note-save" onClick={handleSave}><Check size={14}/> {note ? "Update" : "Save"}</button>
      </div>
    </div>
  );
}

/* ── Note Card ──────────────────────────────────────────── */
function NoteCard({ note, onEdit, onDelete }) {
  const [copied, setCopied]   = useState(false);
  const [shared, setShared]   = useState(false);
  const [confirmDel, setConf] = useState(false);
  const cfg = getColorCfg(note.color);

  const handleCopy = () => {
    navigator.clipboard.writeText(note.textContent || note.content || "");
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const handleShare = async () => {
    const r = await shareContent("Note", note.textContent || note.content || "");
    if (r === "copied" || r === "shared") { setShared(true); setTimeout(() => setShared(false), 2000); }
  };
  const handleDelete = () => {
    if (confirmDel) onDelete(note.id);
    else { setConf(true); setTimeout(() => setConf(false), 2500); }
  };
  const ts = note.updatedAt?.toDate
    ? note.updatedAt.toDate().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "";

  return (
    <div className="note-card" style={{ "--note-bg": cfg.bg, "--note-text": cfg.text }}>
      <div className="note-fold"/>
      {/* Rich HTML content */}
      <div className="note-body tt-view"
        dangerouslySetInnerHTML={{ __html: note.htmlContent || `<p>${note.content || ""}</p>` }}
      />
      <div className="note-footer">
        <span className="note-ts">{ts}</span>
        <div className="note-actions">
          <button className="note-icon-btn" onClick={handleShare} title="Share">
            {shared ? <Check size={14}/> : <Share2 size={14}/>}
          </button>
          <button className="note-icon-btn" onClick={handleCopy} title="Copy text">
            {copied ? <Check size={14}/> : <Copy size={14}/>}
          </button>
          <button className="note-icon-btn" onClick={() => onEdit(note)} title="Edit">
            <Pencil size={14}/>
          </button>
          <button className={`note-icon-btn ${confirmDel ? "del-confirm" : ""}`}
            onClick={handleDelete} title={confirmDel ? "Tap again to confirm" : "Delete"}>
            {confirmDel ? <Check size={14}/> : <Trash2 size={14}/>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Notes panel ───────────────────────────────────── */
export default function Notes() {
  const { notes, loading, error, addNote, updateNote, deleteNote } = useNotes();
  const [adding, setAdding]       = useState(false);
  const [editingNote, setEditing] = useState(null);
  const [search, setSearch]       = useState("");

  const filtered = notes.filter(n =>
    (n.textContent || n.content || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (html, text, color) => {
    if (editingNote) {
      await updateNote(editingNote.id, html, text, color);
      setEditing(null);
    } else {
      await addNote(html, text, color);
      setAdding(false);
    }
  };

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <div className="panel-title">
          <FileText size={18}/><span>Notes</span>
          <span className="badge">{notes.length}</span>
        </div>
        <div className="panel-header-right">
          <input className="search-input" placeholder="Search notes…" value={search}
            onChange={e => setSearch(e.target.value)}/>
          {!adding && !editingNote && (
            <button className="btn-primary" onClick={() => setAdding(true)}>
              <Plus size={15}/> New Note
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {adding && <NoteEditor onSave={handleSave} onCancel={() => setAdding(false)}/>}

      {loading ? (
        <div className="loading-state"><span className="spinner"/></div>
      ) : filtered.length === 0 && !adding ? (
        <div className="empty-state">
          <FileText size={40} strokeWidth={1}/>
          <p>{search ? "No notes match your search." : "No notes yet. Click 'New Note' to start."}</p>
        </div>
      ) : (
        <div className="notes-grid">
          {filtered.map(note =>
            editingNote?.id === note.id ? (
              <NoteEditor key={note.id} note={note}
                onSave={handleSave} onCancel={() => setEditing(null)}/>
            ) : (
              <NoteCard key={note.id} note={note}
                onEdit={setEditing} onDelete={deleteNote}/>
            )
          )}
        </div>
      )}
    </div>
  );
}
