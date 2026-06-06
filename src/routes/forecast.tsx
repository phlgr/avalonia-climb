import { createFileRoute } from '@tanstack/react-router'
import { DayCard } from '../components/DayCard'
import { ErrorBox, Legend, Loading } from '../components/Ui'
import { activeRockProfile, CRAG } from '../config'
import { buildForecast } from '../lib/scoring'
import { todayLocalDate } from '../lib/time'
import { useWeather } from '../lib/useWeather'

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
  const days = buildForecast(data.hours, rock, CRAG.dayStartHour, CRAG.dayEndHour, today)

  return (
    <section className="forecast">
      <div className="section-head">
        <h2>Next 7 days</h2>
      </div>
      <p className="muted forecast-note">
        Best light expected during daylight ({CRAG.dayStartHour}:00–{CRAG.dayEndHour}:00), with the
        window when conditions are on.
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
