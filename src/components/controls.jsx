// Small shared controls, styled by global.css on top of the design tokens.

// A labelled on/off switch: the whole row is the button.
export function Switch({ label, checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="switch-row" onClick={() => onChange(!checked)}>
      {label}
      <span className="switch" aria-hidden="true" />
    </button>
  )
}

// A labelled range slider with its value shown in the corner.
export function Slider({ label, value, display, min, max, step = 1, minLabel, maxLabel, onChange }) {
  return (
    <label className="field">
      <span className="field-head">
        <span>{label}</span>
        <output>{display ?? value}</output>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {(minLabel || maxLabel) && (
        <span className="field-scale" aria-hidden="true">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </span>
      )}
    </label>
  )
}

// One choice out of a few, as a row of buttons.
export function Segmented({ label, options, value, onChange }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={option.value === value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  )
}

// Signed change from the item before, or nothing for the first item.
export function Delta({ value, unit, digits = 1 }) {
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
