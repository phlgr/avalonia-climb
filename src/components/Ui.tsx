import { LightDot } from './TrafficLight'

export function Loading() {
  return (
    <div className="state">
      <div className="spinner" />
      <p>Reading the sky…</p>
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="state state--error">
      <p className="state-title">Couldn't load conditions</p>
      <p className="muted">{message}</p>
      <button type="button" className="btn" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}

export function Legend() {
  return (
    <div className="legend">
      <span>
        <LightDot light="green" size={10} /> good
      </span>
      <span>
        <LightDot light="yellow" size={10} /> marginal
      </span>
      <span>
        <LightDot light="red" size={10} /> no-go
      </span>
    </div>
  )
}
