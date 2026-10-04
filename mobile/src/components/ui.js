import { ActivityIndicator, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Search, X } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { radius, radiusSm } from "../theme";

export function Btn({ title, icon, onPress, variant = "primary", disabled, small, style, loading }) {
  const { colors } = useTheme();
  const bg = {
    primary: colors.accent,
    ghost: colors.surface2,
    danger: colors.red,
    green: colors.green,
  }[variant];
  const fg = variant === "ghost" ? colors.text : "#fff";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSm,
        { backgroundColor: bg, borderColor: variant === "ghost" ? colors.border2 : bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon}
      {!!title && <Text style={[styles.btnText, small && { fontSize: 13 }, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function IconBtn({ children, onPress, size = 34, style, disabled, hitSlop = 6 }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Badge({ value, small }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, small && styles.badgeSm, { backgroundColor: colors.surface3 }]}>
      <Text style={[styles.badgeText, small && { fontSize: 10 }, { color: colors.text2 }]}>{value}</Text>
    </View>
  );
}

export function Input({ style, ...props }) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.text3}
      style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text }, style]}
      {...props}
    />
  );
}

export function SearchBar({ value, onChangeText, placeholder }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.search, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      <Search size={15} color={colors.text3} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        style={[styles.searchInput, { color: colors.text }]}
      />
      {!!value && (
        <IconBtn size={24} onPress={() => onChangeText("")}><X size={14} color={colors.text2} /></IconBtn>
      )}
    </View>
  );
}

export function EmptyState({ icon, text, sub }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      {icon}
      <Text style={[styles.emptyText, { color: colors.text2 }]}>{text}</Text>
      {!!sub && <Text style={[styles.emptySub, { color: colors.text3 }]}>{sub}</Text>}
    </View>
  );
}

export function Loading({ text }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.accent} />
      {!!text && <Text style={[styles.emptyText, { color: colors.text2 }]}>{text}</Text>}
    </View>
  );
}

export function ErrorBanner({ text }) {
  const { colors } = useTheme();
  if (!text) return null;
  return (
    <View style={[styles.errBanner, { borderColor: colors.red + "55", backgroundColor: colors.red + "18" }]}>
      <Text style={{ color: colors.red, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

export function ColorDots({ colors: list, value, onChange, size = 24 }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dots}>
      {list.map((c) => (
        <Pressable
          key={c}
          onPress={() => onChange(c)}
          hitSlop={4}
          style={[
            { width: size, height: size, borderRadius: size / 2, backgroundColor: c, alignItems: "center", justifyContent: "center" },
            value === c && { borderWidth: 2, borderColor: colors.text },
          ]}
        >
          {value === c && <Check size={size * 0.55} color="#fff" />}
        </Pressable>
      ))}
    </View>
  );
}

/** Bottom sheet style modal */
export function Sheet({ visible, onClose, title, icon, children, scroll = true }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={[styles.sheetOverlay, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
          <View style={[styles.sheetHead, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {icon}
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
            </View>
            <IconBtn onPress={onClose}><X size={20} color={colors.text2} /></IconBtn>
          </View>
          <Body keyboardShouldPersistTaps="handled" style={scroll ? { flexGrow: 0 } : undefined} contentContainerStyle={scroll ? { padding: 16 } : undefined}>
            {children}
          </Body>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ProgressBar({ value, color, height = 4 }) {
  const { colors } = useTheme();
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.surface3, overflow: "hidden" }}>
      <View style={{ height, width: `${Math.round(value * 100)}%`, backgroundColor: color || colors.accent }} />
    </View>
  );
}

export function Checkbox({ checked, onPress, label }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.checkRow} hitSlop={4}>
      <View style={[styles.checkBox, { borderColor: checked ? colors.accent : colors.border2, backgroundColor: checked ? colors.accent : "transparent" }]}>
        {checked && <Check size={13} color="#fff" />}
      </View>
      {!!label && <Text style={{ color: colors.text, fontSize: 14, flexShrink: 1 }}>{label}</Text>}
    </Pressable>
  );
}

export function formatDate(ts, withTime = false) {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  const opts = withTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" };
  try {
    return d.toLocaleString("en-IN", opts);
  } catch {
    return d.toDateString();
  }
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: radiusSm, borderWidth: 1,
  },
  btnSm: { paddingVertical: 7, paddingHorizontal: 10 },
  btnText: { fontSize: 14, fontWeight: "600" },
  badge: { minWidth: 22, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 11, alignItems: "center" },
  badgeSm: { minWidth: 18, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: radiusSm, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
  search: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: radius, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 24, gap: 10 },
  emptyText: { fontSize: 14, textAlign: "center" },
  emptySub: { fontSize: 12, textAlign: "center" },
  errBanner: { borderWidth: 1, borderRadius: radiusSm, padding: 10, marginBottom: 10 },
  dots: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sheetOverlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { maxHeight: "85%", borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, borderBottomWidth: 0 },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  checkBox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, alignItems: "center", justifyContent: "center" },
});
