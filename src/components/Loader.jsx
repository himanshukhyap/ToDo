/* ── Skeleton loader for notes grid ── */
export function NotesSkeleton() {
  return (
    <div className="notes-grid">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="skeleton-note">
          <div className="sk-line sk-title"/>
          <div className="sk-line"/>
          <div className="sk-line"/>
          <div className="sk-line sk-short"/>
          <div className="sk-footer"/>
        </div>
      ))}
    </div>
  );
}

/* ── Skeleton loader for tasks list ── */
export function TasksSkeleton() {
  return (
    <div className="sk-tasks-wrap">
      {[1,2,3,4].map(i => (
        <div key={i} className="sk-task-row">
          <div className="sk-circle"/>
          <div className="sk-task-body">
            <div className="sk-line" style={{width:`${55 + (i*13)%40}%`}}/>
            <div className="sk-line sk-short" style={{width:"30%"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Full page spinner (splash) ── */
export function PageLoader() {
  return (
    <div className="page-loader">
      <div className="pl-ring">
        <div/><div/><div/><div/>
      </div>
    </div>
  );
}
