import { createFileRoute } from '@tanstack/react-router'
import { DayCard } from '../components/DayCard'
import { ErrorBox, Legend, Loading } from '../components/Ui'
import { activeRockProfile, CRAG } from '../config'
import { buildForecast, computeWetness } from '../lib/scoring'
import { todayLocalDate } from '../lib/time'
import { useWeather } from '../lib/useWeather'
import { m } from '../paraglide/messages.js'

export const Route = createFileRoute('/forecast')({ component: ForecastView })

function ForecastView() {
  const { data, isLoading, isError, error, refetch } = useWeather()
  const rock = activeRockProfile()

  if (isLoading) return <Loading />
  if (isError || !data) {
    return (
      <ErrorBox message={(error as Error)?.message ?? 'Network error'} onRetry={() => refetch()} />
    )
  }

  const today = todayLocalDate()
  const wet = computeWetness(data.hours, rock)
  const days = buildForecast(data.hours, rock, CRAG.dayStartHour, CRAG.dayEndHour, today, wet)

  return (
    <section className="forecast">
      <div className="section-head">
        <h2>{m.forecast_title()}</h2>
      </div>
      <p className="muted forecast-note">
        {m.forecast_note({ start: CRAG.dayStartHour, end: CRAG.dayEndHour })}
      </p>
      <div className="days">
        {days.map((d) => (
          <DayCard key={d.date} day={d} today={today} />
        ))}
      </div>
      <Legend />
    </section>
  )
}
