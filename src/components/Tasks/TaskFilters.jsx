import { useEffect, useRef, useState } from 'react'

export default function TaskFilters({ search, setSearch }) {
  const [showSearch, setShowSearch] = useState(false)
  const inputRef = useRef(null)

  const searchOpen = showSearch || search.trim().length > 0

  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus()
  }, [searchOpen])

  const closeSearch = () => {
    setShowSearch(false)
    setSearch('')
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowSearch((v) => !v)}
        className="h-10 w-10 rounded-lg border border-[#d2d0ce] dark:border-[#4a4847] bg-[#ffffff] dark:bg-[#2a2a2a] text-[#605e5c] dark:text-[#c8c6c4] hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
        aria-label="Search"
        title="Search"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.25-4.9a6.4 6.4 0 11-12.8 0 6.4 6.4 0 0112.8 0z" />
        </svg>
      </button>

      {searchOpen && (
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks"
            className="w-full h-10 pl-3 pr-10 text-sm bg-[#ffffff] dark:bg-[#2a2a2a] border border-[#d2d0ce] dark:border-[#4a4847] text-[#323130] dark:text-[#f3f2f1] rounded-lg placeholder-[#8a8886] focus:outline-none focus:ring-2 focus:ring-[#0f6cbd]"
          />
          <button
            onClick={closeSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 rounded text-xs text-[#0f6cbd] dark:text-[#8ec8ff] hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close search"
            title="Close search"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
