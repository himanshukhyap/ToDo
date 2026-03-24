import { useState } from 'react'
import { addCategory, updateCategory, deleteCategory } from '../../services/categoryService'
import { deleteTasksByCategory } from '../../services/taskService'
import toast from 'react-hot-toast'

const COLORS = ['bg-[#0f6cbd]', 'bg-[#107c10]', 'bg-[#8764b8]', 'bg-[#c19c00]', 'bg-[#d13438]', 'bg-[#038387]']
const catColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length]

export default function Sidebar({ user, categories, selected, onSelect, open, onClose, stats }) {
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [newName, setNewName] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const doAdd = async () => {
    if (!newName.trim()) return
    const { error } = await addCategory({ name: newName, userId: user.uid })
    if (error) toast.error('Failed to add category')
    else {
      toast.success('Category added')
      setNewName('')
      setShowAdd(false)
    }
  }

  const doUpdate = async (id) => {
    if (!editName.trim()) return
    const { error } = await updateCategory(id, { name: editName })
    if (error) toast.error('Update failed')
    else {
      toast.success('Category updated')
      setEditId(null)
    }
  }

  const doDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and all its tasks?`)) return
    setDeleting(id)
    await deleteTasksByCategory(user.uid, id)
    const { error } = await deleteCategory(id)
    if (error) toast.error('Delete failed')
    else {
      toast.success('Category deleted')
      if (selected === id) onSelect('all')
    }
    setDeleting(null)
  }

  const navItemClass = (active) =>
    `w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-[#deecf9] text-[#0f548c] dark:bg-[#203647] dark:text-[#8ec8ff]'
        : 'text-[#323130] dark:text-[#f3f2f1] hover:bg-black/5 dark:hover:bg-white/10'
    }`

  const content = (
    <aside className="h-full flex flex-col w-[280px] bg-[#faf9f8] dark:bg-[#252423] border-r border-[#e1dfdd] dark:border-[#3b3a39]">
      <div className="p-3 border-b border-[#e1dfdd] dark:border-[#3b3a39]">
        <div className="flex items-center gap-2.5">
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=0f6cbd&color=fff`}
            alt={user.displayName}
            className="h-9 w-9 rounded-full"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#201f1e] dark:text-[#f3f2f1] truncate">{user.displayName || 'User'}</p>
            <p className="text-xs text-[#605e5c] dark:text-[#a19f9d] truncate">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <button onClick={() => { onSelect('all'); onClose?.() }} className={navItemClass(selected === 'all')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="flex-1">All tasks</span>
          <span className="text-xs text-[#605e5c] dark:text-[#a19f9d]">{stats.total}</span>
        </button>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-[#e1dfdd] dark:border-[#3b3a39] bg-[#ffffff] dark:bg-[#2a2a2a] px-2 py-1.5">
            <p className="text-[11px] text-[#605e5c] dark:text-[#a19f9d]">Done</p>
            <p className="text-sm font-semibold text-[#107c10] dark:text-[#7fd67f]">{stats.completed}</p>
          </div>
          <div className="rounded-lg border border-[#e1dfdd] dark:border-[#3b3a39] bg-[#ffffff] dark:bg-[#2a2a2a] px-2 py-1.5">
            <p className="text-[11px] text-[#605e5c] dark:text-[#a19f9d]">Active</p>
            <p className="text-sm font-semibold text-[#0f6cbd] dark:text-[#8ec8ff]">{stats.inProgress + stats.pending}</p>
          </div>
          <div className="rounded-lg border border-[#e1dfdd] dark:border-[#3b3a39] bg-[#ffffff] dark:bg-[#2a2a2a] px-2 py-1.5">
            <p className="text-[11px] text-[#605e5c] dark:text-[#a19f9d]">Overdue</p>
            <p className="text-sm font-semibold text-[#a4262c] dark:text-[#ff99a4]">{stats.overdue}</p>
          </div>
        </div>
      </div>

      <div className="px-3 pb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-[#605e5c] dark:text-[#a19f9d]">Lists</p>
        <button
          onClick={() => setShowAdd(true)}
          className="h-7 w-7 rounded-md bg-[#0f6cbd] text-white hover:bg-[#115ea3] transition-colors"
          title="Add list"
        >
          <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {showAdd && (
          <div className="flex gap-1.5 pb-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') doAdd()
                if (e.key === 'Escape') {
                  setShowAdd(false)
                  setNewName('')
                }
              }}
              placeholder="New list"
              maxLength={50}
              className="flex-1 h-9 px-3 rounded-md border border-[#c8c6c4] dark:border-[#605e5c] bg-[#ffffff] dark:bg-[#2a2a2a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0f6cbd]"
            />
            <button onClick={doAdd} className="px-3 h-9 rounded-md bg-[#0f6cbd] text-white text-sm hover:bg-[#115ea3]">Add</button>
          </div>
        )}

        {categories.length === 0 && !showAdd && (
          <p className="text-xs text-[#605e5c] dark:text-[#a19f9d] px-2 py-2">No lists yet. Create one.</p>
        )}

        {categories.map((cat) => (
          <div key={cat.id} className="group">
            {editId === cat.id ? (
              <div className="flex gap-1.5 py-1">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') doUpdate(cat.id)
                    if (e.key === 'Escape') setEditId(null)
                  }}
                  maxLength={50}
                  className="flex-1 h-9 px-3 rounded-md border border-[#c8c6c4] dark:border-[#605e5c] bg-[#ffffff] dark:bg-[#2a2a2a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0f6cbd]"
                />
                <button onClick={() => doUpdate(cat.id)} className="px-2.5 h-9 rounded-md bg-[#0f6cbd] text-white text-sm">OK</button>
              </div>
            ) : (
              <button onClick={() => { onSelect(cat.id); onClose?.() }} className={navItemClass(selected === cat.id)}>
                <span className={`w-2.5 h-2.5 rounded-full ${catColor(cat.name)} flex-shrink-0`} />
                <span className="flex-1 truncate">{cat.name}</span>
                <div className="hidden sm:flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span
                    onClick={(e) => { e.stopPropagation(); setEditId(cat.id); setEditName(cat.name) }}
                    className="px-1.5 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-xs"
                  >
                    Edit
                  </span>
                  <span
                    onClick={(e) => { e.stopPropagation(); doDelete(cat.id, cat.name) }}
                    className="px-1.5 py-0.5 rounded text-xs text-[#a4262c] hover:bg-[#fde7e9] dark:text-[#ff99a4] dark:hover:bg-[#3b1f22]"
                  >
                    {deleting === cat.id ? '...' : 'Delete'}
                  </span>
                </div>
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  )

  return (
    <>
      <div className="hidden lg:flex lg:flex-col h-full">{content}</div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <div className="relative animate-slide-in">{content}</div>
        </div>
      )}
    </>
  )
}
