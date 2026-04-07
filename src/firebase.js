import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC3Rn95O_UhA7EggOWv-pm6417jwEdeyEY",
  authDomain: "todo-ec064.firebaseapp.com",
  projectId: "todo-ec064",
  storageBucket: "todo-ec064.firebasestorage.app",
  messagingSenderId: "547962875689",
  appId: "1:547962875689:web:ad5560e5a838736ff75138",
};

const app = initializeApp(firebaseConfig);

/**
 * Initialize Firestore with persistent local cache.
 *
 * Replaces the deprecated enableIndexedDbPersistence() API.
 * persistentMultipleTabManager() lets offline work across multiple
 * tabs simultaneously — old API only allowed one tab at a time.
 *
 * All writes made offline are queued in IndexedDB and automatically
 * synced to the server the moment connectivity is restored.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

console.log("[Firebase] Offline persistence enabled ✓ (IndexedDB, multi-tab)");

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
