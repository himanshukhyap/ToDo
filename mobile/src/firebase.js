import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Same Firebase project as the web app — data stays in sync across web and Android.
const firebaseConfig = {
  apiKey: "AIzaSyC3Rn95O_UhA7EggOWv-pm6417jwEdeyEY",
  authDomain: "todo-ec064.firebaseapp.com",
  projectId: "todo-ec064",
  storageBucket: "todo-ec064.firebasestorage.app",
  messagingSenderId: "547962875689",
  appId: "1:547962875689:web:ad5560e5a838736ff75138",
};

const firstInit = getApps().length === 0;
const app = firstInit ? initializeApp(firebaseConfig) : getApp();

// Keeps the user signed in between app launches.
export const auth = firstInit
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

// IndexedDB is not available in React Native, so Firestore uses its in-memory cache:
// writes made offline are queued and synced automatically while the app stays open.
export const db = firstInit
  ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
  : getFirestore(app);
