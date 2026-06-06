import { lightLabel, localeTag, weatherLabel } from '../i18n'
import type { DayForecast } from '../lib/scoring'
import { formatDayLabel, formatWindow } from '../lib/time'
import { weatherIcon } from '../lib/weather'
import { m } from '../paraglide/messages.js'
import { LightDot } from './TrafficLight'

/** One day in the 7-day forecast. */
export function DayCard({ day, today }: { day: DayForecast; today: string }) {
  const { weekday, day: dom } = formatDayLabel(day.date, today, localeTag(), m.day_today())
  return (
    <div className={`day day--${day.light}`}>
      <div className="day-head">
        <div className="day-when">
          <span className="day-weekday">{weekday}</span>
          <span className="day-dom">{dom}</span>
        </div>
        <LightDot light={day.light} size={16} />
      </div>

      <div className="day-wx" title={weatherLabel(day.weatherCode)}>
        <span className="day-icon">{weatherIcon(day.weatherCode)}</span>
        <span className="day-temp">
          {Math.round(day.tMaxC)}° <span className="muted">/ {Math.round(day.tMinC)}°</span>
        </span>
      </div>

      <div className="day-verdict">{lightLabel(day.light)}</div>

      <dl className="day-stats">
        <div>
          <dt>{m.day_window()}</dt>
          <dd>{day.window ? formatWindow(day.window.startHour, day.window.endHour) : '—'}</dd>
        </div>
        <div>
          <dt>{m.day_rain()}</dt>
          <dd>
            {day.precipMm} mm{day.maxPrecipProb > 0 ? ` · ${day.maxPrecipProb}%` : ''}
          </dd>
        </div>
      </dl>
    </div>
  )
}
