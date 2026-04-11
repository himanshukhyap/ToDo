import { useEffect, useRef, useState } from "react";
import {
  Shield,
  Clock3,
  Users,
  Mail,
  CheckCircle2,
  Save,
  Download,
  Upload,
  Database,
  Settings2,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../hooks/useTasks";
import { useNotes } from "../hooks/useNotes";
import { useNotebooks } from "../hooks/useNotebook";
import { errorAlert, toast } from "../utils/swal";
import {
  BACKUP_SECTIONS,
  exportUserBackup,
  importUserBackupWithOptions,
} from "../services/backupService";

function formatMinutes(ms) {
  return Math.round(ms / 60000);
}

function formatLastSeen(timestamp) {
  if (!timestamp) return "Waiting for activity";

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 5) return "Active now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h ago`;
}

export default function AdminPanel() {
  const {
    user,
    isAdmin,
    adminEmails,
    lastActivityAt,
    isStandalonePWA,
    sessionTimeoutMs,
    sessionTimeoutMinutes,
    settingsLoading,
    saveAdminSettings,
  } = useAuth();
  const { tasks } = useTasks();
  const { notes } = useNotes();
  const { notebooks } = useNotebooks();
  const [activeSection, setActiveSection] = useState("backup");
  const [sessionInput, setSessionInput] = useState(String(sessionTimeoutMinutes));
  const [saving, setSaving] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [selectedExportCollections, setSelectedExportCollections] = useState(
    () => BACKUP_SECTIONS.map((section) => section.collection)
  );
  const [selectedImportCollections, setSelectedImportCollections] = useState(
    () => BACKUP_SECTIONS.map((section) => section.collection)
  );
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const fileInputRef = useRef(null);
  const totalItems = tasks.length + notes.length + notebooks.length;

  useEffect(() => {
    setSessionInput(String(sessionTimeoutMinutes));
  }, [sessionTimeoutMinutes]);

  const handleSave = async () => {
    const minutes = Number(sessionInput);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) {
      errorAlert("Session timeout 1 se 240 minutes ke beech hona chahiye.");
      return;
    }

    setSaving(true);
    try {
      await saveAdminSettings({ sessionTimeoutMinutes: minutes });
      toast("success", "Session settings saved");
    } catch (e) {
      errorAlert(e.message || "Settings save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleBackupExport = async () => {
    if (!user) return;
    if (!selectedExportCollections.length) {
      errorAlert("Backup ke liye kam se kam ek section select karein.");
      return;
    }
    setBackupBusy(true);
    try {
      const summary = await exportUserBackup(user, {
        selectedCollections: selectedExportCollections,
      });
      toast("success", `Backup downloaded: ${summary.tasks} tasks, ${summary.notes} notes, ${summary.notebooks} notebooks`);
    } catch (e) {
      errorAlert(e.message || "Backup export failed.");
    } finally {
      setBackupBusy(false);
    }
  };

  const handlePickImport = () => fileInputRef.current?.click();

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user) return;
    if (!selectedImportCollections.length) {
      errorAlert("Restore ke liye kam se kam ek section select karein.");
      return;
    }

    setBackupBusy(true);
    try {
      const text = await file.text();
      const summary = await importUserBackupWithOptions(user, text, {
        selectedCollections: selectedImportCollections,
        skipDuplicates,
      });
      toast("success", `Restore complete: ${summary.tasks} tasks, ${summary.notes} notes, ${summary.notebooks} notebooks`);
    } catch (e) {
      errorAlert(e.message || "Backup import failed.");
    } finally {
      setBackupBusy(false);
    }
  };

  const toggleCollection = (mode, collectionName) => {
    const setter = mode === "export" ? setSelectedExportCollections : setSelectedImportCollections;
    setter((current) => (
      current.includes(collectionName)
        ? current.filter((name) => name !== collectionName)
        : [...current, collectionName]
    ));
  };

  const toggleAllCollections = (mode, checked) => {
    const setter = mode === "export" ? setSelectedExportCollections : setSelectedImportCollections;
    setter(checked ? BACKUP_SECTIONS.map((section) => section.collection) : []);
  };

  if (!isAdmin) {
    return (
      <section className="tab-panel">
        <div className="admin-hero">
          <div>
            <span className="admin-eyebrow">Restricted Area</span>
            <h2>Admin access required</h2>
            <p>This panel is only available to approved admin email IDs.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tab-panel admin-panel">
      <div className="admin-hero">
        <div>
          <span className="admin-eyebrow">Admin Panel</span>
          <h2>Workspace controls, backup, and session policy</h2>
          <p>
            Signed in as <strong>{user?.email}</strong>. Backup sirf current logged-in user ke data ka banega, login credentials ka nahi.
          </p>
        </div>
        <div className="admin-status-pill">
          <Shield size={16} />
          <span>Admin Active</span>
        </div>
      </div>

      <div className="admin-stats">
        <article className="admin-stat-card">
          <div className="admin-stat-head">
            <Clock3 size={16} />
            <span>Session Timeout</span>
          </div>
          <strong>
            {isStandalonePWA
              ? "Disabled in installed app"
              : settingsLoading
                ? "Loading..."
                : `${formatMinutes(sessionTimeoutMs)} minutes`}
          </strong>
          <p>
            {isStandalonePWA
              ? "Installed PWA mode me auto sign-out band rahega, taki offline access chalta rahe."
              : "Users are signed out automatically after inactivity."}
          </p>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-head">
            <CheckCircle2 size={16} />
            <span>Last Activity</span>
          </div>
          <strong>{formatLastSeen(lastActivityAt)}</strong>
          <p>The inactivity timer resets on keyboard, touch, mouse, and scroll activity.</p>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-head">
            <Users size={16} />
            <span>Your Data</span>
          </div>
          <strong>{totalItems} items</strong>
          <p>{tasks.length} tasks, {notes.length} notes, {notebooks.length} notebooks in this account.</p>
        </article>
      </div>

      <div className="admin-section-tabs">
        <button
          className={`admin-section-tab ${activeSection === "backup" ? "active" : ""}`}
          onClick={() => setActiveSection("backup")}
          type="button"
        >
          <Database size={16} />
          <span>Backup / Restore</span>
        </button>
        <button
          className={`admin-section-tab ${activeSection === "settings" ? "active" : ""}`}
          onClick={() => setActiveSection("settings")}
          type="button"
        >
          <Settings2 size={16} />
          <span>Settings</span>
        </button>
      </div>

      {activeSection === "settings" && (
        <div className="admin-grid">
          <article className="admin-card">
            <div className="admin-card-head">
              <Shield size={17} />
              <h3>Allowed Admin Email IDs</h3>
            </div>
            <div className="admin-email-list">
              {adminEmails.map((email) => (
                <div key={email} className="admin-email-item">
                  <Mail size={14} />
                  <span>{email}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-card">
            <div className="admin-card-head">
              <Clock3 size={17} />
              <h3>Session Settings</h3>
            </div>
            <div className="admin-settings-form">
              <label className="admin-field">
                <span>Auto sign-out after inactivity</span>
                <div className="admin-input-row">
                  <input
                    className="input-sm admin-number-input"
                    type="number"
                    min="1"
                    max="240"
                    step="1"
                    value={sessionInput}
                    onChange={(e) => setSessionInput(e.target.value)}
                    disabled={saving || settingsLoading}
                  />
                  <span className="admin-input-suffix">minutes</span>
                </div>
              </label>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving || settingsLoading}
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save Settings"}
              </button>
              <ul className="admin-policy-list">
                <li>Timeout inactivity-based hai, total login time based nahi.</li>
                <li>Manual sign out profile menu se normal tareeke se kaam karega.</li>
                <li>Installed PWA mode me auto session timeout disable rahega for offline access.</li>
                <li>Ye setting save hote hi browser mode users par next activity cycle me apply ho jayegi.</li>
              </ul>
            </div>
          </article>
        </div>
      )}

      {activeSection === "backup" && (
        <div className="admin-grid admin-grid-wide">
          <article className="admin-card">
            <div className="admin-card-head">
              <Download size={17} />
              <h3>Backup Current Login User</h3>
            </div>
            <div className="admin-settings-form">
              <p className="admin-help-text">
                Backup me sirf abhi jo user login hai uska data aayega. Password, OAuth tokens, ya login credentials backup me include nahi honge.
              </p>
              <label className="admin-check-row admin-check-row-all">
                <input
                  type="checkbox"
                  checked={selectedExportCollections.length === BACKUP_SECTIONS.length}
                  onChange={(e) => toggleAllCollections("export", e.target.checked)}
                />
                <span>Select all backup sections</span>
              </label>
              <div className="admin-selection-grid">
                {BACKUP_SECTIONS.map((section) => (
                  <label key={section.collection} className="admin-select-card">
                    <input
                      type="checkbox"
                      checked={selectedExportCollections.includes(section.collection)}
                      onChange={() => toggleCollection("export", section.collection)}
                    />
                    <span>{section.label}</span>
                  </label>
                ))}
              </div>
              <div className="admin-action-row">
                <button className="btn-primary" onClick={handleBackupExport} disabled={backupBusy}>
                  <Download size={15} />
                  {backupBusy ? "Working..." : "Download Backup"}
                </button>
              </div>
              <ul className="admin-policy-list">
                <li>{selectedExportCollections.length} sections currently selected for backup.</li>
                <li>Backup JSON ko baad me isi panel se selective restore ke liye use kar sakte hain.</li>
              </ul>
            </div>
          </article>

          <article className="admin-card">
            <div className="admin-card-head">
              <Upload size={17} />
              <h3>Restore with Duplicate Skip</h3>
            </div>
            <div className="admin-settings-form">
              <p className="admin-help-text">
                Restore selected sections only. Duplicate match milne par record skip kiya jayega jab niche wala option on hoga.
              </p>
              <label className="admin-check-row admin-check-row-all">
                <input
                  type="checkbox"
                  checked={selectedImportCollections.length === BACKUP_SECTIONS.length}
                  onChange={(e) => toggleAllCollections("import", e.target.checked)}
                />
                <span>Select all restore sections</span>
              </label>
              <div className="admin-selection-grid">
                {BACKUP_SECTIONS.map((section) => (
                  <label key={section.collection} className="admin-select-card">
                    <input
                      type="checkbox"
                      checked={selectedImportCollections.includes(section.collection)}
                      onChange={() => toggleCollection("import", section.collection)}
                    />
                    <span>{section.label}</span>
                  </label>
                ))}
              </div>
              <label className="admin-check-row admin-check-row-highlight">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                />
                <span>Duplicate records ko skip kare</span>
              </label>
              <div className="admin-action-row">
                <button className="btn-ghost" onClick={handlePickImport} disabled={backupBusy}>
                  <Upload size={15} />
                  {backupBusy ? "Working..." : "Import Backup"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="admin-file-input"
                  onChange={handleImportFile}
                />
              </div>
              <ul className="admin-policy-list">
                <li>{selectedImportCollections.length} sections currently selected for restore.</li>
                <li>Restore current account me data add karta hai, existing records ko delete nahi karta.</li>
                <li>Imported ya skipped sab data current logged-in user ke account ke under evaluate hoga.</li>
              </ul>
            </div>
          </article>

          <article className="admin-card">
            <div className="admin-card-head">
              <Users size={17} />
              <h3>Current Account Summary</h3>
            </div>
            <div className="admin-summary-list">
              <div className="admin-summary-item"><span>Tasks</span><strong>{tasks.length}</strong></div>
              <div className="admin-summary-item"><span>Notes</span><strong>{notes.length}</strong></div>
              <div className="admin-summary-item"><span>Notebooks</span><strong>{notebooks.length}</strong></div>
            </div>
          </article>

          <article className="admin-card">
            <div className="admin-card-head">
              <CheckSquare size={17} />
              <h3>Restore Rules</h3>
            </div>
            <ul className="admin-policy-list">
              <li>Categories duplicate tab maana jayega jab naam same ho.</li>
              <li>Tasks duplicate tab maana jayega jab title, completion state, aur subtasks same hon.</li>
              <li>Notes duplicate tab maana jayega jab text, HTML aur color same hon.</li>
              <li>Notebook, section aur page restore me naam/content ke basis par duplicate skip hoga.</li>
            </ul>
          </article>
        </div>
      )}
    </section>
  );
}
