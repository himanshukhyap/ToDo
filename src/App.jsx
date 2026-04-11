import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import Tasks from "./components/Tasks";
import Notes from "./components/Notes";
import Notebook from "./components/Notebook";
import AdminPanel from "./components/AdminPanel";
import OfflineBanner from "./components/OfflineBanner";
import { CheckSquare, StickyNote, BookOpen, Shield, Menu } from "lucide-react";

/* ── Mobile Bottom Nav ───────────────────────────────── */
function MobileBottomNav({ active, setActive, isAdmin }) {
  const tabs = [
    { id: "tasks",    icon: <CheckSquare size={22}/>, label: "Tasks"    },
    { id: "notes",    icon: <StickyNote  size={22}/>, label: "Notes"    },
    { id: "notebook", icon: <BookOpen    size={22}/>, label: "Notebook" },
  ];
  if (isAdmin) tabs.push({ id: "admin", icon: <Shield size={22}/>, label: "Admin" });
  return (
    <nav className="mobile-bottom-nav">
      {tabs.map(t => (
        <button key={t.id}
          className={`mbn-tab ${active === t.id ? "active" : ""}`}
          onClick={() => setActive(t.id)}>
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ── Mobile Top Header ───────────────────────────────── */
function MobileHeader({ active, activeCat, activeNotebook, onMenuOpen }) {
  const titles = {
    tasks:    activeCat ? activeCat.name || "Tasks" : "Tasks",
    notes:    "Notes",
    notebook: activeNotebook?.notebookName || "Notebook",
    admin:    "Admin Panel",
  };
  return (
    <header className="mobile-top-header">
      <button className="mth-menu-btn" onClick={onMenuOpen} aria-label="Open menu">
        <Menu size={22}/>
      </button>
      <div className="mth-brand">
        <span className="mth-logo">NT</span>
        <span className="mth-title">{titles[active]}</span>
      </div>
      <div className="mth-right"/>
    </header>
  );
}

/* ── Main App ────────────────────────────────────────── */
function AppInner() {
  const { user, loading, isAdmin } = useAuth();
  const [active,           setActive]           = useState("tasks");
  const [activeCat,        setActiveCat]        = useState(null);
  const [activeNotebook,   setActiveNotebook]   = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSbOpen,     setMobileSbOpen]     = useState(false);

  useEffect(() => {
    if (!isAdmin && active === "admin") setActive("tasks");
  }, [active, isAdmin]);

  if (loading) return (
    <div className="splash">
      <div className="splash-logo">NT</div>
      <span className="spinner"/>
    </div>
  );

  if (!user) return <LoginPage/>;

  return (
    <div className={`app-layout ${sidebarCollapsed ? "sb-collapsed" : ""}`}>
      <OfflineBanner/>

      {/* ── Mobile sidebar overlay ── */}
      {mobileSbOpen && (
        <div className="mobile-overlay" onClick={() => setMobileSbOpen(false)}/>
      )}

      {/* ── Mobile top header (hidden on desktop) ── */}
      <MobileHeader
        active={active}
        activeCat={activeCat}
        activeNotebook={activeNotebook}
        onMenuOpen={() => setMobileSbOpen(true)}
      />

      {/* ── Sidebar ── */}
      <div className={`sidebar-slot ${mobileSbOpen ? "mobile-open" : ""}`}>
        <Sidebar
          active={active}
          setActive={v     => { setActive(v);              setMobileSbOpen(false); }}
          activeCat={activeCat}
          setActiveCat={v  => { setActiveCat(v);           setMobileSbOpen(false); }}
          activeNotebook={activeNotebook}
          setActiveNotebook={v => { setActiveNotebook(v);  setMobileSbOpen(false); }}
          isAdmin={isAdmin}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      </div>

      {/* ── Main content ── */}
      <main className={`app-main ${active === "notebook" ? "nb-active" : ""}`}>
        {active === "tasks"    && <Tasks    filterCat={activeCat}/>}
        {active === "notes"    && <Notes/>}
        {active === "notebook" && <Notebook notebook={activeNotebook}/>}
        {active === "admin"    && <AdminPanel/>}
      </main>

      {/* ── Mobile bottom nav (hidden on desktop) ── */}
      <MobileBottomNav
        active={active}
        isAdmin={isAdmin}
        setActive={v => {
          setActive(v);
          setActiveCat(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner/>
      </AuthProvider>
    </ThemeProvider>
  );
}
