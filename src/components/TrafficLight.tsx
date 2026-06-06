import { lightLabel } from '../i18n'
import type { Light } from '../lib/scoring'

const LAMP_ORDER: Light[] = ['red', 'yellow', 'green']

/** The hero traffic light for the "Now" view. */
export function TrafficLight({ light, score }: { light: Light; score: number }) {
  const label = lightLabel(light)
  return (
    <div className={`light light--${light}`}>
      <div className="lamps" role="img" aria-label={`${label} — ${score}/100`}>
        {LAMP_ORDER.map((lamp) => (
          <span key={lamp} className={`lamp lamp--${lamp}${lamp === light ? ' on' : ''}`} />
        ))}
      </div>
      <div className="light-readout">
        <span className="light-label">{label}</span>
        <span className="light-score">
          {score}
          <small>/100</small>
        </span>
      </div>
    </div>
  )
}

/** Small colored dot reused in the forecast and hourly strip. */
export function LightDot({ light, size = 14 }: { light: Light; size?: number }) {
  return <span className={`dot dot--${light}`} style={{ width: size, height: size }} />
}
