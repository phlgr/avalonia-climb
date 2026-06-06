import { lightLabel, verdictWord } from '../i18n'
import { GREEN_MIN, type Light, YELLOW_MIN } from '../lib/scoring'
import { m } from '../paraglide/messages.js'
import { CragScene } from './CragScene'

/** The hero verdict for the "Now" view: a one-word answer, a little crag scene, a score gauge. */
export function TrafficLight({ light, score }: { light: Light; score: number }) {
  const label = lightLabel(light)
  const pct = Math.max(0, Math.min(100, score))
  return (
    <section className={`hero hero--${light}`}>
      <div className="hero-inner">
        <p className="hero-eyebrow">{m.now_question()}</p>
        <h2 className="hero-verdict">{verdictWord(light)}</h2>
        <p className="hero-sub">{label}</p>
      </div>

      <CragScene light={light} />

      <div className="score" role="img" aria-label={`${label} — ${score}/100`}>
        <div className="score-row">
          <span className="score-key">{m.now_score()}</span>
          <span className="score-num">
            {score}
            <small>/100</small>
          </span>
        </div>
        <div className="gauge">
          <span className="gauge-fill" style={{ width: `${pct}%` }} />
          <span className="gauge-tick" style={{ left: `${YELLOW_MIN}%` }} />
          <span className="gauge-tick" style={{ left: `${GREEN_MIN}%` }} />
        </div>
      </div>
    </section>
  )
}

/** Small colored dot reused in the forecast legend. */
export function LightDot({ light, size = 14 }: { light: Light; size?: number }) {
  return <span className={`dot dot--${light}`} style={{ width: size, height: size }} />
}
