import { initializeApp } from "firebase/app";
import {
  getFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
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

// Initialize Firestore with unlimited cache size for offline support
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

// Enable offline persistence — data available even without internet
// Safe to use now because all queries include where("uid","==",uid) filter
enableIndexedDbPersistence(db, { forceOwnership: false })
  .then(() => {
    console.log("[Firebase] Offline persistence enabled ✓");
  })
  .catch((err) => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open — persistence only works in one tab at a time
      console.warn("[Firebase] Offline persistence unavailable — multiple tabs open");
    } else if (err.code === "unimplemented") {
      // Browser doesn't support IndexedDB
      console.warn("[Firebase] Offline persistence not supported by this browser");
    }
  });

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
