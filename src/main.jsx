import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { initOfflineDB } from "./services/offlineService";

// Initialize offline database
initOfflineDB().catch(err => {
  console.warn('Failed to initialize offline DB:', err);
});

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        console.log('[Service Worker] Registered successfully');
      })
      .catch(err => {
        console.log('[Service Worker] Registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
