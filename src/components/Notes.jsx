import { useState, useRef, useEffect } from "react";
import { useNotes } from "../hooks/useNotes";
import { Plus, Pencil, Trash2, Copy, Check, X, FileText, Share2 } from "lucide-react";

// Universal share helper — uses Web Share API (WhatsApp / SMS / email etc.)
// Falls back to clipboard copy on desktop
async function shareContent(title, text) {
  const shareData = { title, text };
  if (navigator.share) {
    try { await navigator.share(shareData); return "shared"; }
    catch (e) { if (e.name !== "AbortError") throw e; return "cancelled"; }
  } else {
    await navigator.clipboard.writeText(text);
    return "copied";
  }
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
  return NOTE_COLORS.find((c) => c.bg === bg) || NOTE_COLORS[10];
}

function ColorPicker({ selected, onChange }) {
  return (
    <div className="note-color-picker">
      {NOTE_COLORS.map((c) => (
        <button
          key={c.bg}
          className={`note-color-dot ${selected === c.bg ? "active" : ""}`}
          style={{ background: c.bg }}
          onClick={() => onChange(c.bg)}
          title={c.label}
        />
      ))}
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const cfg = getColorCfg(note.color);

  const handleCopy = () => {
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const result = await shareContent("Note", note.content);
    if (result === "copied" || result === "shared") {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleDelete = () => {
    if (confirmDel) { onDelete(note.id); }
    else { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 2500); }
  };

  const ts = note.updatedAt?.toDate
    ? note.updatedAt.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  return (
    <div className="note-card" style={{ "--note-bg": cfg.bg, "--note-text": cfg.text }}>
      <div className="note-fold" />
      <p className="note-body">{note.content}</p>
      <div className="note-footer">
        <span className="note-ts">{ts}</span>
        <div className="note-actions">
          <button className="note-icon-btn" onClick={handleShare}
            title={navigator.share ? "Share (WhatsApp, SMS…)" : "Copy to clipboard"}>
            {shared ? <Check size={14} /> : <Share2 size={14} />}
          </button>
          <button className="note-icon-btn" onClick={handleCopy} title="Copy text">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button className="note-icon-btn" onClick={() => onEdit(note)} title="Edit">
            <Pencil size={14} />
          </button>
          <button className={`note-icon-btn ${confirmDel ? "del-confirm" : ""}`}
            onClick={handleDelete} title={confirmDel ? "Tap again to confirm" : "Delete"}>
            {confirmDel ? <Check size={14} /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteEditor({ note, onSave, onCancel }) {
  const [content, setContent] = useState(note?.content || "");
  const [color,   setColor]   = useState(note?.color || NOTE_COLORS[0].bg);
  const ref = useRef(null);
  const cfg = getColorCfg(color);

  useEffect(() => { ref.current?.focus(); }, []);

  const handleSave = () => {
    if (!content.trim()) return;
    onSave(content, color);
  };

  return (
    <div className="note-editor-card" style={{ "--note-bg": cfg.bg, "--note-text": cfg.text }}>
      <div className="note-fold" />
      <textarea
        ref={ref}
        className="note-textarea"
        placeholder="Write your note… (Ctrl+Enter to save)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
        }}
        rows={5}
      />
      <ColorPicker selected={color} onChange={setColor} />
      <div className="editor-actions">
        <button className="btn-note-cancel" onClick={onCancel}><X size={14} /> Cancel</button>
        <button className="btn-note-save" onClick={handleSave} disabled={!content.trim()}>
          <Check size={14} /> {note ? "Update" : "Save Note"}
        </button>
      </div>
    </div>
  );
}

export default function Notes() {
  const { notes, loading, error, addNote, updateNote, deleteNote } = useNotes();
  const [adding, setAdding] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = notes.filter((n) =>
    n.content?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (content, color) => {
    if (editingNote) {
      await updateNote(editingNote.id, content, color);
      setEditingNote(null);
    } else {
      await addNote(content, color);
      setAdding(false);
    }
  };

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <div className="panel-title">
          <FileText size={18} />
          <span>Notes</span>
          <span className="badge">{notes.length}</span>
        </div>
        <div className="panel-header-right">
          <input className="search-input" placeholder="Search notes…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {!adding && !editingNote && (
            <button className="btn-primary" onClick={() => setAdding(true)}>
              <Plus size={15} /> New Note
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {adding && (
        <NoteEditor onSave={handleSave} onCancel={() => setAdding(false)} />
      )}

      {loading ? (
        <div className="loading-state"><span className="spinner" /></div>
      ) : filtered.length === 0 && !adding ? (
        <div className="empty-state">
          <FileText size={40} strokeWidth={1} />
          <p>{search ? "No notes match your search." : "No notes yet. Click 'New Note' to start."}</p>
        </div>
      ) : (
        <div className="notes-grid">
          {filtered.map((note) =>
            editingNote?.id === note.id ? (
              <NoteEditor key={note.id} note={note}
                onSave={handleSave} onCancel={() => setEditingNote(null)} />
            ) : (
              <NoteCard key={note.id} note={note}
                onEdit={setEditingNote} onDelete={deleteNote} />
            )
          )}
        </div>
      )}
    </div>
  );
}
