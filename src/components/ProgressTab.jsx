import { useState } from 'react'
import { Delta, Segmented } from './controls.jsx'
import { formatSavedAt } from './ReplayList.jsx'

// How many replays the chart shows: the most recent ones. The table lists them all.
const CHART_LIMIT = 8

const METRICS = [
  { value: 'bestHeight', label: 'Best height', title: 'Best height per replay (cm)', fmt: (v) => v.toFixed(1) },
  { value: 'bestHipRise', label: 'Hip rise', title: 'Best hip rise per replay (% of leg length)', fmt: (v) => `${v.toFixed(1)}%` },
  { value: 'avgFlight', label: 'Air time', title: 'Average air time per replay (ms)', fmt: (v) => String(Math.round(v)) },
]

// Progress tab: jump history across analyzed replays, oldest to newest, built from the
// jump summary each analysis writes into the replay's metadata.
export default function ProgressTab({ replays }) {
  const [metricKey, setMetricKey] = useState('bestHeight')
  const sessions = summarize(replays)

  if (sessions.length === 0) {
    return (
      <div className="empty-state">
        <h1 className="page-heading">Progress</h1>
        <p>Analyze a saved replay in Replays and your jumps show up here.</p>
      </div>
    )
  }

  const metric = METRICS.find((m) => m.value === metricKey)
  const recent = sessions.slice(-CHART_LIMIT).filter((s) => s[metric.value] !== null)
  const values = recent.map((s) => s[metric.value])
  const max = Math.max(...values)
  const min = Math.min(...values) * 0.8
  const barHeight = (v) => Math.round(24 + (max === min ? 1 : (v - min) / (max - min)) * 156)

  return (
    <div className="progress-page">
      <div className="progress-head">
        <div>
          <h1 className="page-heading">Progress</h1>
          <p className="hint">Your analyzed replays, oldest to newest.</p>
        </div>
        <Segmented label="Measure" options={METRICS} value={metricKey} onChange={setMetricKey} />
      </div>

      <figure className="panel chart">
        <figcaption className="section-label">{metric.title}</figcaption>
        <div className="chart-bars">
          {recent.map((s, i) => (
            <div key={s.id} className={i === recent.length - 1 ? 'chart-col latest' : 'chart-col'}>
              <span className="chart-value">{metric.fmt(s[metric.value])}</span>
              <div className="chart-bar" style={{ height: barHeight(s[metric.value]) }} />
            </div>
          ))}
        </div>
        <div className="chart-labels">
          {recent.map((s) => (
            <span key={s.id}>{formatDay(s.savedAt)}</span>
          ))}
        </div>
      </figure>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Replay</th>
              <th scope="col">Jumps</th>
              <th scope="col">Best height</th>
              <th scope="col">Best hip rise</th>
              <th scope="col">Average air time</th>
            </tr>
          </thead>
          <tbody>
            {sessions
              .map((s, i) => ({ s, prev: sessions[i - 1] }))
              .reverse()
              .map(({ s, prev }) => (
                <tr key={s.id}>
                  <th scope="row">{formatSavedAt(s.savedAt)}</th>
                  <td>{s.count}</td>
                  <td>
                    {s.bestHeight.toFixed(1)} cm
                    <Delta value={prev && s.bestHeight - prev.bestHeight} unit=" cm" />
                  </td>
                  <td>
                    {s.bestHipRise === null ? '—' : `${s.bestHipRise.toFixed(1)}%`}
                    <Delta
                      value={prev && s.bestHipRise !== null && prev.bestHipRise !== null ? s.bestHipRise - prev.bestHipRise : null}
                      unit=" pts"
                    />
                  </td>
                  <td>
                    {Math.round(s.avgFlight)} ms
                    <Delta value={prev && s.avgFlight - prev.avgFlight} unit=" ms" digits={0} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <p className="note">Height comes from air time and is about ±4 cm at 30 fps, so small changes may be noise.</p>
    </div>
  )
}

function summarize(replays) {
  return replays
    .filter((r) => r.jumps?.length)
    .sort((a, b) => a.savedAt - b.savedAt)
    .map((r) => ({
      id: r.id,
      savedAt: r.savedAt,
      count: r.jumps.length,
      bestHeight: Math.max(...r.jumps.map((j) => j.heightCm)),
      bestHipRise: maxOf(r.jumps.map((j) => j.hipRisePercent)),
      avgFlight: r.jumps.reduce((sum, j) => sum + j.flightMs, 0) / r.jumps.length,
    }))
}

function maxOf(values) {
  const nums = values.filter((v) => typeof v === 'number')
  return nums.length ? Math.max(...nums) : null
}

function formatDay(savedAt) {
  return new Date(savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
