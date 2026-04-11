import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  onAuthStateChanged, signInWithPopup, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, OAuthProvider,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db, auth, googleProvider } from "../firebase";

const AuthContext = createContext(null);
export const ADMIN_EMAILS = [
  "himanshu.kashyap0582@gmail.com",
  "himanshu.khyap@gmail.com",
];
export const DEFAULT_SESSION_TIMEOUT_MINUTES = 10;
export const DEFAULT_SESSION_TIMEOUT_MS = DEFAULT_SESSION_TIMEOUT_MINUTES * 60 * 1000;
const APP_SETTINGS_DOC = "global";

function normalizeAdminEmails(emails = []) {
  return [...new Set(
    emails
      .map((email) => email?.trim().toLowerCase())
      .filter(Boolean)
  )];
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastActivityAt, setLastActivityAt] = useState(null);
  const [isStandalonePWA, setIsStandalonePWA] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [appSettings, setAppSettings] = useState({
    sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT_MINUTES,
    adminEmails: ADMIN_EMAILS,
  });
  const timeoutRef = useRef(null);
  const expiringRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLastActivityAt(u ? Date.now() : null);
      setLoading(false);
      expiringRef.current = false;
    });
    return unsub;
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const updateStandaloneState = () => {
      setIsStandalonePWA(mediaQuery.matches || window.navigator.standalone === true);
    };

    updateStandaloneState();
    window.addEventListener("appinstalled", updateStandaloneState);
    mediaQuery.addEventListener?.("change", updateStandaloneState);

    return () => {
      window.removeEventListener("appinstalled", updateStandaloneState);
      mediaQuery.removeEventListener?.("change", updateStandaloneState);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setSettingsLoading(false);
      setAppSettings({
        sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT_MINUTES,
        adminEmails: ADMIN_EMAILS,
      });
      return undefined;
    }

    setSettingsLoading(true);
    const ref = doc(db, "app_settings", APP_SETTINGS_DOC);
    return onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() || {};
        setAppSettings({
          sessionTimeoutMinutes: Number(data.sessionTimeoutMinutes) > 0
            ? Number(data.sessionTimeoutMinutes)
            : DEFAULT_SESSION_TIMEOUT_MINUTES,
          adminEmails: normalizeAdminEmails(data.adminEmails?.length ? data.adminEmails : ADMIN_EMAILS),
        });
        setSettingsLoading(false);
      },
      (err) => {
        console.error("[AuthContext] app_settings error:", err.code, err.message);
        setAppSettings({
          sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT_MINUTES,
          adminEmails: ADMIN_EMAILS,
        });
        setSettingsLoading(false);
      }
    );
  }, [user]);

  useEffect(() => {
    if (!user) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      return undefined;
    }

    if (isStandalonePWA) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setLastActivityAt(Date.now());
      return undefined;
    }

    const scheduleAutoLogout = () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(async () => {
        if (expiringRef.current) return;
        expiringRef.current = true;
        sessionStorage.setItem("sessionExpiredAt", new Date().toISOString());
        try {
          await signOut(auth);
        } finally {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }, appSettings.sessionTimeoutMinutes * 60 * 1000);
    };

    const markActivity = () => {
      if (expiringRef.current) return;
      setLastActivityAt(Date.now());
      scheduleAutoLogout();
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((eventName) =>
      window.addEventListener(eventName, markActivity, { passive: true })
    );

    scheduleAutoLogout();

    return () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      events.forEach((eventName) => window.removeEventListener(eventName, markActivity));
    };
  }, [user, appSettings.sessionTimeoutMinutes, isStandalonePWA]);

  const signInWithGoogle    = () => signInWithPopup(auth, googleProvider);
  const signInWithMicrosoft = () => signInWithPopup(auth, new OAuthProvider("microsoft.com"));

  const signUpEmail = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
  };

  const signInEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = async () => {
    sessionStorage.removeItem("sessionExpiredAt");
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    await signOut(auth);
  };
  const normalizedEmail = user?.email?.toLowerCase() || "";
  const adminEmails = normalizeAdminEmails(appSettings.adminEmails?.length ? appSettings.adminEmails : ADMIN_EMAILS);
  const sessionTimeoutMs = appSettings.sessionTimeoutMinutes * 60 * 1000;
  const isAdmin = adminEmails.includes(normalizedEmail);

  const saveAdminSettings = async (updates) => {
    if (!user || !isAdmin) throw new Error("Admin access required.");

    const nextSessionTimeoutMinutes = Number(updates.sessionTimeoutMinutes);
    await setDoc(doc(db, "app_settings", APP_SETTINGS_DOC), {
      sessionTimeoutMinutes:
        Number.isFinite(nextSessionTimeoutMinutes) && nextSessionTimeoutMinutes > 0
          ? nextSessionTimeoutMinutes
          : DEFAULT_SESSION_TIMEOUT_MINUTES,
      adminEmails,
      updatedAt: serverTimestamp(),
      updatedBy: user.email || user.uid,
    }, { merge: true });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      settingsLoading,
      isAdmin,
      adminEmails,
      lastActivityAt,
      isStandalonePWA,
      sessionTimeoutMs,
      sessionTimeoutMinutes: appSettings.sessionTimeoutMinutes,
      saveAdminSettings,
      signInWithGoogle,
      signInWithMicrosoft,
      signUpEmail,
      signInEmail,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
