import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export function BrandIcon({ size = 44 }) {
  return (
    <View style={[styles.brand, { width: size, height: size, borderRadius: size * 0.27 }]}>
      <Text style={[styles.brandText, { fontSize: size * 0.38 }]}>NT</Text>
    </View>
  );
}

export default function Splash() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <BrandIcon size={64} />
      <ActivityIndicator color={colors.accent} style={{ marginTop: 22 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  brand: { backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center" },
  brandText: { color: "#fff", fontWeight: "800", letterSpacing: 0.5 },
});
