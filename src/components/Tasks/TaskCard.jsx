import { useState } from 'react'
import { updateTask, deleteTask } from '../../services/taskService'
import toast from 'react-hot-toast'

const statusCfg = {
  pending: {
    label: 'Pending',
    badge: 'bg-[#f3f2f1] text-[#605e5c] dark:bg-[#323130] dark:text-[#c8c6c4]',
  },
  'in-progress': {
    label: 'In progress',
    badge: 'bg-[#deecf9] text-[#0f548c] dark:bg-[#203647] dark:text-[#8ec8ff]',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-[#dff6dd] text-[#0e700e] dark:bg-[#1f3d1f] dark:text-[#7fd67f]',
  },
}

const makeSubtaskId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function TaskCard({ task, onEdit, categories, dragHandleProps }) {
  const [deleting, setDeleting] = useState(false)
  const [savingSubtasks, setSavingSubtasks] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [showSubtasks, setShowSubtasks] = useState(false)

  const sc = statusCfg[task.status] || statusCfg.pending
  const cat = categories.find((c) => c.id === task.categoryId)
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : []

  const toggleDone = async () => {
    const next = task.status === 'completed' ? 'pending' : 'completed'
    const { error } = await updateTask(task.id, { status: next })
    if (error) toast.error('Update failed')
  }

  const copyTaskToClipboard = async () => {
    const subtaskLines = subtasks.map((s) => `- [${s.completed ? 'x' : ' '}] ${s.title}`)
    const taskText = [task.title, subtaskLines.length ? '' : null, ...subtaskLines].filter(Boolean).join('\n')

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(taskText)
      } else {
        const ta = document.createElement('textarea')
        ta.value = taskText
        ta.setAttribute('readonly', '')
        ta.style.position = 'absolute'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Could not copy task')
    }
  }

  const remove = async () => {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    setDeleting(true)
    const { error } = await deleteTask(task.id)
    if (error) toast.error('Delete failed')
    else toast.success('Task deleted')
    setDeleting(false)
  }

  const saveSubtasks = async (nextSubtasks) => {
    setSavingSubtasks(true)
    const { error } = await updateTask(task.id, { subtasks: nextSubtasks })
    setSavingSubtasks(false)

    if (error) {
      toast.error('Failed to update subtasks')
      return false
    }

    return true
  }

  const addSubtask = async () => {
    const title = subtaskTitle.trim()
    if (!title) return

    if (title.length > 120) {
      toast.error('Subtask title is too long')
      return
    }

    const nextSubtasks = [...subtasks, { id: makeSubtaskId(), title, completed: false }]
    const ok = await saveSubtasks(nextSubtasks)
    if (ok) setSubtaskTitle('')
  }

  const toggleSubtask = async (subtaskId) => {
    const nextSubtasks = subtasks.map((subtask) => (
      subtask.id === subtaskId
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    ))
    await saveSubtasks(nextSubtasks)
  }

  const removeSubtask = async (subtaskId) => {
    const nextSubtasks = subtasks.filter((subtask) => subtask.id !== subtaskId)
    await saveSubtasks(nextSubtasks)
  }

  const completedSubtasks = subtasks.filter((subtask) => subtask.completed).length

  return (
    <div
      className={`group rounded-xl border transition-all ${
        task.status === 'completed'
          ? 'border-[#d2d0ce] dark:border-[#4a4847] bg-[#faf9f8] dark:bg-[#252423] opacity-80'
          : 'border-[#e1dfdd] dark:border-[#3b3a39] bg-[#ffffff] dark:bg-[#2a2a2a] hover:border-[#c7e0f4] dark:hover:border-[#2f4a5d]'
      }`}
    >
      <div className="p-3 sm:p-3.5 flex items-start gap-2.5">
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="mt-0.5 text-[#a19f9d] dark:text-[#8a8886] hover:text-[#605e5c] cursor-grab active:cursor-grabbing flex-shrink-0"
            aria-label="Drag"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="9" cy="6" r="1.4" />
              <circle cx="15" cy="6" r="1.4" />
              <circle cx="9" cy="12" r="1.4" />
              <circle cx="15" cy="12" r="1.4" />
              <circle cx="9" cy="18" r="1.4" />
              <circle cx="15" cy="18" r="1.4" />
            </svg>
          </div>
        )}

        <button
          onClick={toggleDone}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            task.status === 'completed'
              ? 'bg-[#107c10] border-[#107c10]'
              : 'border-[#8a8886] dark:border-[#a19f9d] hover:border-[#0f6cbd]'
          }`}
          aria-label="Toggle task done"
        >
          {task.status === 'completed' && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <h3
              className={`text-sm sm:text-[15px] font-semibold leading-snug ${
                task.status === 'completed'
                  ? 'line-through text-[#8a8886] dark:text-[#a19f9d]'
                  : 'text-[#201f1e] dark:text-[#f3f2f1]'
              }`}
            >
              {task.title}
            </h3>

            <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                onClick={copyTaskToClipboard}
                className="h-8 px-2 rounded-md text-xs border border-[#d2d0ce] dark:border-[#4a4847] text-[#605e5c] dark:text-[#c8c6c4] hover:bg-black/5 dark:hover:bg-white/10"
                title="Copy to clipboard"
              >
                Copy
              </button>
              <button
                onClick={() => setShowSubtasks((v) => !v)}
                className="h-8 px-2 rounded-md text-xs border border-[#d2d0ce] dark:border-[#4a4847] text-[#605e5c] dark:text-[#c8c6c4] hover:bg-black/5 dark:hover:bg-white/10"
                title="Show subtasks"
              >
                {showSubtasks ? 'Hide subtasks' : 'Subtasks'}
              </button>
              <button
                onClick={() => onEdit(task)}
                className="h-8 px-2 rounded-md text-xs border border-[#d2d0ce] dark:border-[#4a4847] text-[#605e5c] dark:text-[#c8c6c4] hover:bg-black/5 dark:hover:bg-white/10"
                title="Edit task"
              >
                Edit
              </button>
              <button
                onClick={remove}
                disabled={deleting}
                className="h-8 px-2 rounded-md text-xs border border-[#f1b3b8] dark:border-[#63333a] text-[#a4262c] dark:text-[#ff99a4] hover:bg-[#fde7e9] dark:hover:bg-[#3b1f22]"
                title="Delete task"
              >
                {deleting ? '...' : 'Delete'}
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${sc.badge}`}>
              {sc.label}
            </span>
            {cat && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-[#f3f2f1] text-[#605e5c] dark:bg-[#323130] dark:text-[#c8c6c4]">
                {cat.name}
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-[#f3f2f1] text-[#605e5c] dark:bg-[#323130] dark:text-[#c8c6c4]">
              {completedSubtasks}/{subtasks.length} subtasks
            </span>
          </div>

          {showSubtasks && (
            <div className="mt-3 rounded-lg border border-[#e1dfdd] dark:border-[#3b3a39] bg-[#faf9f8] dark:bg-[#252423] p-2.5">
            {subtasks.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-start sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSubtask(subtask.id)}
                      disabled={savingSubtasks}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        subtask.completed
                          ? 'border-[#107c10] bg-[#107c10] text-white'
                          : 'border-[#8a8886] dark:border-[#a19f9d] hover:border-[#0f6cbd]'
                      }`}
                      aria-label="Toggle subtask"
                    >
                      {subtask.completed && (
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <span className={`text-xs flex-1 ${subtask.completed ? 'line-through text-[#8a8886]' : 'text-[#323130] dark:text-[#f3f2f1]'}`}>
                      {subtask.title}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeSubtask(subtask.id)}
                      disabled={savingSubtasks}
                      className="text-[11px] px-2 py-0.5 rounded text-[#a4262c] dark:text-[#ff99a4] hover:bg-[#fde7e9] dark:hover:bg-[#3b1f22]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                placeholder="Add subtask"
                className="flex-1 h-9 px-3 rounded-md border border-[#d2d0ce] dark:border-[#4a4847] bg-[#ffffff] dark:bg-[#2a2a2a] text-sm text-[#323130] dark:text-[#f3f2f1] focus:outline-none focus:ring-2 focus:ring-[#0f6cbd]"
              />
              <button
                type="button"
                onClick={addSubtask}
                disabled={savingSubtasks}
                className="h-9 px-3 rounded-md bg-[#0f6cbd] hover:bg-[#115ea3] text-white text-sm font-medium transition-colors disabled:opacity-60"
              >
                Add
              </button>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
