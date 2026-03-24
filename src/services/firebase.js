// src/services/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

// Vite exposes env vars via import.meta.env (must be prefixed VITE_)
const firebaseConfig = {
  apiKey: "AIzaSyC3Rn95O_UhA7EggOWv-pm6417jwEdeyEY",
  authDomain: "todo-ec064.firebaseapp.com",
  projectId: "todo-ec064",
  storageBucket: "todo-ec064.firebasestorage.app",
  messagingSenderId: "547962875689",
  appId: "1:547962875689:web:ad5560e5a838736ff75138"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export const db = getFirestore(app)

// Offline persistence (graceful fallback)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('[Firestore] Persistence failed: multiple tabs open')
  } else if (err.code === 'unimplemented') {
    console.warn('[Firestore] Persistence not supported in this browser')
  }
})

export default app
