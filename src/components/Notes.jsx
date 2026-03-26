import { useState, useRef, useEffect } from "react";
import { useNotes } from "../hooks/useNotes";
import { Plus, Pencil, Trash2, Copy, Check, X, FileText } from "lucide-react";

function NoteCard({ note, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (confirmDel) { onDelete(note.id); }
    else { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 2500); }
  };

  const ts = note.updatedAt?.toDate
    ? note.updatedAt.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="note-card">
      <p className="note-body">{note.content}</p>
      <div className="note-footer">
        <span className="note-ts">{ts}</span>
        <div className="note-actions">
          <button className="icon-btn" onClick={handleCopy} title="Copy">
            {copied ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
          </button>
          <button className="icon-btn" onClick={() => onEdit(note)} title="Edit">
            <Pencil size={14} />
          </button>
          <button className={`icon-btn ${confirmDel ? "danger-active" : ""}`} onClick={handleDelete} title={confirmDel ? "Confirm delete" : "Delete"}>
            {confirmDel ? <Check size={14} /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteEditor({ note, onSave, onCancel }) {
  const [content, setContent] = useState(note?.content || "");
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const handleSave = () => {
    if (!content.trim()) return;
    onSave(content);
  };

  const handleKey = (e) => {
    if (e.key === "Escape") onCancel();
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
  };

  return (
    <div className="note-editor-card">
      <textarea
        ref={ref}
        className="note-textarea"
        placeholder="Write your note… (Ctrl+Enter to save)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKey}
        rows={5}
      />
      <div className="editor-actions">
        <button className="btn-ghost" onClick={onCancel}><X size={14} /> Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={!content.trim()}>
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

  const handleSave = async (content) => {
    if (editingNote) {
      await updateNote(editingNote.id, content);
      setEditingNote(null);
    } else {
      await addNote(content);
      setAdding(false);
    }
  };

  return (
    <div className="tab-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title">
          <FileText size={18} />
          <span>Notes</span>
          <span className="badge">{notes.length}</span>
        </div>
        <div className="panel-header-right">
          <input
            className="search-input"
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {!adding && !editingNote && (
            <button className="btn-primary" onClick={() => setAdding(true)}>
              <Plus size={15} /> New Note
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Inline add editor */}
      {adding && (
        <NoteEditor
          onSave={handleSave}
          onCancel={() => setAdding(false)}
        />
      )}

      {/* Notes grid */}
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
              <NoteEditor
                key={note.id}
                note={note}
                onSave={handleSave}
                onCancel={() => setEditingNote(null)}
              />
            ) : (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={setEditingNote}
                onDelete={deleteNote}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
