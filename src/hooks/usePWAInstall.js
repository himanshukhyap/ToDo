import { useState, useEffect } from "react";

/**
 * usePWAInstall
 *
 * Captures the browser's native "beforeinstallprompt" event so we can
 * show our own install button rather than relying on the browser's
 * default mini-infobar (which appears inconsistently).
 *
 * Returns:
 *   isInstallable  — true when the browser is ready to show the install dialog
 *   isInstalled    — true when the app is already running as a standalone PWA
 *   promptInstall  — call this to trigger the native install dialog
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable,  setIsInstallable]  = useState(false);
  const [isInstalled,    setIsInstalled]    = useState(
    // True if already running as an installed PWA (standalone display mode)
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true  // iOS Safari
  );

  useEffect(() => {
    // Browser fires this when the PWA install criteria are met
    const onPrompt = (e) => {
      e.preventDefault();           // Stop automatic mini-infobar
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Fires after the user accepts the install dialog
    const onInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log("[PWA] App installed ✓");
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled",        onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled",        onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return { isInstallable, isInstalled, promptInstall };
}
