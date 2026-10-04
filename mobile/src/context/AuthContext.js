import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, updateProfile,
  GoogleAuthProvider, signInWithCredential,
} from "firebase/auth";
import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../firebase";
import { cleanupExpiredTrash } from "../services/trashCleanupService";

const AuthContext = createContext(null);
export const ADMIN_EMAILS = [
  "himanshu.kashyap0582@gmail.com",
  "himanshu.khyap@gmail.com",
];
export const DEFAULT_SESSION_TIMEOUT_MINUTES = 10;
const APP_SETTINGS_DOC = "global";

// "Web client" OAuth ID of the Firebase project (google-services.json, client_type 3).
// Google returns an ID token for this client, which Firebase Auth accepts.
const GOOGLE_WEB_CLIENT_ID = "547962875689-ecpa198lje0ii7g1jkmueves776fv004.apps.googleusercontent.com";
GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

function normalizeAdminEmails(emails = []) {
  return [...new Set(
    emails
      .map((email) => email?.trim().toLowerCase())
      .filter(Boolean)
  )];
}

/**
 * Same behaviour as the web AuthContext, except:
 * - Google sign-in uses the native Google account picker instead of a popup
 *   (same Firebase user as on the web). Microsoft popup sign-in is not available.
 * - The Android app counts as the "installed app", so the inactivity
 *   auto-logout is disabled (same rule the web app applies to the installed PWA).
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastActivityAt, setLastActivityAt] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [appSettings, setAppSettings] = useState({
    sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT_MINUTES,
    adminEmails: ADMIN_EMAILS,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLastActivityAt(u ? Date.now() : null);
      setLoading(false);
    });
    return unsub;
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

  // Manual recycle-bin cleanup: at most once per 12 hours per user on this device.
  useEffect(() => {
    if (!user) return undefined;

    const key = `trashCleanupAt::${user.uid}`;
    const twelveHours = 12 * 60 * 60 * 1000;
    let cancelled = false;

    (async () => {
      try {
        const last = Number((await AsyncStorage.getItem(key)) || 0);
        if (Date.now() - last < twelveHours) return;
        await cleanupExpiredTrash(user.uid);
        if (!cancelled) await AsyncStorage.setItem(key, String(Date.now()));
      } catch (e) {
        console.warn("[TrashCleanup] failed:", e?.code, e?.message || e);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const markActivity = () => { if (user) setLastActivityAt(Date.now()); };

  // Resolves false if the user closed the account picker
  const signInWithGoogle = async () => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return false;
    const credential = GoogleAuthProvider.credential(res.data.idToken);
    await signInWithCredential(auth, credential);
    return true;
  };

  const signUpEmail = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name) await updateProfile(cred.user, { displayName: name });
  };

  const signInEmail = (email, password) => signInWithEmailAndPassword(auth, email.trim(), password);
  const resetPasswordEmail = (email) => sendPasswordResetEmail(auth, email.trim());
  const logout = async () => {
    // Also forget the Google account so the picker shows again next time
    await GoogleSignin.signOut().catch(() => {});
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
      markActivity,
      isStandalonePWA: true,
      sessionTimeoutMs,
      sessionTimeoutMinutes: appSettings.sessionTimeoutMinutes,
      saveAdminSettings,
      signInWithGoogle,
      signUpEmail,
      signInEmail,
      resetPasswordEmail,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
