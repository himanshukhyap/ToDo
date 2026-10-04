import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import { palettes } from "../theme";

const ThemeContext = createContext(null);
const STORAGE_KEY = "nt-theme";

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [saved, setSaved] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => { if (v === "light" || v === "dark") setSaved(v); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const theme = saved || (system === "light" ? "light" : "dark");
  const colors = palettes[theme];

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, [colors.bg]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setSaved(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, toggle, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
