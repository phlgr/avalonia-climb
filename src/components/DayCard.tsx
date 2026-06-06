import { lightLabel, localeTag, weatherLabel } from '../i18n'
import type { DayForecast } from '../lib/scoring'
import { formatDayLabel, formatWindow } from '../lib/time'
import { m } from '../paraglide/messages.js'

/** One day in the 7-day forecast, as an almanac row. */
export function DayCard({ day, today }: { day: DayForecast; today: string }) {
  const { weekday, day: dom } = formatDayLabel(day.date, today, localeTag(), m.day_today())
  return (
    <article className={`day day--${day.light}`}>
      <div className="day-row">
        <div className="day-when">
          <span className="day-weekday">{weekday}</span>
          <span className="day-dom">{dom}</span>
        </div>
        <span className="day-verdict">{lightLabel(day.light)}</span>
      </div>

      <div className="day-meta">
        <span className="day-wx">
          <b>{weatherLabel(day.weatherCode)}</b> · {Math.round(day.tMaxC)}° /{' '}
          {Math.round(day.tMinC)}°
        </span>
        <span className="day-figs">
          {day.window ? <b>{formatWindow(day.window.startHour, day.window.endHour)}</b> : '—'} ·{' '}
          {day.precipMm} mm{day.maxPrecipProb > 0 ? ` ${day.maxPrecipProb}%` : ''}
        </span>
      </div>
    </article>
  )
}
