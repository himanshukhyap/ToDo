import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Splash from "../../components/Splash";

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  if (loading) return <Splash />;
  if (!user) return <Redirect href="/login" />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(drawer)" />
      <Stack.Screen name="note/[id]" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="page/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="search" options={{ animation: "fade" }} />
    </Stack>
  );
}
