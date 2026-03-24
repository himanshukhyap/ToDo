// src/hooks/useCategories.js
import { useEffect, useState } from 'react'
import { subscribeToCategories } from '../services/categoryService'

export function useCategories(userId) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    if (!userId) { setCategories([]); setLoading(false); return }
    setLoading(true)
    const unsub = subscribeToCategories(userId, ({ categories: cats, error: err }) => {
      setCategories(cats); setError(err); setLoading(false)
    })
    return unsub
  }, [userId])

  return { categories, loading, error }
}
