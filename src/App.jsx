import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import LoginPage from "./components/LoginPage";
import Notes from "./components/Notes";
import Tasks from "./components/Tasks";
import { StickyNote, CheckSquare, LogOut, Sun, Moon } from "lucide-react";

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="icon-btn theme-toggle" onClick={toggle} title={`Switch to ${theme==="dark"?"light":"dark"} mode`}>
      {theme === "dark" ? <Sun size={16}/> : <Moon size={16}/>}
    </button>
  );
}

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

  const avatar = user.photoURL
    ? <img src={user.photoURL} alt="" className="avatar" referrerPolicy="no-referrer"/>
    : <div className="avatar-fallback">{(user.displayName||user.email||"U")[0].toUpperCase()}</div>;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-icon sm">NT</div>
          <span className="brand-name">NoteTask</span>
        </div>

        <nav className="tab-nav">
          <button className={`tab-btn ${tab==="tasks"?"active":""}`} onClick={() => setTab("tasks")}>
            <CheckSquare size={16}/> Tasks
          </button>
          <button className={`tab-btn ${tab==="notes"?"active":""}`} onClick={() => setTab("notes")}>
            <StickyNote size={16}/> Notes
          </button>
        </nav>

        <div className="topbar-user">
          {avatar}
          <span className="user-name">{user.displayName?.split(" ")[0] || user.email?.split("@")[0]}</span>
          <ThemeToggle/>
          <button className="icon-btn" onClick={logout} title="Sign out"><LogOut size={16}/></button>
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
