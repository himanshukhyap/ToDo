import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

/**
 * Register the Vite PWA service worker.
 * - onOfflineReady  → fires once the app shell is fully cached (app works offline)
 * - onNeedRefresh   → autoUpdate: true in vite.config handles this automatically
 * - onRegisterError → logs any SW registration failures to console
 */
registerSW({
  onOfflineReady() {
    console.log("[PWA] App is ready to work fully offline ✓");
  },
  onRegisterError(err) {
    console.error("[PWA] Service worker registration failed:", err);
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
