import type { DayForecast } from '../lib/scoring'
import { formatDayLabel, formatWindow } from '../lib/time'
import { describeWeatherCode } from '../lib/weather'
import { LIGHT_LABEL, LightDot } from './TrafficLight'

/** One day in the 7-day forecast. */
export function DayCard({ day, today }: { day: DayForecast; today: string }) {
  const { weekday, day: dom } = formatDayLabel(day.date, today)
  const wx = describeWeatherCode(day.weatherCode)
  return (
    <div className={`day day--${day.light}`}>
      <div className="day-head">
        <div className="day-when">
          <span className="day-weekday">{weekday}</span>
          <span className="day-dom">{dom}</span>
        </div>
        <LightDot light={day.light} size={16} />
      </div>

      <div className="day-wx" title={wx.label}>
        <span className="day-icon">{wx.icon}</span>
        <span className="day-temp">
          {Math.round(day.tMaxC)}° <span className="muted">/ {Math.round(day.tMinC)}°</span>
        </span>
      </div>

      <div className="day-verdict">{LIGHT_LABEL[day.light]}</div>

      <dl className="day-stats">
        <div>
          <dt>Window</dt>
          <dd>{day.window ? formatWindow(day.window.startHour, day.window.endHour) : '—'}</dd>
        </div>
        <div>
          <dt>Rain</dt>
          <dd>
            {day.precipMm} mm{day.maxPrecipProb > 0 ? ` · ${day.maxPrecipProb}%` : ''}
          </dd>
        </div>
      </dl>
    </div>
  )
}
