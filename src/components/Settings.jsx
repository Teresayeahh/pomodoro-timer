import { useState } from 'react'

const DURATION_FIELDS = [
  ['pomodoro', '专注时长'],
  ['shortBreak', '短休息'],
  ['longBreak', '长休息'],
]

export default function Settings({ cfg, onSave, onClose }) {
  const [form, setForm] = useState({ ...cfg })

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSave() {
    const validated = {
      ...form,
      pomodoro: Math.max(1, Math.min(99, form.pomodoro || 25)),
      shortBreak: Math.max(1, Math.min(99, form.shortBreak || 5)),
      longBreak: Math.max(1, Math.min(99, form.longBreak || 15)),
      focusGoal: Math.max(10, Math.min(1440, form.focusGoal || 120)),
    }
    onSave(validated)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>⚙ 设置</h2>

        <div className="setting-section">
          <h3>时长（分钟）</h3>
          {DURATION_FIELDS.map(([key, label]) => (
            <div className="setting-row" key={key}>
              <label>{label}</label>
              <input
                type="number"
                min={1}
                max={99}
                value={form[key]}
                onChange={e => set(key, parseInt(e.target.value) || 1)}
              />
            </div>
          ))}
        </div>

        <div className="setting-section">
          <h3>每日目标</h3>
          <div className="setting-row">
            <label>专注目标（分钟）</label>
            <input
              type="number"
              min={10}
              max={1440}
              step={5}
              value={form.focusGoal}
              onChange={e => set('focusGoal', parseInt(e.target.value) || 10)}
            />
          </div>
        </div>

        <div className="setting-section">
          <h3>选项</h3>
          <div className="setting-row">
            <label>完成后自动开始下一个</label>
            <input
              type="checkbox"
              checked={form.autoStart}
              onChange={e => set('autoStart', e.target.checked)}
            />
          </div>
          <div className="setting-row">
            <label>窗口始终置顶</label>
            <input
              type="checkbox"
              checked={form.alwaysOnTop}
              onChange={e => set('alwaysOnTop', e.target.checked)}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  )
}
