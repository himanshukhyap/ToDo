import { Pressable, StyleSheet, Text, View } from "react-native";
import { Drawer } from "expo-router/drawer";
import { router, useGlobalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Menu, Search } from "lucide-react-native";
import { useTheme } from "../../../context/ThemeContext";
import { useCategories } from "../../../hooks/useCategories";
import { useNotebooks } from "../../../hooks/useNotebook";
import Sidebar from "../../../components/Sidebar";
import OfflineBanner from "../../../components/OfflineBanner";
import { BrandIcon } from "../../../components/Splash";

/* Mobile top header — same as the web app's MobileHeader */
function AppHeader({ navigation, route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useGlobalSearchParams();
  const { categories } = useCategories();
  const { notebooks } = useNotebooks();

  const activeCat = categories.find((c) => c.id === params.category);
  const activeNb = notebooks.find((nb) => nb.id === params.id);
  const titles = {
    tasks: activeCat?.name || "Tasks",
    notes: "Notes",
    notebook: activeNb?.notebookName || "Notebook",
    trash: "Trash",
    admin: "Admin Panel",
  };

  return (
    <View style={{ backgroundColor: colors.surface, paddingTop: insets.top }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.openDrawer()} hitSlop={10} style={styles.menuBtn}>
          <Menu size={22} color={colors.text} />
        </Pressable>
        <BrandIcon size={28} />
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{titles[route.name] || "NoteTask"}</Text>
        <Pressable onPress={() => router.push("/search")} hitSlop={10} style={styles.menuBtn} accessibilityLabel="Search">
          <Search size={21} color={colors.text} />
        </Pressable>
      </View>
      <OfflineBanner />
    </View>
  );
}

export default function DrawerLayout() {
  const { colors } = useTheme();
  return (
    <Drawer
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{
        header: (props) => <AppHeader {...props} />,
        drawerType: "front",
        drawerStyle: { width: 290, backgroundColor: colors.sbBg },
        sceneStyle: { backgroundColor: colors.bg },
        swipeEdgeWidth: 40,
      }}
    >
      <Drawer.Screen name="tasks" />
      <Drawer.Screen name="notes" />
      <Drawer.Screen name="notebook" />
      <Drawer.Screen name="trash" />
      <Drawer.Screen name="admin" />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, height: 56, paddingHorizontal: 14, borderBottomWidth: 1 },
  menuBtn: { padding: 2 },
  title: { flex: 1, fontSize: 17, fontWeight: "700" },
});
