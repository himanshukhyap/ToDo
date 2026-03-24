import { useMemo, useState } from 'react'
import { addTask, updateTask } from '../../services/taskService'
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'
import TaskFilters from './TaskFilters'
import Loading from '../UI/Loading'
import toast from 'react-hot-toast'

function EmptyState({ hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-12 w-12 rounded-xl bg-[#deecf9] dark:bg-[#203647] flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-[#0f6cbd] dark:text-[#8ec8ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[#201f1e] dark:text-[#f3f2f1] mb-1">
        {hasFilters ? 'No tasks found' : 'No tasks yet'}
      </h3>
      <p className="text-sm text-[#605e5c] dark:text-[#a19f9d] max-w-sm">
        {hasFilters ? 'Try a different search keyword.' : 'Use the add task field above to create your first task.'}
      </p>
    </div>
  )
}

function Section({ title, count, emptyText, children }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#201f1e] dark:text-[#f3f2f1]">{title}</h3>
        <span className="text-xs text-[#605e5c] dark:text-[#a19f9d]">{count}</span>
      </div>
      {count === 0 ? (
        <div className="rounded-lg border border-dashed border-[#d2d0ce] dark:border-[#4a4847] p-3 text-xs text-[#8a8886] dark:text-[#a19f9d]">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  )
}

export default function TaskList({ user, tasks, filteredTasks, loading, categories, selectedCategory, filterProps }) {
  const [showEditForm, setShowEditForm] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [quickTitle, setQuickTitle] = useState('')
  const [addingQuick, setAddingQuick] = useState(false)

  const hasFilters = filterProps.search.trim().length > 0
  const catName = categories.find((c) => c.id === selectedCategory)?.name

  const { pendingTasks, completedTasks } = useMemo(() => {
    const pending = filteredTasks.filter((t) => t.status !== 'completed')
    const completed = filteredTasks.filter((t) => t.status === 'completed')
    return { pendingTasks: pending, completedTasks: completed }
  }, [filteredTasks])

  const openEdit = (t) => {
    setEditTask(t)
    setShowEditForm(true)
  }

  const closeEditForm = () => {
    setShowEditForm(false)
    setEditTask(null)
  }

  const handleQuickAdd = async () => {
    const title = quickTitle.trim()
    if (!title) return

    setAddingQuick(true)
    const { error } = await addTask({
      title,
      userId: user.uid,
      categoryId: selectedCategory !== 'all' ? selectedCategory : null,
    })
    setAddingQuick(false)

    if (error) {
      toast.error('Failed to create task')
      return
    }

    setQuickTitle('')
    toast.success('Task added')
  }

  const handleEdit = async (form) => {
    const { error } = await updateTask(editTask.id, form)
    if (error) toast.error('Failed to update task')
    else toast.success('Task updated')
  }

  const totalVisible = filteredTasks.length

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[22px] leading-tight font-semibold text-[#201f1e] dark:text-[#f3f2f1]">
            {selectedCategory === 'all' ? 'Tasks' : catName || 'Tasks'}
          </h2>
          <p className="text-xs text-[#605e5c] dark:text-[#a19f9d] mt-1">
            {tasks.length} total | {totalVisible} visible
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
          placeholder="Add a task"
          className="flex-1 h-10 px-3 rounded-lg border border-[#d2d0ce] dark:border-[#4a4847] bg-[#ffffff] dark:bg-[#2a2a2a] text-sm text-[#323130] dark:text-[#f3f2f1] placeholder-[#8a8886] focus:outline-none focus:ring-2 focus:ring-[#0f6cbd]"
        />
        <button
          onClick={handleQuickAdd}
          disabled={addingQuick || !quickTitle.trim()}
          className="h-10 w-10 rounded-lg bg-[#0f6cbd] hover:bg-[#115ea3] disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
          aria-label="Add task"
          title="Add task"
        >
          {addingQuick ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
            </svg>
          )}
        </button>
      </div>

      <div className="mb-4">
        <TaskFilters {...filterProps} />
      </div>

      {loading ? (
        <Loading message="Loading tasks..." />
      ) : totalVisible === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <div className="space-y-5 pb-6">
          <Section title="Pending" count={pendingTasks.length} emptyText="No pending tasks.">
            {pendingTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                categories={categories}
                onEdit={openEdit}
              />
            ))}
          </Section>

          <Section title="Completed" count={completedTasks.length} emptyText="No completed tasks yet.">
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                categories={categories}
                onEdit={openEdit}
              />
            ))}
          </Section>
        </div>
      )}

      <TaskForm
        open={showEditForm}
        onClose={closeEditForm}
        onSubmit={handleEdit}
        initialData={editTask}
      />
    </div>
  )
}
