import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import Tasks from "./components/Tasks";
import Notes from "./components/Notes";
import Notebook from "./components/Notebook";
import AdminPanel from "./components/AdminPanel";
import Trash from "./components/Trash";
import OfflineBanner from "./components/OfflineBanner";
import { useNotebooks } from "./hooks/useNotebook";
import { Menu } from "lucide-react";

const MOBILE_BREAKPOINT = 768;

/* Mobile Top Header */
function MobileHeader({ active, activeCat, activeNotebook, onMenuOpen }) {
  const titles = {
    tasks: activeCat ? activeCat.name || "Tasks" : "Tasks",
    notes: "Notes",
    notebook: activeNotebook?.notebookName || "Notebook",
    trash: "Trash",
    admin: "Admin Panel",
  };
  return (
    <header className="mobile-top-header">
      <button className="mth-menu-btn" onClick={onMenuOpen} aria-label="Open menu">
        <Menu size={22} />
      </button>
      <div className="mth-brand">
        <span className="mth-logo">NT</span>
        <span className="mth-title">{titles[active]}</span>
      </div>
      <div className="mth-right" />
    </header>
  );
}

/* Main App */
function AppInner() {
  const { user, loading, isAdmin } = useAuth();
  const { notebooks } = useNotebooks();
  const [active, setActive] = useState("tasks");
  const [activeCat, setActiveCat] = useState(null);
  const [activeNotebook, setActiveNotebook] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSbOpen, setMobileSbOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);

  useEffect(() => {
    if (!isAdmin && active === "admin") setActive("tasks");
  }, [active, isAdmin]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobileViewport && sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  }, [isMobileViewport, sidebarCollapsed]);

  useEffect(() => {
    if (active !== "notebook") return;

    const selectedNotebook = activeNotebook
      ? notebooks.find((nb) => nb.id === activeNotebook.id)
      : null;

    if (!selectedNotebook) {
      setActiveNotebook(notebooks[0] || null);
      return;
    }

    if (
      selectedNotebook.notebookName !== activeNotebook?.notebookName ||
      selectedNotebook.color !== activeNotebook?.color
    ) {
      setActiveNotebook(selectedNotebook);
    }
  }, [active, activeNotebook, notebooks]);

  if (loading)
    return (
      <div className="splash">
        <div className="splash-logo">NT</div>
        <span className="spinner" />
      </div>
    );

  if (!user) return <LoginPage />;

  return (
    <div className={`app-layout ${sidebarCollapsed ? "sb-collapsed" : ""}`}>
      <OfflineBanner />

      {mobileSbOpen && <div className="mobile-overlay" onClick={() => setMobileSbOpen(false)} />}

      <MobileHeader
        active={active}
        activeCat={activeCat}
        activeNotebook={activeNotebook}
        onMenuOpen={() => setMobileSbOpen(true)}
      />

      <div className={`sidebar-slot ${mobileSbOpen ? "mobile-open" : ""}`}>
        <Sidebar
          active={active}
          setActive={(v) => {
            setActive(v);
            setMobileSbOpen(false);
          }}
          activeCat={activeCat}
          setActiveCat={(v) => {
            setActiveCat(v);
            setMobileSbOpen(false);
          }}
          activeNotebook={activeNotebook}
          setActiveNotebook={(v) => {
            setActiveNotebook(v);
            setMobileSbOpen(false);
          }}
          isAdmin={isAdmin}
          allowCollapse={!isMobileViewport}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      </div>

      <main className={`app-main ${active === "notebook" ? "nb-active" : ""}`}>
        {active === "tasks" && <Tasks filterCat={activeCat} />}
        {active === "notes" && <Notes />}
        {active === "notebook" && <Notebook notebook={activeNotebook} />}
        {active === "trash" && <Trash />}
        {active === "admin" && <AdminPanel />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}
