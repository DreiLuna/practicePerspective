import { Delta } from './controls.jsx'

// Jump analysis results under a replay: a prompt before analysis, then one row per jump
// with both measurements and the change from the jump before.
export default function JumpAnalysis({ analysis, status, onSeek }) {
  if (status === 'failed') return <p className="error-text">Analysis failed. Try again, or check the console.</p>
  if (status === 'analyzing') return null
  if (!analysis) {
    return (
      <p className="hint">
        Analyze jumps finds each jump in this replay (both feet off the floor) and measures it. It runs on this device.
      </p>
    )
  }

  const jumps = analysis.jumps
  if (jumps.length === 0) {
    return <p className="hint">No jumps found. The whole body, feet included, needs to be in frame, ideally from the side.</p>
  }

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Jump</th>
              <th scope="col">Air time</th>
              <th scope="col">Height</th>
              <th scope="col">Hip rise <span className="unit">(% leg)</span></th>
              <th scope="col">Feet clear <span className="unit">(% leg)</span></th>
            </tr>
          </thead>
          <tbody>
            {jumps.map((jump, i) => {
              const prev = jumps[i - 1]
              return (
                <tr key={jump.takeoffMs}>
                  <th scope="row">
                    <button className="jump-seek" onClick={() => onSeek(jump.takeoffMs - 500)}>
                      #{i + 1} <span className="unit">at {(jump.takeoffMs / 1000).toFixed(1)} s</span>
                    </button>
                  </th>
                  <td>
                    {Math.round(jump.flightMs)} ms
                    <Delta value={prev && jump.flightMs - prev.flightMs} unit=" ms" digits={0} />
                  </td>
                  <td>
                    {jump.heightCm.toFixed(1)} cm
                    <Delta value={prev && jump.heightCm - prev.heightCm} unit=" cm" />
                  </td>
                  <td>
                    {fmtPercent(jump.hipRisePercent)}
                    <Delta value={prev && diff(jump.hipRisePercent, prev.hipRisePercent)} unit=" pts" />
                  </td>
                  <td>{fmtPercent(jump.footClearancePercent)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="note">
        Height uses h = g·t²/8 and is about ±4 cm at 30 fps. Hip rise compares the highest hip point to standing
        height. Change is from the jump before. Tap a jump to replay it.
      </p>
    </>
  )
}

function fmtPercent(value) {
  return typeof value === 'number' ? `${value.toFixed(1)}%` : '—'
}

function diff(a, b) {
  return typeof a === 'number' && typeof b === 'number' ? a - b : null
}
