import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import Tasks from "./components/Tasks";
import Notes from "./components/Notes";
import Notebook from "./components/Notebook";
import OfflineBanner from "./components/OfflineBanner";

function AppInner() {
  const { user, loading } = useAuth();
  const [active,           setActive]           = useState("tasks");
  const [activeCat,        setActiveCat]        = useState(null);
  const [activeNotebook,   setActiveNotebook]   = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSbOpen,     setMobileSbOpen]     = useState(false);

  if (loading) return (
    <div className="splash">
      <div className="splash-logo">NT</div>
      <span className="spinner"/>
    </div>
  );

  if (!user) return <LoginPage/>;

  return (
    <div className={`app-layout ${sidebarCollapsed ? "sb-collapsed" : ""}`}>
      {/* ── Offline / Online banner ─────────────────── */}
      <OfflineBanner/>

      {/* Mobile overlay */}
      {mobileSbOpen && <div className="mobile-overlay" onClick={() => setMobileSbOpen(false)}/>}

      {/* Mobile hamburger */}
      <button className="mobile-ham" onClick={() => setMobileSbOpen(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`sidebar-slot ${mobileSbOpen ? "mobile-open" : ""}`}>
        <Sidebar
          active={active}
          setActive={(v)  => { setActive(v);         setMobileSbOpen(false); }}
          activeCat={activeCat}
          setActiveCat={(v) => { setActiveCat(v);    setMobileSbOpen(false); }}
          activeNotebook={activeNotebook}
          setActiveNotebook={(v) => { setActiveNotebook(v); setMobileSbOpen(false); }}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      </div>

      {/* Main content */}
      <main className={`app-main ${active === "notebook" ? "nb-active" : ""}`}>
        {active === "tasks"    && <Tasks    filterCat={activeCat}/>}
        {active === "notes"    && <Notes/>}
        {active === "notebook" && <Notebook notebook={activeNotebook}/>}
      </main>
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
