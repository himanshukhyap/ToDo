// src/services/authService.js
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, googleProvider } from './firebase'

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return { user: result.user, error: null }
  } catch (err) {
    return { user: null, error: err.message }
  }
}

export const logOut = async () => {
  try {
    await signOut(auth)
    return { error: null }
  } catch (err) {
    return { error: err.message }
  }
}

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback)
