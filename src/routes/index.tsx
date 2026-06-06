import { createFileRoute } from '@tanstack/react-router'
import { HourlyStrip, type HourTick } from '../components/HourlyStrip'
import { MetricGrid } from '../components/MetricGrid'
import { LIGHT_TAGLINE, TrafficLight } from '../components/TrafficLight'
import { ErrorBox, Legend, Loading } from '../components/Ui'
import { activeRockProfile, CRAG } from '../config'
import { assessHour, computeWetness, dryEta, findNowIndex } from '../lib/scoring'
import { formatEta, localNowHourIso, todayLocalDate } from '../lib/time'
import { useWeather } from '../lib/useWeather'

export const Route = createFileRoute('/')({ component: NowView })

function NowView() {
  const { data, isLoading, isError, error, refetch, isFetching } = useWeather()
  const rock = activeRockProfile()

  if (isLoading) return <Loading />
  if (isError || !data) {
    return (
      <ErrorBox message={(error as Error)?.message ?? 'Network error'} onRetry={() => refetch()} />
    )
  }

  const nowIso = localNowHourIso()
  const today = todayLocalDate()
  const wet = computeWetness(data.hours, rock)
  const idx = findNowIndex(data.hours, nowIso)
  const now = assessHour(data.hours, idx, rock, wet)
  const point = data.hours[idx]
  const eta = dryEta(data.hours, idx, rock, wet)

  const ticks: HourTick[] = data.hours
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => {
      const hour = Number(h.time.slice(11, 13))
      return h.time.slice(0, 10) === today && hour >= CRAG.dayStartHour && hour <= CRAG.dayEndHour
    })
    .map(({ h, i }) => ({
      hour: Number(h.time.slice(11, 13)),
      light: assessHour(data.hours, i, rock, wet).light,
      isNow: i === idx,
    }))

  return (
    <section className="now">
      <TrafficLight light={now.light} score={now.score} />
      <p className="tagline">{LIGHT_TAGLINE[now.light]}</p>

      {eta && (
        <p className="eta">
          🪨 Likely dry around <strong>{formatEta(eta.timeIso, today)}</strong>
          <span className="eta-sub"> · ~{eta.hours}h of forecast drying</span>
        </p>
      )}

      <ul className="reasons">
        {now.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>

      <MetricGrid point={point} />

      <div className="section-head">
        <h2>Today's window</h2>
        {isFetching && <span className="refreshing">refreshing…</span>}
      </div>
      <HourlyStrip ticks={ticks} />
      <Legend />
    </section>
  )
}
