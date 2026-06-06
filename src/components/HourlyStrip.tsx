import type { Light } from '../lib/scoring'

export interface HourTick {
  hour: number
  light: Light
  isNow: boolean
}

/** Today's daylight hours as a row of colored bars — shows the good window at a glance. */
export function HourlyStrip({ ticks }: { ticks: HourTick[] }) {
  if (ticks.length === 0) return null
  return (
    <div className="hourly">
      {ticks.map((t) => (
        <div key={t.hour} className={`tick tick--${t.light}${t.isNow ? ' now' : ''}`}>
          <span className="tick-bar" />
          <span className="tick-hour">{t.isNow ? 'now' : t.hour}</span>
        </div>
      ))}
    </div>
  )
}
