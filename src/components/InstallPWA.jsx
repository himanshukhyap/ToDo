import { usePWAInstall } from "../hooks/usePWAInstall";
import { Download, CheckCircle } from "lucide-react";

/**
 * InstallPWA
 *
 * Shows an "Install App" button in the sidebar footer when the browser
 * exposes the install prompt (Chrome, Edge, Samsung Internet, etc.).
 *
 * Hidden when:
 *  - Already installed (running in standalone mode)
 *  - Browser doesn't support the beforeinstallprompt API (Firefox, Safari)
 *  - App doesn't yet meet PWA installability criteria
 *
 * On iOS Safari: installation is manual (Share → Add to Home Screen).
 * You could detect iOS and show a tooltip instead — not done here for brevity.
 */
export default function InstallPWA() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  if (isInstalled) {
    return (
      <div className="pwa-installed-badge">
        <CheckCircle size={13} />
        <span>App installed</span>
      </div>
    );
  }

  if (!isInstallable) return null;

  return (
    <button className="pwa-install-btn" onClick={promptInstall} title="Install NoteTask as an app">
      <Download size={14} />
      <span>Install App</span>
    </button>
  );
}
