import type { Light } from '../lib/scoring'

export const LIGHT_LABEL: Record<Light, string> = {
  green: 'Good to climb',
  yellow: 'Marginal',
  red: 'No-go',
}

export const LIGHT_TAGLINE: Record<Light, string> = {
  green: 'Conditions are working. Go pull on something.',
  yellow: 'Climbable, but compromised — bring patience and a brush.',
  red: 'Stay off the rock for now.',
}

const LAMP_ORDER: Light[] = ['red', 'yellow', 'green']

/** The hero traffic light for the "Now" view. */
export function TrafficLight({ light, score }: { light: Light; score: number }) {
  return (
    <div className={`light light--${light}`}>
      <div
        className="lamps"
        role="img"
        aria-label={`${LIGHT_LABEL[light]} — score ${score} of 100`}
      >
        {LAMP_ORDER.map((lamp) => (
          <span key={lamp} className={`lamp lamp--${lamp}${lamp === light ? ' on' : ''}`} />
        ))}
      </div>
      <div className="light-readout">
        <span className="light-label">{LIGHT_LABEL[light]}</span>
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
