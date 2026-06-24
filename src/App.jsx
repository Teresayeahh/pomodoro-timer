import { useState, useEffect, useRef } from 'react'
import Settings from './components/Settings'
import FocusProgress from './components/FocusProgress'
import Heatmap from './components/Heatmap'
import { dateKey } from './dateKey'

const MODES = {
  pomodoro:   { label: '专注',  color: '#e63946' },
  shortBreak: { label: '短休息', color: '#2a9d8f' },
  longBreak:  { label: '长休息', color: '#457b9d' },
}

const RADIUS = 90
const CIRC = 2 * Math.PI * RADIUS

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.22
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.25, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
      osc.start(t)
      osc.stop(t + 0.9)
    })
  } catch {}
}

export default function App() {
  const [cfg, setCfg] = useState({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStart: false,
    alwaysOnTop: false,
    focusGoal: 120,
  })
  const [mode, setMode] = useState('pomodoro')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pomodoro-sessions'))
      return saved && saved.date === dateKey() ? saved.count : 0
    } catch {
      return 0
    }
  })
  const [completed, setCompleted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [view, setView] = useState('timer')
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pomodoro-history')) || {}
    } catch {
      return {}
    }
  })

  function addFocusSeconds(seconds) {
    const key = dateKey()
    setHistory(h => {
      const next = { ...h, [key]: (h[key] || 0) + seconds }
      try { localStorage.setItem('pomodoro-history', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const timerRef = useRef(null)
  // Refs so the completion effect always reads fresh values
  const modeRef = useRef(mode)
  const sessionsRef = useRef(sessions)
  const cfgRef = useRef(cfg)
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { sessionsRef.current = sessions }, [sessions])
  useEffect(() => { cfgRef.current = cfg }, [cfg])

  // Tick
  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setRunning(false)
          setCompleted(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [running])

  // On complete
  useEffect(() => {
    if (!completed) return
    setCompleted(false)

    const m = modeRef.current
    const s = sessionsRef.current
    const c = cfgRef.current

    playChime()
    window.electronAPI?.notify(
      m === 'pomodoro' ? '🍅 专注完成！' : '⏰ 休息结束！',
      m === 'pomodoro' ? '去休息一下吧' : '继续专注吧'
    )

    let newSessions = s
    if (m === 'pomodoro') {
      newSessions = s + 1
      setSessions(newSessions)
      try {
        localStorage.setItem('pomodoro-sessions', JSON.stringify({ date: dateKey(), count: newSessions }))
      } catch {}
      addFocusSeconds(c.pomodoro * 60)
    }

    const next = m === 'pomodoro'
      ? (newSessions % 4 === 0 ? 'longBreak' : 'shortBreak')
      : 'pomodoro'

    modeRef.current = next
    setMode(next)
    setTimeLeft(c[next] * 60)
    if (c.autoStart) setRunning(true)
  }, [completed])

  // Update title bar with time
  useEffect(() => {
    document.title = running ? `${fmt(timeLeft)} — ${MODES[mode].label}` : '番茄钟'
  }, [timeLeft, running, mode])

  function switchMode(m) {
    clearInterval(timerRef.current)
    setRunning(false)
    setMode(m)
    setTimeLeft(cfg[m] * 60)
  }

  function toggle() {
    if (running) {
      clearInterval(timerRef.current)
      setRunning(false)
    } else {
      setRunning(true)
    }
  }

  function reset() {
    clearInterval(timerRef.current)
    setRunning(false)
    setTimeLeft(cfg[mode] * 60)
  }

  function saveSettings(newCfg) {
    setCfg(newCfg)
    clearInterval(timerRef.current)
    setRunning(false)
    setTimeLeft(newCfg[mode] * 60)
    window.electronAPI?.setAlwaysOnTop(newCfg.alwaysOnTop)
    setShowSettings(false)
  }

  const total = cfg[mode] * 60
  const offset = CIRC * (1 - timeLeft / total)
  const { color, label } = MODES[mode]

  return (
    <div className="app" style={{ '--accent': color }}>
      <div className="titlebar" />

      {view === 'heatmap' ? (
        <div className="view-header">
          <button className="btn-icon" onClick={() => setView('timer')} title="返回">←</button>
          <span className="view-title">专注热力图</span>
          <span className="view-spacer" />
        </div>
      ) : (
        <div className="tabs">
          {Object.entries(MODES).map(([k, { label: l }]) => (
            <button
              key={k}
              className={`tab ${mode === k ? 'active' : ''}`}
              onClick={() => switchMode(k)}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {view === 'heatmap' ? (
        <Heatmap history={history} goalMinutes={cfg.focusGoal} />
      ) : (
        <>
          <div className="ring-wrap" onClick={toggle} title={running ? '暂停' : '开始'}>
            <svg width={220} height={220} className="ring">
              <circle cx={110} cy={110} r={RADIUS} className="ring-bg" />
              <circle
                cx={110} cy={110} r={RADIUS}
                className="ring-fg"
                stroke={color}
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="ring-inner">
              <span className="time">{fmt(timeLeft)}</span>
              <span className="mode-label">{label}</span>
              <span className="hint">{running ? '点击暂停' : '点击开始'}</span>
            </div>
          </div>

          <div className="controls">
            <button className="btn-icon" onClick={reset} title="重置">↺</button>
            <button className="btn-primary" onClick={toggle}>
              {running ? '⏸ 暂停' : '▶ 开始'}
            </button>
            <button className="btn-icon" onClick={() => setShowSettings(true)} title="设置">⚙</button>
          </div>

          <div className="sessions">
            {sessions === 0 ? (
              <span className="sessions-empty">今日尚未完成专注</span>
            ) : (
              <>
                {Array.from({ length: Math.min(sessions, 8) }).map((_, i) => (
                  <span key={i} className="tomato">🍅</span>
                ))}
                {sessions > 8 && <span className="sessions-more">+{sessions - 8}</span>}
                <span className="sessions-count">共 {sessions} 个番茄</span>
              </>
            )}
          </div>

          {mode === 'pomodoro' && (
            <FocusProgress todaySeconds={history[dateKey()] || 0} goalMinutes={cfg.focusGoal} />
          )}

          {mode === 'pomodoro' && (
            <button className="heatmap-link" onClick={() => setView('heatmap')}>
              📅 查看专注热力图
            </button>
          )}
        </>
      )}

      {showSettings && (
        <Settings cfg={cfg} onSave={saveSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
