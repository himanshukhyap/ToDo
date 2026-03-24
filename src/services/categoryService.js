// src/services/categoryService.js
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot,
  serverTimestamp, orderBy,
} from 'firebase/firestore'
import { db } from './firebase'

const COL = 'categories'

export const subscribeToCategories = (userId, callback) => {
  const q = query(
    collection(db, COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q,
    (snap) => {
      const categories = snap.docs.map((d) => ({
        id: d.id, ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
      }))
      callback({ categories, error: null })
    },
    (err) => callback({ categories: [], error: err.message })
  )
}

export const addCategory = async ({ name, userId }) => {
  try {
    const ref = await addDoc(collection(db, COL), {
      name: name.trim(), userId, createdAt: serverTimestamp(),
    })
    return { id: ref.id, error: null }
  } catch (err) { return { id: null, error: err.message } }
}

export const updateCategory = async (id, { name }) => {
  try {
    await updateDoc(doc(db, COL, id), { name: name.trim() })
    return { error: null }
  } catch (err) { return { error: err.message } }
}

export const deleteCategory = async (id) => {
  try {
    await deleteDoc(doc(db, COL, id))
    return { error: null }
  } catch (err) { return { error: err.message } }
}
