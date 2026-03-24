import { useState } from 'react'
import { logOut } from '../../services/authService'
import { useTheme } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

export default function Header({ user, onMenuClick }) {
  const { dark, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    const { error } = await logOut()
    if (error) toast.error('Logout failed')
    else toast.success('Logged out')
    setMenuOpen(false)
  }

  return (
    <header className="h-14 sm:h-[58px] bg-[#faf9f8]/95 dark:bg-[#252423]/95 border-b border-[#e1dfdd] dark:border-[#3b3a39] backdrop-blur sticky top-0 z-30 flex items-center gap-3 px-3 sm:px-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden h-9 w-9 rounded-lg text-[#605e5c] dark:text-[#c8c6c4] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex items-center gap-2 min-w-0">
        <div className="h-7 w-7 rounded-md bg-[#0f6cbd] flex items-center justify-center shadow-sm">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight text-[#201f1e] dark:text-[#f3f2f1]">TaskFlow</p>
          <p className="hidden sm:block text-[11px] leading-tight text-[#605e5c] dark:text-[#a19f9d]">Personal tasks</p>
        </div>
      </div>

      <div className="flex-1" />

      <button
        onClick={toggle}
        title={dark ? 'Light mode' : 'Dark mode'}
        className="h-9 w-9 rounded-lg text-[#605e5c] dark:text-[#c8c6c4] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        {dark ? (
          <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3M17.66 6.34l-.7.7M7.05 16.95l-.7.7m11.31 0l-.7-.7M7.05 7.05l-.7-.7M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="h-9 pl-1 pr-2 rounded-xl flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=0f6cbd&color=fff`}
            alt={user.displayName}
            className="h-7 w-7 rounded-full"
          />
          <span className="hidden sm:block text-sm text-[#323130] dark:text-[#f3f2f1] max-w-[96px] truncate">
            {user.displayName?.split(' ')[0] || 'User'}
          </span>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-60 bg-[#ffffff] dark:bg-[#2a2a2a] rounded-xl border border-[#e1dfdd] dark:border-[#3b3a39] shadow-modal z-20 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-[#e1dfdd] dark:border-[#3b3a39]">
                <p className="text-sm font-semibold text-[#201f1e] dark:text-[#f3f2f1] truncate">{user.displayName}</p>
                <p className="text-xs text-[#605e5c] dark:text-[#a19f9d] truncate">{user.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg text-[#a4262c] hover:bg-[#fde7e9] dark:text-[#ff99a4] dark:hover:bg-[#3b1f22] transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
