// src/components/Dashboard/DashboardSummary.jsx
function StatCard({ label, value, icon, textColor, bgColor }) {
  return (
    <div className={`${bgColor} rounded-2xl p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold font-mono mt-1 ${textColor}`}>{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
}

export default function DashboardSummary({ stats }) {
  const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="mb-6 space-y-4">
      {/* Progress bar card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Overall Progress</h3>
            <p className="text-xs text-slate-400 mt-0.5">{stats.completed} of {stats.total} tasks completed</p>
          </div>
          <span className="text-3xl font-bold font-mono text-blue-500">{rate}%</span>
        </div>

        {/* Bar */}
        <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${rate}%` }}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3">
          {[
            { label: 'Pending',     val: stats.pending,    dot: 'bg-slate-400' },
            { label: 'In Progress', val: stats.inProgress, dot: 'bg-blue-400' },
            { label: 'Completed',   val: stats.completed,  dot: 'bg-emerald-400' },
            { label: 'Overdue',     val: stats.overdue,    dot: 'bg-red-400' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {s.label}: <strong className="text-slate-700 dark:text-slate-200">{s.val}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total"       value={stats.total}      icon="📋" textColor="text-slate-700 dark:text-slate-100"        bgColor="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
        <StatCard label="Completed"   value={stats.completed}  icon="✅" textColor="text-emerald-600 dark:text-emerald-400"    bgColor="bg-emerald-50 dark:bg-emerald-900/20" />
        <StatCard label="In Progress" value={stats.inProgress} icon="🔄" textColor="text-blue-600 dark:text-blue-400"          bgColor="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard label="Overdue"     value={stats.overdue}    icon="⚠️" textColor="text-red-600 dark:text-red-400"            bgColor="bg-red-50 dark:bg-red-900/20" />
      </div>
    </div>
  )
}
