import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC3Rn95O_UhA7EggOWv-pm6417jwEdeyEY",
  authDomain: "todo-ec064.firebaseapp.com",
  projectId: "todo-ec064",
  storageBucket: "todo-ec064.firebasestorage.app",
  messagingSenderId: "547962875689",
  appId: "1:547962875689:web:ad5560e5a838736ff75138"
};

const app = initializeApp(firebaseConfig);

// ⚠️  NO offline persistence — ye delete/update errors hide karta tha
export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
