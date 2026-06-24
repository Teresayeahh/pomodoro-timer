function fmtHM(totalMinutes) {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}m` : `${m}m`
}

export default function FocusProgress({ todaySeconds, goalMinutes }) {
  const todayMinutes = todaySeconds / 60
  const pct = Math.min(100, (todayMinutes / goalMinutes) * 100)
  const reached = todayMinutes >= goalMinutes

  return (
    <div className="focus-progress">
      <div className="focus-progress-label">
        <span>今日专注 {fmtHM(Math.round(todayMinutes))}</span>
        <span>目标 {fmtHM(goalMinutes)}{reached ? ' ✓' : ''}</span>
      </div>
      <div className="focus-progress-bar">
        <div className="focus-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
