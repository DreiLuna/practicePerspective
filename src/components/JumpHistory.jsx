// Jump history across the account's analyzed replays, oldest first, built from the jump
// summary each analysis writes into the replay's metadata. Shows how jumps change over time.
export default function JumpHistory({ replays }) {
  const sessions = replays
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

  if (sessions.length === 0) return null

  return (
    <section className="jump-panel" aria-labelledby="history-heading">
      <h2 id="history-heading" className="section-heading">Jump history</h2>
      <div className="jump-table-wrap">
        <table className="jump-table">
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
            {sessions.map((s, i) => {
              const prev = sessions[i - 1]
              return (
                <tr key={s.id}>
                  <th scope="row">{formatDate(s.savedAt)}</th>
                  <td>{s.count}</td>
                  <td>
                    {s.bestHeight.toFixed(1)} cm
                    <Delta value={prev && s.bestHeight - prev.bestHeight} unit=" cm" />
                  </td>
                  <td>
                    {s.bestHipRise === null ? '—' : `${s.bestHipRise.toFixed(1)}%`}
                    <Delta value={prev && s.bestHipRise !== null && prev.bestHipRise !== null ? s.bestHipRise - prev.bestHipRise : null} unit=" pts" />
                  </td>
                  <td>
                    {Math.round(s.avgFlight)} ms
                    <Delta value={prev && s.avgFlight - prev.avgFlight} unit=" ms" digits={0} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="jump-note">One row per analyzed replay. Change is from the replay before.</p>
    </section>
  )
}

function Delta({ value, unit, digits = 1 }) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const rounded = Number(value.toFixed(digits))
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '±'
  return <span className="delta">{sign}{Math.abs(rounded).toFixed(digits)}{unit}</span>
}

function maxOf(values) {
  const nums = values.filter((v) => typeof v === 'number')
  return nums.length ? Math.max(...nums) : null
}

function formatDate(savedAt) {
  return new Date(savedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
