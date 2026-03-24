import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import TaskList from '../Tasks/TaskList'
import { useCategories } from '../../hooks/useCategories'
import { useTasks } from '../../hooks/useTasks'

export default function AppLayout({ user }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { categories, loading: catsLoading } = useCategories(user.uid)

  const {
    tasks,
    filteredTasks,
    loading: tasksLoading,
    search,
    setSearch,
  } = useTasks(user.uid, selectedCategory)

  const { stats: allStats } = useTasks(user.uid, 'all')

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f3f3f3] dark:bg-[#1f1f1f]">
      <Header user={user} onMenuClick={() => setSidebarOpen((v) => !v)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          user={user}
          categories={categories}
          selected={selectedCategory}
          onSelect={(id) => setSelectedCategory(id)}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          stats={allStats}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="fluent-panel rounded-2xl p-3 sm:p-4 md:p-5">
              <TaskList
                user={user}
                tasks={tasks}
                filteredTasks={filteredTasks}
                loading={tasksLoading || catsLoading}
                categories={categories}
                selectedCategory={selectedCategory}
                filterProps={{
                  search,
                  setSearch,
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
