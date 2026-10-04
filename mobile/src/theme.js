// Mirrors the CSS variables in the web app's src/index.css
export const palettes = {
  dark: {
    bg: "#0f1117",
    surface: "#161922",
    surface2: "#1d2130",
    surface3: "#252a3d",
    border: "#252a3a",
    border2: "#323854",
    text: "#e2e8f0",
    text2: "#8892aa",
    text3: "#454f6a",
    accent: "#6366f1",
    accentH: "#818cf8",
    green: "#10b981",
    red: "#ef4444",
    orange: "#f59e0b",
    sbBg: "#12141c",
    overlay: "rgba(0,0,0,0.6)",
  },
  light: {
    bg: "#eef4fb",
    surface: "#ffffff",
    surface2: "#f8fbff",
    surface3: "#edf4fb",
    border: "#dbe6f3",
    border2: "#b9c9dd",
    text: "#122033",
    text2: "#4b5d73",
    text3: "#8ea0b8",
    accent: "#4f46e5",
    accentH: "#4338ca",
    green: "#059669",
    red: "#dc2626",
    orange: "#d97706",
    sbBg: "#f7fbff",
    overlay: "rgba(15,23,42,0.35)",
  },
};

export const radius = 10;
export const radiusSm = 7;

export const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b",
  "#10b981", "#06b6d4", "#3b82f6", "#84cc16", "#f97316",
];

export const NOTE_COLORS = [
  { bg: "#fef08a", text: "#713f12", label: "Yellow" },
  { bg: "#fdba74", text: "#7c2d12", label: "Orange" },
  { bg: "#f9a8d4", text: "#831843", label: "Pink" },
  { bg: "#86efac", text: "#14532d", label: "Green" },
  { bg: "#93c5fd", text: "#1e3a5f", label: "Blue" },
  { bg: "#c4b5fd", text: "#4c1d95", label: "Violet" },
  { bg: "#f87171", text: "#7f1d1d", label: "Red" },
  { bg: "#67e8f9", text: "#164e63", label: "Cyan" },
  { bg: "#d9f99d", text: "#365314", label: "Lime" },
  { bg: "#e2e8f0", text: "#1e293b", label: "White" },
  { bg: "#334155", text: "#e2e8f0", label: "Slate" },
  { bg: "#1e1b4b", text: "#c7d2fe", label: "Indigo" },
];

export function getNoteColor(bg) {
  return NOTE_COLORS.find((c) => c.bg === bg) || NOTE_COLORS[10];
}
