import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setErr("");
    try {
      await signInWithGoogle();
    } catch (e) {
      setErr("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-glow g1" /><div className="login-glow g2" />
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon">NT</div>
          <h1>NoteTask</h1>
        </div>
        <p className="login-sub">Capture notes. Manage tasks. Stay focused.</p>
        {err && <div className="error-banner">{err}</div>}
        <button className="google-signin-btn" onClick={handleLogin} disabled={loading}>
          {loading ? (
            <span className="spinner-sm" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path d="M47.532 24.552c0-1.636-.138-3.2-.395-4.704H24.48v9.02h12.974c-.56 3.02-2.26 5.576-4.814 7.296v6.048h7.794c4.562-4.2 7.098-10.384 7.098-17.66z" fill="#4285F4"/>
              <path d="M24.48 48c6.516 0 11.98-2.16 15.974-5.854l-7.794-6.048c-2.16 1.452-4.918 2.308-8.18 2.308-6.294 0-11.624-4.252-13.528-9.966H2.882v6.248C6.858 42.836 15.106 48 24.48 48z" fill="#34A853"/>
              <path d="M10.952 28.44A14.38 14.38 0 0 1 10.192 24c0-1.54.264-3.036.76-4.44v-6.248H2.882A23.98 23.98 0 0 0 .48 24c0 3.87.928 7.532 2.402 10.688l8.07-6.248z" fill="#FBBC05"/>
              <path d="M24.48 9.594c3.546 0 6.724 1.218 9.226 3.612l6.916-6.918C36.454 2.394 30.994 0 24.48 0 15.106 0 6.858 5.164 2.882 13.312l8.07 6.248c1.904-5.714 7.234-9.966 13.528-9.966z" fill="#EA4335"/>
            </svg>
          )}
          {loading ? "Signing in…" : "Continue with Google"}
        </button>
        <p className="login-note">Your data syncs in real-time across all devices</p>
      </div>
    </div>
  );
}
