import { useMemo, useState } from "react";
import { useAppTrash } from "../hooks/useAppTrash";
import { useTrash as useNotebookTrash } from "../hooks/useTrash";
import { confirmDelete, confirmBulkDelete, errorAlert, toast } from "../utils/swal";
import { Trash2, RotateCcw, XCircle, BookOpen, StickyNote, CheckSquare } from "lucide-react";

function fmt(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function TrashList({ title, icon, items, loading, onRestore, onPurge, onPurgeAll }) {
  const [busyId, setBusyId] = useState(null);

  const handleRestore = async (item) => {
    setBusyId(item.id);
    try {
      await onRestore(item);
      toast("success", "Restored");
    } catch (e) {
      const msg =
        e?.code === "permission-denied"
          ? `Restore blocked (permission-denied).\n\nPossible causes:\n1) Wrong Firebase project deployed (run deploy with correct --project).\n2) Live Firestore rules still old (Firebase Console → Firestore → Rules).\n3) Trash doc me uid missing/galat (old data).\n\nDetails: ${e?.message || "permission-denied"}`
          : (e?.message || "Restore failed.");
      errorAlert(msg);
    } finally {
      setBusyId(null);
    }
  };

  const handlePurge = async (item) => {
    const ok = await confirmDelete("this item permanently");
    if (!ok) return;
    setBusyId(item.id);
    try {
      await onPurge(item.id);
      toast("success", "Deleted permanently");
    } catch (e) {
      errorAlert(e.message || "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handlePurgeAll = async () => {
    const ok = await confirmBulkDelete("trash item", items.length);
    if (!ok) return;
    try {
      await onPurgeAll();
      toast("success", "Trash cleared");
    } catch (e) {
      errorAlert(e.message || "Clear failed.");
    }
  };

  return (
    <section className="tab-panel">
      <div className="panel-header">
        <div className="panel-title">
          {icon}<span>{title}</span>
          <span className="badge">{items.length}</span>
        </div>
        <div className="panel-header-right">
          {items.length > 0 && (
            <button className="btn-ghost" onClick={handlePurgeAll}>
              <Trash2 size={15} /> Empty
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><span className="spinner" /><p>Loading…</p></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Trash2 size={38} strokeWidth={1} />
          <p>Trash is empty.</p>
          <p className="muted">Items auto-delete after 30 days.</p>
        </div>
      ) : (
        <div className="trash-list">
          {items.map((item) => (
            <div key={item.id} className="trash-row">
              <div className="trash-row-main">
                <div className="trash-row-title">
                  {item.title || item.notebookName || item.sectionName || item.pageName || item.name || "Untitled"}
                </div>
                <div className="trash-row-meta">
                  <span>Deleted: {fmt(item.deletedAt)}</span>
                  {item.expireAt?.toDate && <span>Auto delete: {fmt(item.expireAt)}</span>}
                </div>
              </div>
              <div className="trash-row-actions">
                <button className="btn-ghost" disabled={busyId === item.id} onClick={() => handleRestore(item)}>
                  <RotateCcw size={15} /> Restore
                </button>
                <button className="btn-danger" disabled={busyId === item.id} onClick={() => handlePurge(item)}>
                  <XCircle size={15} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Trash() {
  const {
    items: appItems,
    loading: appLoading,
    restore: appRestore,
    purge: appPurge,
    purgeAll: appPurgeAll,
  } = useAppTrash();
  const {
    items: nbItems,
    loading: nbLoading,
    restore: nbRestore,
    purge: nbPurge,
    purgeAll: nbPurgeAll,
  } = useNotebookTrash();

  const noteItems = useMemo(() => appItems.filter((i) => i.sourceCollection === "notes"), [appItems]);
  const taskItems = useMemo(() => appItems.filter((i) => i.sourceCollection === "tasks"), [appItems]);
  const noteCount = noteItems.length;
  const taskCount = taskItems.length;
  const notebookCount = nbItems.length;

  const [tab, setTab] = useState("notes");

  return (
    <div className="trash-shell">
      <div className="trash-tabs">
        <button className={`trash-tab ${tab === "notes" ? "active" : ""}`} onClick={() => setTab("notes")}>
          <StickyNote size={15} /> Notes
          <span className="badge sm">{noteCount}</span>
        </button>
        <button className={`trash-tab ${tab === "tasks" ? "active" : ""}`} onClick={() => setTab("tasks")}>
          <CheckSquare size={15} /> Tasks
          <span className="badge sm">{taskCount}</span>
        </button>
        <button className={`trash-tab ${tab === "notebook" ? "active" : ""}`} onClick={() => setTab("notebook")}>
          <BookOpen size={15} /> Notebook
          <span className="badge sm">{notebookCount}</span>
        </button>
      </div>

      {tab === "notes" && (
        <TrashList
          title="Notes Trash"
          icon={<StickyNote size={18} />}
          items={noteItems}
          loading={appLoading}
          onRestore={appRestore}
          onPurge={appPurge}
          onPurgeAll={appPurgeAll}
        />
      )}
      {tab === "tasks" && (
        <TrashList
          title="Tasks Trash"
          icon={<CheckSquare size={18} />}
          items={taskItems}
          loading={appLoading}
          onRestore={appRestore}
          onPurge={appPurge}
          onPurgeAll={appPurgeAll}
        />
      )}
      {tab === "notebook" && (
        <TrashList
          title="Notebook Trash"
          icon={<BookOpen size={18} />}
          items={nbItems}
          loading={nbLoading}
          onRestore={nbRestore}
          onPurge={nbPurge}
          onPurgeAll={nbPurgeAll}
        />
      )}
    </div>
  );
}
