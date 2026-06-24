import { dateKey } from '../dateKey'

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const MAX_SECONDS = 8 * 3600

function level(seconds) {
  if (seconds <= 0) return 0
  return Math.min(9, Math.ceil(seconds / MAX_SECONDS * 9))
}

export default function Heatmap({ history, goalMinutes }) {
  const goalSeconds = goalMinutes * 60
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDay.getDay(); i++) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day))
  }
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  const rows = []
  for (let r = 0; r < cells.length; r += 7) {
    rows.push(cells.slice(r, r + 7))
  }

  return (
    <div className="heatmap">
      <div className="heatmap-title">{year}年{month + 1}月 专注热力图</div>
      <div className="heatmap-weekdays">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="heatmap-grid">
        {rows.map((row, ri) => (
          <div className="heatmap-row" key={ri}>
            {row.map((d, di) => {
              if (!d) {
                return <div className="heatmap-cell heatmap-cell-empty" key={di} />
              }
              const key = dateKey(d)
              const seconds = history[key] || 0
              const lvl = level(seconds)
              const goalReached = seconds >= goalSeconds
              const isToday = dateKey(d) === dateKey(today)
              return (
                <div
                  key={di}
                  className={`heatmap-cell level-${lvl}${isToday ? ' heatmap-cell-today' : ''}`}
                  title={`${key} · ${Math.round(seconds / 60)} 分钟`}
                >
                  {goalReached ? '✓' : d.getDate()}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>少</span>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`heatmap-cell level-${i}`} />
        ))}
        <span>8h</span>
      </div>
    </div>
  )
}
