import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle, Info } from "lucide-react-native";
import { useTheme } from "./ThemeContext";

/**
 * Native replacement for the web app's utils/swal.js —
 * same function names: confirmDelete, confirmBulkDelete, confirmLogout, toast, errorAlert.
 */
const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [dialog, setDialog] = useState(null);
  const [toastState, setToastState] = useState(null);
  const toastTimer = useRef(null);

  const ask = useCallback((opts) => new Promise((resolve) => {
    setDialog({ ...opts, resolve });
  }), []);

  const close = (value) => {
    dialog?.resolve(value);
    setDialog(null);
  };

  const confirmDelete = useCallback((itemName = "this item") => ask({
    icon: "warning",
    title: "Delete?",
    message: `Are you sure you want to delete ${itemName}?`,
    note: "This cannot be undone.",
    confirmText: "Yes, delete",
    cancelText: "Cancel",
    danger: true,
  }), [ask]);

  const confirmBulkDelete = useCallback((itemName = "items", count = 0) => ask({
    icon: "warning",
    title: "Delete all?",
    message: `Are you sure you want to delete all ${count} ${itemName}?`,
    note: "This cannot be undone.",
    confirmText: "Yes, delete all",
    cancelText: "Cancel",
    danger: true,
  }), [ask]);

  const confirmLogout = useCallback(() => ask({
    icon: "question",
    title: "Sign out?",
    message: "You'll be signed out of NoteTask.",
    confirmText: "Yes, sign out",
    cancelText: "Stay",
  }), [ask]);

  const confirmDiscard = useCallback(() => ask({
    icon: "warning",
    title: "Discard changes?",
    message: "Your note has not been saved.",
    confirmText: "Discard",
    cancelText: "Keep editing",
    danger: true,
  }), [ask]);

  const errorAlert = useCallback((message) => ask({
    icon: "error",
    title: "Error",
    message,
    confirmText: "OK",
  }), [ask]);

  const toast = useCallback((type, title) => {
    clearTimeout(toastTimer.current);
    setToastState({ type, title });
    toastTimer.current = setTimeout(() => setToastState(null), 2500);
  }, []);

  const iconFor = (kind, size = 34) => {
    switch (kind) {
      case "warning": return <AlertTriangle size={size} color={colors.orange} />;
      case "error": return <AlertCircle size={size} color={colors.red} />;
      case "question": return <HelpCircle size={size} color={colors.accent} />;
      case "success": return <CheckCircle2 size={size} color={colors.green} />;
      default: return <Info size={size} color={colors.accent} />;
    }
  };

  return (
    <DialogContext.Provider value={{ confirmDelete, confirmBulkDelete, confirmLogout, confirmDiscard, errorAlert, toast }}>
      {children}

      {toastState && (
        <View pointerEvents="none" style={[styles.toastWrap, { top: insets.top + 10 }]}>
          <View style={[styles.toast, { backgroundColor: colors.surface2, borderColor: colors.border2 }]}>
            {iconFor(toastState.type, 18)}
            <Text style={[styles.toastText, { color: colors.text }]} numberOfLines={2}>{toastState.title}</Text>
          </View>
        </View>
      )}

      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => close(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => close(false)}>
          <Pressable style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.iconRow}>{iconFor(dialog?.icon)}</View>
            <Text style={[styles.title, { color: colors.text }]}>{dialog?.title}</Text>
            {!!dialog?.message && (
              <Text style={[styles.message, { color: colors.text }]}>{dialog.message}</Text>
            )}
            {!!dialog?.note && (
              <Text style={[styles.note, { color: colors.text2 }]}>{dialog.note}</Text>
            )}
            <View style={styles.btnRow}>
              {!!dialog?.cancelText && (
                <Pressable
                  style={[styles.btn, { backgroundColor: "#6b7280" }]}
                  onPress={() => close(false)}
                >
                  <Text style={styles.btnText}>{dialog.cancelText}</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.btn, { backgroundColor: dialog?.danger ? colors.red : "#6366f1" }]}
                onPress={() => close(true)}
              >
                <Text style={styles.btnText}>{dialog?.confirmText || "OK"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

export const useDialogs = () => useContext(DialogContext);

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 380, borderRadius: 16, borderWidth: 1, padding: 22 },
  iconRow: { alignItems: "center", marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  message: { fontSize: 15, textAlign: "center", lineHeight: 21 },
  note: { fontSize: 13, textAlign: "center", marginTop: 6 },
  btnRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 20 },
  btn: { paddingVertical: 11, paddingHorizontal: 18, borderRadius: 8, minWidth: 100, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  toastWrap: { position: "absolute", left: 16, right: 16, alignItems: "center", zIndex: 1000, elevation: 20 },
  toast: {
    flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16, maxWidth: 420,
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  toastText: { fontSize: 14, fontWeight: "500", flexShrink: 1 },
});
