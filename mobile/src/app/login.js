import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { statusCodes } from "@react-native-google-signin/google-signin";
import { AlertCircle, Eye, EyeOff, Lock, Mail, User, Sun, Moon } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Splash, { BrandIcon } from "../components/Splash";

const ERRORS = {
  "auth/email-already-in-use": "Email already registered. Try signing in.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/network-request-failed": "No internet connection. Please try again.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/account-exists-with-different-credential": "This email is already registered with a different sign-in method.",
  [statusCodes.PLAY_SERVICES_NOT_AVAILABLE]: "Google Play Services is not available on this device.",
  [statusCodes.IN_PROGRESS]: "Google sign-in is already in progress.",
  // DEVELOPER_ERROR: this APK's signing key SHA-1 is not registered in Firebase
  "10": "Google sign-in is not set up for this app build (SHA-1 missing in Firebase).",
};
const SILENT_ERRORS = new Set([statusCodes.SIGN_IN_CANCELLED, "auth/popup-closed-by-user"]);

// Same logo as the web login page
const GoogleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 48 48">
    <Path d="M47.532 24.552c0-1.636-.138-3.2-.395-4.704H24.48v9.02h12.974c-.56 3.02-2.26 5.576-4.814 7.296v6.048h7.794c4.562-4.2 7.098-10.384 7.098-17.66z" fill="#4285F4" />
    <Path d="M24.48 48c6.516 0 11.98-2.16 15.974-5.854l-7.794-6.048c-2.16 1.452-4.918 2.308-8.18 2.308-6.294 0-11.624-4.252-13.528-9.966H2.882v6.248C6.858 42.836 15.106 48 24.48 48z" fill="#34A853" />
    <Path d="M10.952 28.44A14.38 14.38 0 0 1 10.192 24c0-1.54.264-3.036.76-4.44v-6.248H2.882A23.98 23.98 0 0 0 .48 24c0 3.87.928 7.532 2.402 10.688l8.07-6.248z" fill="#FBBC05" />
    <Path d="M24.48 9.594c3.546 0 6.724 1.218 9.226 3.612l6.916-6.918C36.454 2.394 30.994 0 24.48 0 15.106 0 6.858 5.164 2.882 13.312l8.07 6.248c1.904-5.714 7.234-9.966 13.528-9.966z" fill="#EA4335" />
  </Svg>
);

function Field({ icon: Icon, right, ...props }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.field, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      <Icon size={16} color={colors.text2} />
      <TextInput placeholderTextColor={colors.text3} style={[styles.fieldInput, { color: colors.text }]} {...props} />
      {right}
    </View>
  );
}

export default function LoginPage() {
  const { user, loading: authLoading, signInWithGoogle, signUpEmail, signInEmail, resetPasswordEmail } = useAuth();
  const { colors, theme, toggle } = useTheme();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (authLoading) return <Splash />;
  if (user) return <Redirect href="/tasks" />;

  const wrap = async (key, fn) => {
    setLoading(key); setError(""); setSuccessMessage("");
    try {
      await fn();
      return true;
    } catch (e) {
      if (!SILENT_ERRORS.has(e.code)) setError(ERRORS[e.code] || e.message);
      return false;
    } finally { setLoading(null); }
  };

  const handleEmail = () => {
    if (!email || !password) return setError("Please fill all fields.");
    if (mode === "register" && !name.trim()) return setError("Please enter your name.");
    wrap("email", () =>
      mode === "register" ? signUpEmail(email, password, name) : signInEmail(email, password)
    );
  };

  const handleForgotPassword = async () => {
    if (!email) return setError("Enter your email to reset password.");
    const success = await wrap("reset", () => resetPasswordEmail(email));
    if (success) setSuccessMessage("Password reset email sent. Check your inbox.");
  };

  const switchMode = (m) => { setMode(m); setError(""); setSuccessMessage(""); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={toggle} style={styles.themeBtn} hitSlop={8}>
            {theme === "dark" ? <Sun size={20} color={colors.text2} /> : <Moon size={20} color={colors.text2} />}
          </Pressable>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.brandRow}>
              <BrandIcon size={42} />
              <Text style={[styles.brandName, { color: colors.text }]}>NoteTask</Text>
            </View>
            <Text style={[styles.sub, { color: colors.text2 }]}>Capture notes. Manage tasks. Stay focused.</Text>

            <View style={[styles.toggle, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              {["login", "register"].map((m) => (
                <Pressable
                  key={m}
                  onPress={() => switchMode(m)}
                  style={[styles.toggleBtn, mode === m && { backgroundColor: colors.accent }]}
                >
                  <Text style={[styles.toggleText, { color: mode === m ? "#fff" : colors.text2 }]}>
                    {m === "login" ? "Sign In" : "Register"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {!!error && (
              <View style={[styles.msg, { backgroundColor: colors.red + "1a", borderColor: colors.red + "55" }]}>
                <AlertCircle size={14} color={colors.red} />
                <Text style={[styles.msgText, { color: colors.red }]}>{error}</Text>
              </View>
            )}
            {!!successMessage && (
              <View style={[styles.msg, { backgroundColor: colors.green + "1a", borderColor: colors.green + "55" }]}>
                <Text style={[styles.msgText, { color: colors.green }]}>{successMessage}</Text>
              </View>
            )}

            <View style={{ gap: 10 }}>
              {mode === "register" && (
                <Field icon={User} placeholder="Full name" value={name} onChangeText={setName}
                  autoCapitalize="words" returnKeyType="next" />
              )}
              <Field icon={Mail} placeholder="Email address" value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" />
              <Field
                icon={Lock}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={handleEmail}
                right={(
                  <Pressable onPress={() => setShowPw(!showPw)} hitSlop={8}>
                    {showPw ? <EyeOff size={16} color={colors.text2} /> : <Eye size={16} color={colors.text2} />}
                  </Pressable>
                )}
              />
              <Pressable onPress={handleForgotPassword} disabled={loading === "reset"} style={{ alignSelf: "flex-end" }}>
                <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "500" }}>
                  {loading === "reset" ? "Sending…" : "Forgot password?"}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleEmail}
                disabled={loading === "email"}
                style={({ pressed }) => [styles.primary, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}
              >
                {loading === "email" ? <ActivityIndicator color="#fff" size="small" /> : <Mail size={16} color="#fff" />}
                <Text style={styles.primaryText}>{mode === "register" ? "Create Account" : "Sign In with Email"}</Text>
              </Pressable>
            </View>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={{ color: colors.text3, fontSize: 12 }}>or continue with</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Pressable
              onPress={() => wrap("google", signInWithGoogle)}
              disabled={!!loading}
              style={({ pressed }) => [
                styles.oauth,
                { backgroundColor: colors.surface2, borderColor: colors.border2, opacity: pressed || (loading && loading !== "google") ? 0.7 : 1 },
              ]}
            >
              {loading === "google" ? <ActivityIndicator size="small" color={colors.text} /> : <GoogleIcon />}
              <Text style={[styles.oauthText, { color: colors.text }]}>Google</Text>
            </Pressable>

            <Text style={[styles.note, { color: colors.text3 }]}>Data syncs in real-time across all devices</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: "center", padding: 18 },
  themeBtn: { position: "absolute", top: 8, right: 16, padding: 6, zIndex: 2 },
  card: { borderWidth: 1, borderRadius: 18, padding: 22, gap: 14 },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  brandName: { fontSize: 26, fontWeight: "800" },
  sub: { textAlign: "center", fontSize: 14 },
  toggle: { flexDirection: "row", borderWidth: 1, borderRadius: 10, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 9, borderRadius: 7, alignItems: "center" },
  toggleText: { fontWeight: "600", fontSize: 14 },
  msg: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 8, padding: 10 },
  msgText: { fontSize: 13, flexShrink: 1 },
  field: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 48 },
  fieldInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  primary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 10, marginTop: 4 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  note: { textAlign: "center", fontSize: 12 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  dividerLine: { flex: 1, height: 1 },
  oauth: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 48, borderRadius: 10, borderWidth: 1 },
  oauthText: { fontWeight: "600", fontSize: 15 },
});
