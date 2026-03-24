// src/services/taskService.js
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot,
  serverTimestamp, orderBy, writeBatch, getDocs,
} from 'firebase/firestore'
import { db } from './firebase'

const COL = 'tasks'
const MAX_SUBTASK_TITLE = 120

const sanitizeSubtasks = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .map((s, idx) => ({
      id: String(s?.id || `subtask-${idx}-${Date.now()}`),
      title: String(s?.title || '').trim().slice(0, MAX_SUBTASK_TITLE),
      completed: Boolean(s?.completed),
    }))
    .filter((s) => s.title)
}

export const subscribeToTasks = (userId, categoryId, callback) => {
  const constraints = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  ]
  if (categoryId && categoryId !== 'all') {
    constraints.splice(1, 0, where('categoryId', '==', categoryId))
  }
  const q = query(collection(db, COL), ...constraints)
  return onSnapshot(q,
    (snap) => {
      const tasks = snap.docs.map((d) => ({
        id: d.id, ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
        dueDate: d.data().dueDate || null,
        subtasks: sanitizeSubtasks(d.data().subtasks),
      }))
      callback({ tasks, error: null })
    },
    (err) => callback({ tasks: [], error: err.message })
  )
}

export const addTask = async (data) => {
  try {
    const ref = await addDoc(collection(db, COL), {
      title:       data.title.trim(),
      description: (data.description || '').trim(),
      status:      data.status || 'pending',
      priority:    data.priority || 'medium',
      dueDate:     data.dueDate || null,
      categoryId:  data.categoryId || null,
      subtasks:    sanitizeSubtasks(data.subtasks),
      userId:      data.userId,
      createdAt:   serverTimestamp(),
    })
    return { id: ref.id, error: null }
  } catch (err) { return { id: null, error: err.message } }
}

export const updateTask = async (id, updates) => {
  try {
    const clean = { ...updates }
    if (clean.title) clean.title = clean.title.trim()
    if ('subtasks' in clean) clean.subtasks = sanitizeSubtasks(clean.subtasks)
    await updateDoc(doc(db, COL, id), clean)
    return { error: null }
  } catch (err) { return { error: err.message } }
}

export const deleteTask = async (id) => {
  try {
    await deleteDoc(doc(db, COL, id))
    return { error: null }
  } catch (err) { return { error: err.message } }
}

export const deleteTasksByCategory = async (userId, categoryId) => {
  try {
    const q = query(
      collection(db, COL),
      where('userId', '==', userId),
      where('categoryId', '==', categoryId)
    )
    const snap = await getDocs(q)
    const batch = writeBatch(db)
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    return { error: null }
  } catch (err) { return { error: err.message } }
}
