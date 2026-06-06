import { m } from '../paraglide/messages.js'
import { LightDot } from './TrafficLight'

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
