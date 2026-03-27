import { useState, useRef, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import LoginPage from "./components/LoginPage";
import Notes from "./components/Notes";
import Tasks from "./components/Tasks";
import { StickyNote, CheckSquare, LogOut, Sun, Moon, ChevronDown } from "lucide-react";

/* ── User dropdown menu ─────────────────── */
function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const avatar = user.photoURL
    ? <img src={user.photoURL} alt="" className="avatar" referrerPolicy="no-referrer"/>
    : <div className="avatar-fallback">{(user.displayName || user.email || "U")[0].toUpperCase()}</div>;

  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const email       = user.email || "";

  return (
    <div className="user-menu-wrap" ref={ref}>
      <button className="user-menu-trigger" onClick={() => setOpen(!open)}>
        {avatar}
        <span className="user-menu-name">{displayName.split(" ")[0]}</span>
        <ChevronDown size={13} className={`user-chevron ${open ? "open" : ""}`}/>
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-info">
            <div className="user-dropdown-avatar">{avatar}</div>
            <div>
              <div className="user-dropdown-name">{displayName}</div>
              <div className="user-dropdown-email">{email}</div>
            </div>
          </div>
          <div className="user-dropdown-divider"/>
          <button className="user-dropdown-item logout" onClick={() => { logout(); setOpen(false); }}>
            <LogOut size={15}/> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Theme toggle ───────────────────────── */
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="header-icon-btn" onClick={toggle} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      {theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}
    </button>
  );
}

/* ── Main App ───────────────────────────── */
function AppInner() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState("tasks");

  if (loading) return (
    <div className="splash">
      <div className="splash-logo">NT</div>
      <span className="spinner"/>
    </div>
  );

  if (!user) return <LoginPage/>;

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="topbar">

        {/* Left: Brand */}
        <div className="topbar-brand">
          <div className="brand-icon sm">NT</div>
          <span className="brand-name">NoteTask</span>
        </div>

        {/* Center: Main navigation tabs */}
        <nav className="topbar-tabs">
          <button
            className={`topbar-tab ${tab === "tasks" ? "active" : ""}`}
            onClick={() => setTab("tasks")}>
            <CheckSquare size={16}/>
            <span>Tasks</span>
          </button>
          <button
            className={`topbar-tab ${tab === "notes" ? "active" : ""}`}
            onClick={() => setTab("notes")}>
            <StickyNote size={16}/>
            <span>Notes</span>
          </button>
        </nav>

        {/* Right: Actions + User */}
        <div className="topbar-right">
          <ThemeToggle/>
          <UserMenu user={user} logout={logout}/>
        </div>

      </header>

      <main className="main">
        {tab === "tasks" ? <Tasks/> : <Notes/>}
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
