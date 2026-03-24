// src/components/UI/Loading.jsx
export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-700" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-500 animate-spin" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  )
}
