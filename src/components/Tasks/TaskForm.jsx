import { useEffect, useState } from 'react'
import Modal from '../UI/Modal'

const blank = { title: '' }

export default function TaskForm({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    if (initialData) {
      setForm({ title: initialData.title || '' })
    } else {
      setForm(blank)
    }

    setErrors({})
  }, [open, initialData])

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const e = {}
    const title = form.title.trim()

    if (!title) e.title = 'Title is required'
    if (title.length > 120) e.title = 'Max 120 characters'

    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }

    setSaving(true)
    await onSubmit({ title: form.title })
    setSaving(false)
    onClose()
  }

  const inp = (key) =>
    `w-full h-10 text-sm px-3 rounded-md border ${
      errors[key]
        ? 'border-[#d13438] focus:ring-[#d13438]'
        : 'border-[#d2d0ce] dark:border-[#4a4847] focus:ring-[#0f6cbd]'
    } bg-[#ffffff] dark:bg-[#2a2a2a] text-[#323130] dark:text-[#f3f2f1] placeholder-[#8a8886] focus:outline-none focus:ring-2 transition-all`

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Edit task' : 'New task'}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[#605e5c] dark:text-[#a19f9d] mb-1.5">
            Task title
          </label>
          <input
            autoFocus
            value={form.title}
            onChange={field('title')}
            maxLength={120}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="What do you need to do?"
            className={inp('title')}
          />
          {errors.title && <p className="text-xs text-[#d13438] mt-1">{errors.title}</p>}
        </div>

        <div className="text-xs text-[#605e5c] dark:text-[#a19f9d]">Fast add mode: title only.</div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-md border border-[#d2d0ce] dark:border-[#4a4847] text-sm text-[#323130] dark:text-[#f3f2f1] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="h-10 flex-1 rounded-md bg-[#0f6cbd] hover:bg-[#115ea3] text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving
              </>
            ) : initialData ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
