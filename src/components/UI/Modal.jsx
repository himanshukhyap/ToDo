import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${maxWidth} bg-[#ffffff] dark:bg-[#2a2a2a] rounded-2xl border border-[#e1dfdd] dark:border-[#3b3a39] shadow-modal animate-scale-in`}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[#e1dfdd] dark:border-[#3b3a39]">
          <h2 className="text-[17px] font-semibold text-[#201f1e] dark:text-[#f3f2f1]">{title}</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md text-[#605e5c] dark:text-[#c8c6c4] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}
