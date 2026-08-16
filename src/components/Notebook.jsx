import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useAuth } from "../context/AuthContext";
import { useSections, usePages } from "../hooks/useNotebook";
import {
  deletePage as svcDeletePage,
  deleteSection as svcDeleteSection,
} from "../services/notebookDeleteService";
import { confirmDelete } from "../utils/swal";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  FileText,
  BookOpen,
  ChevronLeft,
  Bold,
  Italic,
  Underline as UlIcon,
  List,
  ListOrdered,
  Strikethrough,
  Code,
  Undo,
  Redo,
  AlignLeft,
  AlertCircle,
} from "lucide-react";

const SEC_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#84cc16",
  "#f97316",
];

function clampStr(v, max = 60) {
  if (!v) return "";
  return v.length > max ? v.slice(0, max - 1) + "…" : v;
}

function snippetOf(page) {
  const t = (page?.textContent || "").trim();
  if (!t) return "No content yet";
  return t.length > 90 ? t.slice(0, 90) + "…" : t;
}

function dateOf(page) {
  return page?.updatedAt?.toDate
    ? page.updatedAt.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    : "";
}

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
      {toast.type === "error" && <AlertCircle size={14} />}
      <span>{toast.msg}</span>
    </div>
  );
}

function Toolbar({ editor }) {
  if (!editor) return null;
  const B = (active, fn, icon, tip) => (
    <button
      type="button"
      className={`nb-tb-btn ${active ? "active" : ""}`}
      onMouseDown={(e) => {
        e.preventDefault();
        fn();
      }}
      title={tip}
    >
      {icon}
    </button>
  );
  return (
    <div className="nb-toolbar">
      <div className="nb-tb-group">
        {B(false, () => editor.chain().focus().undo().run(), <Undo size={14} />, "Undo (Ctrl+Z)")}
        {B(false, () => editor.chain().focus().redo().run(), <Redo size={14} />, "Redo")}
      </div>
      <div className="nb-tb-sep" />
      <div className="nb-tb-group">
        {B(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <Bold size={14} />, "Bold")}
        {B(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <Italic size={14} />, "Italic")}
        {B(
          editor.isActive("underline"),
          () => editor.chain().focus().toggleUnderline().run(),
          <UlIcon size={14} />,
          "Underline",
        )}
        {B(
          editor.isActive("strike"),
          () => editor.chain().focus().toggleStrike().run(),
          <Strikethrough size={14} />,
          "Strike",
        )}
        {B(editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), <Code size={14} />, "Code")}
      </div>
      <div className="nb-tb-sep" />
      <div className="nb-tb-group">
        {B(
          editor.isActive("bulletList"),
          () => editor.chain().focus().toggleBulletList().run(),
          <List size={14} />,
          "Bullet List",
        )}
        {B(
          editor.isActive("orderedList"),
          () => editor.chain().focus().toggleOrderedList().run(),
          <ListOrdered size={14} />,
          "Numbered List",
        )}
        {B(
          editor.isActive("blockquote"),
          () => editor.chain().focus().toggleBlockquote().run(),
          <AlignLeft size={14} />,
          "Blockquote",
        )}
        {B(
          editor.isActive("codeBlock"),
          () => editor.chain().focus().toggleCodeBlock().run(),
          <Code size={14} />,
          "Code Block",
        )}
      </div>
    </div>
  );
}

function PageEditor({ page, onSave: saveFn, onStatus }) {
  const [title, setTitle] = useState(page?.pageName || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const titleRef = useRef(title);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const flush = useCallback(
    async (ed) => {
      if (!ed || !page) return;
      clearTimeout(saveTimerRef.current);
      setSaving(true);
      try {
        await saveFn(page.id, ed.getHTML(), ed.getText(), titleRef.current);
        setDirty(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        console.error("[Editor] save failed:", e);
      } finally {
        setSaving(false);
      }
    },
    [page, saveFn],
  );

  const scheduleSave = useCallback(
    (ed) => {
      setDirty(true);
      setSaved(false);
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => flush(ed), 800);
    },
    [flush],
  );

  const editor = useEditor(
    {
      extensions: [StarterKit, Underline, Placeholder.configure({ placeholder: "Start writing your page…" })],
      content: page?.htmlContent || "",
      onUpdate: ({ editor: ed }) => scheduleSave(ed),
    },
    [page?.id],
  );

  useEffect(() => {
    setTitle(page?.pageName || "");
    titleRef.current = page?.pageName || "";
    setDirty(false);
    setSaved(false);
    clearTimeout(saveTimerRef.current);
  }, [page?.id]);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (editor) flush(editor);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [editor, flush]);

  const handleTitleChange = (e) => {
    const v = e.target.value;
    setTitle(v);
    titleRef.current = v;
    if (editor) scheduleSave(editor);
  };

  const ts =
    page?.updatedAt?.toDate
      ? page.updatedAt
          .toDate()
          .toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "";

  useEffect(() => {
    onStatus?.({ saving, saved, dirty, ts });
  }, [saving, saved, dirty, ts, onStatus]);

  if (!page)
    return (
      <div className="nb-empty-editor">
        <FileText size={52} strokeWidth={1} />
        <p>Select a page or create one to start writing</p>
      </div>
    );

  return (
    <div className="nb-editor-panel">
      <div className="nb-page-head">
        <div className="nb-page-head-inner">
          <input
            className="nb-page-title"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                editor?.commands.focus();
              }
            }}
            placeholder="Page title…"
          />
          <div className="nb-page-meta">
            {saving && (
              <span className="nb-meta-tag saving">
                <span className="nb-spinner" /> Saving…
              </span>
            )}
            {saved && !saving && (
              <span className="nb-meta-tag saved">
                <Check size={11} /> Saved
              </span>
            )}
            {dirty && !saving && !saved && <span className="nb-meta-tag unsaved">● Unsaved</span>}
            {ts && !dirty && !saved && !saving && <span className="nb-meta-tag ts">Edited {ts}</span>}
          </div>
        </div>
      </div>
      <Toolbar editor={editor} />
      <div className="nb-editor-body">
        <EditorContent editor={editor} className="nb-prose" />
      </div>
    </div>
  );
}

/* ── Pages column — rows with snippet + date ─────────────── */
function PagesPanel({ section, notebookId, activePage, setActivePage, onOpenPage, uid, showToast }) {
  const { pages, createPage, renamePage } = usePages(section?.id);
  const [editId, setEditId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // When section changes, always reset to first page
  useEffect(() => {
    if (pages.length > 0) {
      setActivePage(pages[0]);
    }
  }, [section?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // When pages change but section stays same, validate active page
  useEffect(() => {
    if (pages.length > 0 && (!activePage || !pages.find((p) => p.id === activePage.id))) {
      setActivePage(pages[0]);
    }
  }, [pages.length, section?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

    if (activePage?.id === page.id) {
      const next = pages.find((p) => p.id !== page.id);
      setActivePage(next || null);
    }

    try {
      await svcDeletePage(page.id, uid);
      showToast("Page deleted", "success");
    } catch (e) {
      console.error("[Pages] delete failed:", e.code, e.message);
      showToast("Delete failed: " + e.message, "error");
      setActivePage(page);
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
          <Plus size={14} />
        </button>
      </div>

      <div className="nb-pages-list">
        {pages.length === 0 && (
          <div className="nb-col-empty">
            <span className="spinner" style={{ width: 18, height: 18 }} />
          </div>
        )}
        {pages.map((page) => (
          <div
            key={page.id}
            className={`nb-page-item ${activePage?.id === page.id ? "active" : ""} ${deleting === page.id ? "deleting" : ""}`}
            onClick={() => {
              if (deleting === page.id) return;
              setActivePage(page);
              onOpenPage?.();
            }}
          >
            <FileText size={14} className="nb-page-icon" />
            {editId === page.id ? (
              <input
                className="nb-item-input"
                defaultValue={page.pageName || "Untitled"}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    renamePage(page.id, e.target.value);
                    setEditId(null);
                  }
                  if (e.key === "Escape") setEditId(null);
                }}
                onBlur={(e) => {
                  renamePage(page.id, e.target.value);
                  setEditId(null);
                }}
              />
            ) : (
              <div className="nb-page-body">
                <span className="nb-page-name">{page.pageName || "Untitled"}</span>
                <span className="nb-page-snippet">{snippetOf(page)}</span>
              </div>
            )}
            {deleting === page.id ? (
              <span className="nb-deleting-spinner">
                <span className="spinner" style={{ width: 12, height: 12 }} />
              </span>
            ) : editId !== page.id ? (
              <div className="nb-page-trail">
                <span className="nb-page-date">{dateOf(page)}</span>
                <div className="nb-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="nb-action-btn" onClick={() => setEditId(page.id)} title="Rename">
                    <Pencil size={11} />
                  </button>
                  <button className="nb-action-btn danger" onClick={() => handleDeletePage(page)} title="Delete">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sections rail — vertical list ───────────────────────── */
function SectionsRail({ notebookId, activeSection, setActiveSection, setActivePage, showToast }) {
  const { sections, createSection, renameSection } = useSections(notebookId);
  const [addingSection, setAddingSection] = useState(false);
  const [newSecName, setNewSecName] = useState("");
  const [newSecColor, setNewSecColor] = useState(SEC_COLORS[0]);
  const [editId, setEditId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (sections.length > 0 && (!activeSection || !sections.find((s) => s.id === activeSection.id))) {
      setActiveSection(sections[0]);
    }
  }, [sections.length, notebookId]); // eslint-disable-line react-hooks/exhaustive-deps

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

    if (activeSection?.id === sec.id) {
      const next = sections.find((s) => s.id !== sec.id);
      setActiveSection(next || null);
      setActivePage(null);
    }

    try {
      const result = await svcDeleteSection(sec.id, notebookId, sec.uid);
      if (result.autoCreated) showToast("Section deleted — default section created", "info");
      else showToast("Section and pages deleted", "success");
    } catch (e) {
      console.error("[Sections] delete failed:", e.code, e.message);
      showToast("Delete failed: " + e.message, "error");
      setActiveSection(sec);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="nb-sections-col">
      <div className="nb-col-header">
        <span className="nb-col-title">Sections</span>
        <button className="nb-col-add" onClick={() => setAddingSection(true)} title="New section">
          <Plus size={14} />
        </button>
      </div>

      <div className="nb-sections-list">
        {sections.map((sec) => {
          const active = activeSection?.id === sec.id;
          const isDeleting = deleting === sec.id;
          return editId === sec.id ? (
            <div key={sec.id} className="nb-sec-item active">
              <span className="nb-sec-stripe" style={{ background: sec.color }} />
              <input
                className="nb-item-input"
                defaultValue={sec.sectionName}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    renameSection(sec.id, e.target.value, sec.color);
                    setEditId(null);
                  }
                  if (e.key === "Escape") setEditId(null);
                }}
                onBlur={(e) => {
                  renameSection(sec.id, e.target.value, sec.color);
                  setEditId(null);
                }}
              />
            </div>
          ) : (
            <button
              key={sec.id}
              className={`nb-sec-item ${active ? "active" : ""} ${isDeleting ? "deleting" : ""}`}
              onClick={() => !isDeleting && (setActiveSection(sec), setActivePage(null))}
              title={sec.sectionName}
            >
              <span className="nb-sec-stripe" style={{ background: sec.color }} />
              <span className="nb-item-name">{clampStr(sec.sectionName || "Section", 28)}</span>
              {isDeleting ? (
                <span className="nb-tab-spin">
                  <span className="spinner" style={{ width: 12, height: 12 }} />
                </span>
              ) : (
                <div className="nb-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="nb-action-btn" onClick={() => setEditId(sec.id)} title="Rename section">
                    <Pencil size={11} />
                  </button>
                  <button className="nb-action-btn danger" onClick={() => handleDeleteSection(sec)} title="Delete section">
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </button>
          );
        })}

        {addingSection ? (
          <div className="nb-add-sec-form">
            <input
              className="nb-item-input"
              placeholder="Section name…"
              value={newSecName}
              autoFocus
              onChange={(e) => setNewSecName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddSection();
                if (e.key === "Escape") {
                  setAddingSection(false);
                  setNewSecName("");
                }
              }}
            />
            <div className="nb-color-row">
              {SEC_COLORS.slice(0, 8).map((c) => (
                <button
                  key={c}
                  className={`nb-color-dot ${newSecColor === c ? "sel" : ""}`}
                  style={{ background: c }}
                  onClick={() => setNewSecColor(c)}
                />
              ))}
            </div>
            <div className="nb-add-actions">
              <button
                className="nb-cancel-btn"
                onClick={() => {
                  setAddingSection(false);
                  setNewSecName("");
                }}
                title="Cancel"
              >
                <X size={12} />
              </button>
              <button className="nb-ok-btn" onClick={handleAddSection} disabled={!newSecName.trim()} title="Create">
                <Check size={12} />
              </button>
            </div>
          </div>
        ) : (
          <button className="nb-tab-add-btn nb-add-sec-btn" onClick={() => setAddingSection(true)}>
            <Plus size={14} /> New section
          </button>
        )}
      </div>
    </div>
  );
}

export default function Notebook({ notebook }) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState(null);
  const [activePage, setActivePage] = useState(null);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [pageStatus, setPageStatus] = useState({});
  const { toast, show: showToast } = useToast();

  useEffect(() => {
    setActiveSection(null);
    setActivePage(null);
    setMobileEditorOpen(false);
  }, [notebook?.id]);

  const { pages, savePage } = usePages(activeSection?.id);
  const liveActivePage = activePage ? pages.find((p) => p.id === activePage.id) || activePage : null;

  if (!notebook)
    return (
      <div className="nb-welcome">
        <BookOpen size={64} strokeWidth={0.8} />
        <h2>No notebook selected</h2>
        <p>
          Select or create a notebook from the sidebar.
          <br />A default section and page will be ready instantly.
        </p>
      </div>
    );

  return (
    <div className={`nb-shell ${mobileEditorOpen ? "nb-shell-editor-open" : ""}`}>
      <div className="nb-topbar">
        <div className="nb-top-left">
          <span className="nb-nb-dot" style={{ background: notebook?.color || "var(--accent)" }} />
          <div className="nb-nb-copy">
            <span className="nb-nb-kicker">Notebook</span>
            <span className="nb-nb-title" title={notebook?.notebookName}>
              {clampStr(notebook?.notebookName || "Notebook", 32)}
            </span>
          </div>
        </div>
      </div>

      <div className={`nb-layout ${mobileEditorOpen ? "nb-layout-editor-open" : ""}`}>
        <SectionsRail
          notebookId={notebook.id}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          setActivePage={setActivePage}
          showToast={showToast}
        />

        {activeSection && (
          <PagesPanel
            section={activeSection}
            notebookId={notebook.id}
            activePage={liveActivePage}
            setActivePage={setActivePage}
            onOpenPage={() => setMobileEditorOpen(true)}
            uid={user?.uid}
            showToast={showToast}
          />
        )}

        <div className={`nb-editor-wrap ${mobileEditorOpen ? "mobile-open" : ""}`}>
          <div className="nb-mobile-editor-head">
            <button type="button" className="nb-mobile-back" onClick={() => setMobileEditorOpen(false)}>
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
            <div className="nb-mobile-editor-info">
              <span className="nb-mobile-editor-label">{activePage?.pageName || "Page"}</span>
              <span className="nb-mobile-editor-status">
                {pageStatus.saving
                  ? "Saving…"
                  : pageStatus.saved
                    ? "Saved"
                    : pageStatus.dirty
                      ? "Unsaved"
                      : pageStatus.ts
                        ? `Edited ${pageStatus.ts}`
                        : ""}
              </span>
            </div>
          </div>
          <PageEditor page={liveActivePage} onSave={savePage} onStatus={setPageStatus} />
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
