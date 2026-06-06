import { lightLabel, verdictWord } from '../i18n'
import type { Light } from '../lib/scoring'
import { m } from '../paraglide/messages.js'
import { LightDot } from './TrafficLight'

const LIGHTS: Light[] = ['green', 'yellow', 'red']

export function Loading() {
  return (
    <div className="state">
      <div className="spinner" />
      <p>{m.state_loading()}</p>
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="state state--error">
      <p className="state-title">{m.state_error()}</p>
      <p className="muted">{message}</p>
      <button type="button" className="btn" onClick={onRetry}>
        {m.state_retry()}
      </button>
    </div>
  )
}

export function Legend() {
  return (
    <div className="legend">
      <span>
        <LightDot light="green" size={10} /> {m.legend_good()}
      </span>
      <span>
        <LightDot light="yellow" size={10} /> {m.legend_marginal()}
      </span>
      <span>
        <LightDot light="red" size={10} /> {m.legend_nogo()}
      </span>
    </div>
  )
}

/** Key that explains the YES/MEH/NO verdict words used in the forecast rows. */
export function VerdictKey() {
  return (
    <dl className="vkey">
      {LIGHTS.map((light) => (
        <div className="vkey-item" key={light}>
          <dt className={`vkey-word vkey-word--${light}`}>{verdictWord(light)}</dt>
          <dd className="vkey-mean">{lightLabel(light)}</dd>
        </div>
      ))}
    </dl>
  )
}
