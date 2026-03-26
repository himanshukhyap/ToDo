import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./components/LoginPage";
import Notes from "./components/Notes";
import Tasks from "./components/Tasks";
import { StickyNote, CheckSquare, LogOut } from "lucide-react";

function AppInner() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState("tasks");

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-logo">NT</div>
        <span className="spinner" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="app">
      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-icon sm">NT</div>
          <span className="brand-name">NoteTask</span>
        </div>

        <nav className="tab-nav">
          <button className={`tab-btn ${tab === "tasks" ? "active" : ""}`} onClick={() => setTab("tasks")}>
            <CheckSquare size={16} /> Tasks
          </button>
          <button className={`tab-btn ${tab === "notes" ? "active" : ""}`} onClick={() => setTab("notes")}>
            <StickyNote size={16} /> Notes
          </button>
        </nav>

        <div className="topbar-user">
          <img src={user.photoURL} alt="" className="avatar" referrerPolicy="no-referrer" />
          <span className="user-name">{user.displayName?.split(" ")[0]}</span>
          <button className="icon-btn" onClick={logout} title="Sign out"><LogOut size={16} /></button>
        </div>
      </header>

      {/* Content */}
      <main className="main">
        {tab === "tasks" ? <Tasks /> : <Notes />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
