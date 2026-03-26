import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react";

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path d="M47.532 24.552c0-1.636-.138-3.2-.395-4.704H24.48v9.02h12.974c-.56 3.02-2.26 5.576-4.814 7.296v6.048h7.794c4.562-4.2 7.098-10.384 7.098-17.66z" fill="#4285F4"/>
    <path d="M24.48 48c6.516 0 11.98-2.16 15.974-5.854l-7.794-6.048c-2.16 1.452-4.918 2.308-8.18 2.308-6.294 0-11.624-4.252-13.528-9.966H2.882v6.248C6.858 42.836 15.106 48 24.48 48z" fill="#34A853"/>
    <path d="M10.952 28.44A14.38 14.38 0 0 1 10.192 24c0-1.54.264-3.036.76-4.44v-6.248H2.882A23.98 23.98 0 0 0 .48 24c0 3.87.928 7.532 2.402 10.688l8.07-6.248z" fill="#FBBC05"/>
    <path d="M24.48 9.594c3.546 0 6.724 1.218 9.226 3.612l6.916-6.918C36.454 2.394 30.994 0 24.48 0 15.106 0 6.858 5.164 2.882 13.312l8.07 6.248c1.904-5.714 7.234-9.966 13.528-9.966z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const { signInWithGoogle, signInWithMicrosoft, signUpEmail, signInEmail } = useAuth();
  const [mode, setMode]       = useState("login"); // login | register
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(null);
  const [error, setError]     = useState("");

  const wrap = async (key, fn) => {
    setLoading(key); setError("");
    try { await fn(); }
    catch (e) {
      const msg = {
        "auth/email-already-in-use": "Email already registered. Try signing in.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/popup-closed-by-user": "",
        "auth/cancelled-popup-request": "",
      }[e.code] || e.message;
      if (msg) setError(msg);
    } finally { setLoading(null); }
  };

  const handleEmail = () => {
    if (!email || !password) return setError("Please fill all fields.");
    if (mode === "register" && !name.trim()) return setError("Please enter your name.");
    wrap("email", () =>
      mode === "register" ? signUpEmail(email, password, name) : signInEmail(email, password)
    );
  };

  return (
    <div className="login-root">
      <div className="login-glow g1"/><div className="login-glow g2"/>
      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="brand-icon">NT</div>
          <h1>NoteTask</h1>
        </div>
        <p className="login-sub">Capture notes. Manage tasks. Stay focused.</p>

        {/* Mode toggle */}
        <div className="login-mode-toggle">
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign In</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Register</button>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={14}/> {error}
          </div>
        )}

        {/* Email form */}
        <div className="login-form">
          {mode === "register" && (
            <div className="login-field">
              <User size={15}/>
              <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEmail()} />
            </div>
          )}
          <div className="login-field">
            <Mail size={15}/>
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmail()} />
          </div>
          <div className="login-field">
            <Lock size={15}/>
            <input type={showPw ? "text" : "password"} placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmail()} />
            <button className="pw-toggle" onClick={() => setShowPw(!showPw)} type="button">
              {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
            </button>
          </div>
          <button className="btn-email" onClick={handleEmail} disabled={loading === "email"}>
            {loading === "email" ? <span className="spinner-sm"/> : <Mail size={15}/>}
            {mode === "register" ? "Create Account" : "Sign In with Email"}
          </button>
        </div>

        <div className="login-divider"><span>or continue with</span></div>

        {/* OAuth buttons */}
        <div className="oauth-btns">
          <button className="oauth-btn google" onClick={() => wrap("google", signInWithGoogle)} disabled={!!loading}>
            {loading === "google" ? <span className="spinner-sm"/> : <GoogleIcon/>}
            Google
          </button>
          <button className="oauth-btn microsoft" onClick={() => wrap("ms", signInWithMicrosoft)} disabled={!!loading}>
            {loading === "ms" ? <span className="spinner-sm"/> : <MicrosoftIcon/>}
            Microsoft
          </button>
        </div>

        <p className="login-note">Data syncs in real-time across all devices</p>
      </div>
    </div>
  );
}
