// src/hooks/useTasks.js
import { useEffect, useState, useMemo } from 'react'
import { subscribeToTasks } from '../services/taskService'

export function useTasks(userId, categoryId) {
  const [tasks, setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!userId) { setTasks([]); setLoading(false); return }
    setLoading(true)
    const unsub = subscribeToTasks(userId, categoryId, ({ tasks: t, error: err }) => {
      setTasks(t); setError(err); setLoading(false)
    })
    return unsub
  }, [userId, categoryId])

  const filteredTasks = useMemo(() => {
    let res = [...tasks]

    if (search.trim()) {
      const s = search.toLowerCase()
      res = res.filter((t) =>
        t.title.toLowerCase().includes(s) ||
        (t.description || '').toLowerCase().includes(s) ||
        (Array.isArray(t.subtasks) && t.subtasks.some((st) => (st.title || '').toLowerCase().includes(s)))
      )
    }
    return res
  }, [tasks, search])

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    return {
      total:      tasks.length,
      completed:  tasks.filter((t) => t.status === 'completed').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      pending:    tasks.filter((t) => t.status === 'pending').length,
      overdue:    tasks.filter((t) => {
        if (!t.dueDate || t.status === 'completed') return false
        const due = new Date(t.dueDate); due.setHours(0,0,0,0)
        return due < today
      }).length,
    }
  }, [tasks])

  return {
    tasks, filteredTasks, loading, error, stats,
    search, setSearch,
  }
}
