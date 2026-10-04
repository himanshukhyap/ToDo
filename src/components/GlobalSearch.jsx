import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, CheckSquare, StickyNote, FileText, BookOpen, Layers, Folder, CornerDownLeft,
} from "lucide-react";
import { useSearchData } from "../hooks/useSearchData";
import { searchAll, tokenize, highlightParts } from "../utils/search";

const ICONS = {
  task: CheckSquare,
  note: StickyNote,
  page: FileText,
  notebook: BookOpen,
  section: Layers,
  category: Folder,
};

/** Where each result type opens */
export function searchTargetPath(target) {
  switch (target.kind) {
    case "task":
      return `/tasks?q=${encodeURIComponent(target.title)}`;
    case "note":
      return `/notes?note=${target.id}`;
    case "page":
      return `/notebook/${target.notebookId}?section=${target.sectionId}&page=${target.id}`;
    case "notebook":
      return `/notebook/${target.id}`;
    case "section":
      return `/notebook/${target.notebookId}?section=${target.id}`;
    case "category":
      return `/tasks/${target.id}`;
    default:
      return "/tasks";
  }
}

function Highlight({ text, tokens }) {
  return highlightParts(text, tokens).map((p, i) =>
    p.match ? <mark key={i} className="gs-mark">{p.text}</mark> : <span key={i}>{p.text}</span>
  );
}

export default function GlobalSearch({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const { data, loading } = useSearchData(open);

  const tokens = useMemo(() => tokenize(query), [query]);
  const groups = useMemo(() => searchAll(query, data), [query, data]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const total = groups.reduce((n, g) => n + g.total, 0);

  useEffect(() => {
    if (!open) return;
    setCursor(0);
    // focus after the modal has rendered
    const t = setTimeout(() => inputRef.current?.select(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => { setCursor(0); }, [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-idx="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  const choose = (item) => {
    if (!item) return;
    onClose();
    navigate(searchTargetPath(item.target));
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(flat[cursor]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  let idx = -1;

  return (
    <div className="gs-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gs-panel" role="dialog" aria-label="Search everything">
        <div className="gs-input-row">
          <Search size={18} className="gs-input-icon" />
          <input
            ref={inputRef}
            className="gs-input"
            placeholder="Search tasks, notes, notebook pages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button className="icon-btn" onClick={() => { setQuery(""); inputRef.current?.focus(); }} title="Clear">
              <X size={15} />
            </button>
          )}
          <button className="gs-esc" onClick={onClose}>Esc</button>
        </div>

        <div className="gs-results" ref={listRef}>
          {!tokens.length ? (
            <div className="gs-empty">
              <p>Type to search across your whole workspace.</p>
              <p className="gs-hint">Tasks &amp; subtasks · Notes · Notebook pages · Notebooks · Sections · Categories</p>
            </div>
          ) : loading && !flat.length ? (
            <div className="gs-empty"><span className="spinner" /></div>
          ) : !flat.length ? (
            <div className="gs-empty"><p>No results for “{query.trim()}”</p></div>
          ) : (
            groups.map((g) => (
              <div key={g.key} className="gs-group">
                <div className="gs-group-head">
                  <span>{g.label}</span>
                  <span className="badge sm">{g.total}</span>
                </div>
                {g.items.map((item) => {
                  idx += 1;
                  const myIdx = idx;
                  const Icon = ICONS[item.type];
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      data-idx={myIdx}
                      className={`gs-item ${cursor === myIdx ? "active" : ""}`}
                      onMouseEnter={() => setCursor(myIdx)}
                      onClick={() => choose(item)}
                    >
                      <span className="gs-item-icon" style={item.color ? { color: item.color } : undefined}>
                        <Icon size={16} />
                      </span>
                      <span className="gs-item-body">
                        <span className={`gs-item-title ${item.done ? "done" : ""}`}>
                          <Highlight text={item.title} tokens={tokens} />
                        </span>
                        {item.snippet && (
                          <span className="gs-item-snippet"><Highlight text={item.snippet} tokens={tokens} /></span>
                        )}
                        {item.meta && <span className="gs-item-meta">{item.meta}</span>}
                      </span>
                      {cursor === myIdx && <CornerDownLeft size={14} className="gs-enter" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {!!flat.length && (
          <div className="gs-footer">
            <span>{total} result{total !== 1 ? "s" : ""}</span>
            <span className="gs-keys"><kbd>↑</kbd><kbd>↓</kbd> to move · <kbd>Enter</kbd> to open</span>
          </div>
        )}
      </div>
    </div>
  );
}
