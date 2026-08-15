import { useEffect, useState } from "react";
import {
  BrowserRouter, Routes, Route, Navigate, Outlet,
  useLocation, useNavigate, useParams, matchPath,
} from "react-router-dom";
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
import { useCategories } from "./hooks/useCategories";
import { Menu } from "lucide-react";

const MOBILE_BREAKPOINT = 768;

function Splash() {
  return (
    <div className="splash">
      <div className="splash-logo">NT</div>
      <span className="spinner" />
    </div>
  );
}

/* Mobile Top Header */
function MobileHeader({ active, activeCat, activeNotebook, onMenuOpen }) {
  const titles = {
    tasks: activeCat?.name || "Tasks",
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

/* Route guards */
function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

function RequireAdmin() {
  const { isAdmin, settingsLoading } = useAuth();
  if (settingsLoading) return <Splash />;
  if (!isAdmin) return <Navigate to="/tasks" replace />;
  return <Outlet />;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Navigate to="/tasks" replace />;
  return <LoginPage />;
}

/* Route views that read params */
function TasksRoute() {
  const { categoryId } = useParams();
  return <Tasks filterCat={categoryId || null} />;
}

function NotebookRoute() {
  const { notebookId } = useParams();
  const { notebooks } = useNotebooks();
  const navigate = useNavigate();

  const notebook = notebooks.find((nb) => nb.id === notebookId) || null;

  useEffect(() => {
    if (notebook || !notebooks.length) return;
    navigate(`/notebook/${notebooks[0].id}`, { replace: true });
  }, [notebook, notebooks, navigate]);

  return <Notebook notebook={notebook} />;
}

/* Authenticated shell */
function AppLayout() {
  const { isAdmin } = useAuth();
  const { notebooks } = useNotebooks();
  const { categories } = useCategories();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSbOpen, setMobileSbOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobileViewport && sidebarCollapsed) setSidebarCollapsed(false);
  }, [isMobileViewport, sidebarCollapsed]);

  const active = location.pathname.split("/")[1] || "tasks";
  const activeCatId = matchPath("/tasks/:categoryId", location.pathname)?.params.categoryId || null;
  const activeNbId = matchPath("/notebook/:notebookId", location.pathname)?.params.notebookId || null;
  const activeCat = categories.find((c) => c.id === activeCatId) || null;
  const activeNotebook = notebooks.find((nb) => nb.id === activeNbId) || null;

  const go = (path) => {
    navigate(path);
    setMobileSbOpen(false);
  };

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
          setActive={(v) => go(`/${v}`)}
          activeCat={activeCatId}
          setActiveCat={(v) => go(v ? `/tasks/${v}` : "/tasks")}
          activeNotebook={activeNotebook}
          setActiveNotebook={(v) => go(v ? `/notebook/${v.id}` : "/notebook")}
          isAdmin={isAdmin}
          allowCollapse={!isMobileViewport}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      </div>

      <main className={`app-main ${active === "notebook" ? "nb-active" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/tasks" replace />} />
                <Route path="tasks" element={<TasksRoute />} />
                <Route path="tasks/:categoryId" element={<TasksRoute />} />
                <Route path="notes" element={<Notes />} />
                <Route path="notebook" element={<NotebookRoute />} />
                <Route path="notebook/:notebookId" element={<NotebookRoute />} />
                <Route path="trash" element={<Trash />} />
                <Route element={<RequireAdmin />}>
                  <Route path="admin" element={<AdminPanel />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
