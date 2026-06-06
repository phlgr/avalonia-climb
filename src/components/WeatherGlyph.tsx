// Small, friendly weather marks in the same hand-drawn spirit as the hero crag
// scene — reused by the forecast rows and the outlook note. Decorative: callers
// pass the localized label as text/title for screen readers.
type Kind = 'clear' | 'partly' | 'cloud' | 'rain' | 'snow' | 'storm'

function kindFor(code: number): Kind {
  if (code === 0) return 'clear'
  if (code <= 2) return 'partly'
  if (code <= 48) return 'cloud'
  if (code <= 67) return 'rain'
  if (code <= 77) return 'snow'
  if (code <= 82) return 'rain'
  if (code <= 86) return 'snow'
  return 'storm'
}

function Sun({ cx = 20, cy = 20, r = 7, rays = true }) {
  return (
    <g className="wx-sun">
      {rays && (
        <g className="wx-rays">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
            <line
              key={d}
              x1={cx}
              y1={cy - r - 3.5}
              x2={cx}
              y2={cy - r - 7.5}
              transform={`rotate(${d} ${cx} ${cy})`}
            />
          ))}
        </g>
      )}
      <circle className="wx-disc" cx={cx} cy={cy} r={r} />
    </g>
  )
}

function Cloud() {
  return (
    <g className="wx-cloud">
      <circle cx="13" cy="24" r="6.5" />
      <circle cx="21" cy="19" r="9" />
      <circle cx="29" cy="24" r="6.5" />
      <rect x="12" y="22" width="18" height="8" rx="4" />
    </g>
  )
}

export function WeatherGlyph({ code, className }: { code: number; className?: string }) {
  const kind = kindFor(code)
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative; label is provided alongside
    <svg
      className={`wx${className ? ` ${className}` : ''}`}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
    >
      {kind === 'clear' && <Sun />}
      {kind === 'partly' && (
        <>
          <Sun cx={14} cy={14} r={5.5} />
          <Cloud />
        </>
      )}
      {kind === 'cloud' && <Cloud />}
      {kind === 'rain' && (
        <>
          <Cloud />
          <g className="wx-rain">
            <line x1="16" y1="31" x2="14" y2="37" />
            <line x1="22" y1="31" x2="20" y2="37" />
            <line x1="28" y1="31" x2="26" y2="37" />
          </g>
        </>
      )}
      {kind === 'snow' && (
        <>
          <Cloud />
          <g className="wx-snow">
            <circle cx="16" cy="34" r="1.7" />
            <circle cx="22" cy="35" r="1.7" />
            <circle cx="28" cy="34" r="1.7" />
          </g>
        </>
      )}
      {kind === 'storm' && (
        <>
          <Cloud />
          <path className="wx-bolt" d="M23 30 L17 36 L21 36 L18 41 L27 34 L23 34 Z" />
        </>
      )}
    </svg>
  )
}
