// Jump analysis panel under a saved replay: run the analysis, then one row per jump with
// both measurements and the change from the jump before it.
export default function JumpAnalysis({
  analysis,
  status,
  progress,
  canAnalyze,
  onAnalyze,
  showSkeleton,
  onShowSkeleton,
  slow,
  onSlow,
  onSeek,
}) {
  const analyzing = status === 'analyzing'
  const jumps = analysis?.jumps ?? []

  return (
    <section className="jump-panel" aria-labelledby="jump-heading">
      <div className="jump-header">
        <h2 id="jump-heading" className="section-heading">Jump analysis</h2>
        <div className="jump-actions">
          {analysis && (
            <>
              <label className="toggle-inline">
                <input type="checkbox" checked={showSkeleton} onChange={(e) => onShowSkeleton(e.target.checked)} />
                Skeleton
              </label>
              <label className="toggle-inline">
                <input type="checkbox" checked={slow} onChange={(e) => onSlow(e.target.checked)} />
                Slow motion
              </label>
            </>
          )}
          <button className="pill-button" disabled={!canAnalyze || analyzing} onClick={onAnalyze}>
            {analyzing ? `Analyzing… ${Math.round(progress * 100)}%` : analysis ? 'Analyze again' : 'Analyze jumps'}
          </button>
        </div>
      </div>

      {status === 'failed' && <p className="save-hint">Analysis failed. Try again, or check the console.</p>}
      {!analysis && !analyzing && status !== 'failed' && (
        <p className="save-hint">
          Finds each jump in this replay (both feet off the floor) and measures it. Runs on this device.
        </p>
      )}

      {analysis && jumps.length === 0 && (
        <p className="save-hint">
          No jumps found. The whole body, feet included, needs to be in frame, ideally from the side.
        </p>
      )}

      {jumps.length > 0 && (
        <>
          <div className="jump-table-wrap">
            <table className="jump-table">
              <thead>
                <tr>
                  <th scope="col">Jump</th>
                  <th scope="col">Air time</th>
                  <th scope="col">Height <span className="unit">(from air time)</span></th>
                  <th scope="col">Hip rise <span className="unit">(% leg length)</span></th>
                  <th scope="col">Feet clearance <span className="unit">(% leg length)</span></th>
                </tr>
              </thead>
              <tbody>
                {jumps.map((jump, i) => {
                  const prev = jumps[i - 1]
                  return (
                    <tr key={jump.takeoffMs}>
                      <th scope="row">
                        <button className="jump-seek" onClick={() => onSeek(jump.takeoffMs - 500)}>
                          #{i + 1} <span className="unit">at {(jump.takeoffMs / 1000).toFixed(1)}s</span>
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
          <p className="jump-note">
            Height uses h = g·t²/8 and is only as precise as the frame rate: about ±4 cm at 30 fps.
            Hip rise compares the highest hip point to standing hip height. Change is from the
            jump before. Tap a jump to replay it.
          </p>
        </>
      )}
    </section>
  )
}

function Delta({ value, unit, digits = 1 }) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const rounded = Number(value.toFixed(digits))
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '±'
  return (
    <span className="delta">
      {sign}
      {Math.abs(rounded).toFixed(digits)}
      {unit}
    </span>
  )
}

function fmtPercent(value) {
  return typeof value === 'number' ? `${value.toFixed(1)}%` : '—'
}

function diff(a, b) {
  return typeof a === 'number' && typeof b === 'number' ? a - b : null
}
