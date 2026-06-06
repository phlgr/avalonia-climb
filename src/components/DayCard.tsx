import { localeTag, verdictWord, weatherLabel } from '../i18n'
import type { DayForecast } from '../lib/scoring'
import { formatDayLabel, formatWindow } from '../lib/time'
import { m } from '../paraglide/messages.js'
import { ScoreInfo } from './ScoreInfo'
import { WeatherGlyph } from './WeatherGlyph'

/** One day in the 7-day forecast — an almanac ledger row. */
export function DayCard({ day, today }: { day: DayForecast; today: string }) {
  const { weekday, day: dom } = formatDayLabel(day.date, today, localeTag(), m.day_today())
  return (
    <article className={`day day--${day.light}`}>
      <WeatherGlyph code={day.weatherCode} className="day-glyph" />
      <div className="day-body">
        <div className="day-top">
          <span className="day-when">
            <span className="day-weekday">{weekday}</span>
            <span className="day-dom">{dom}</span>
          </span>
          <span className="day-grade">
            <span className="day-verdict">{verdictWord(day.light)}</span>
            <span className="day-score">{day.bestScore}</span>
            <ScoreInfo breakdown={day.breakdown} align="end" />
          </span>
        </div>
        <div className="day-stats">
          <span>{weatherLabel(day.weatherCode)}</span>
          <span>
            <b>{Math.round(day.tMaxC)}°</b> {Math.round(day.tMinC)}°
          </span>
          <span className="day-window">
            {day.window ? formatWindow(day.window.startHour, day.window.endHour) : '—'}
          </span>
          <span>
            {day.precipMm} mm{day.maxPrecipProb > 0 ? ` · ${day.maxPrecipProb}%` : ''}
          </span>
        </div>
      </div>
    </article>
  )
}
