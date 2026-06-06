import { createFileRoute } from '@tanstack/react-router'
import { HourlyStrip, type HourTick } from '../components/HourlyStrip'
import { MetricGrid } from '../components/MetricGrid'
import { TrafficLight } from '../components/TrafficLight'
import { ErrorBox, Legend, Loading } from '../components/Ui'
import { WeatherGlyph } from '../components/WeatherGlyph'
import { activeRockProfile, CRAG } from '../config'
import { lightTagline, localeTag, reasonText } from '../i18n'
import { assessHour, computeWetness, dryEta, findNowIndex, nextWet } from '../lib/scoring'
import { formatEta, localNowHourIso, todayLocalDate } from '../lib/time'
import { useWeather } from '../lib/useWeather'
import { m } from '../paraglide/messages.js'

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
  const climbableIdx = idx + (eta?.hours ?? 0)
  const windowEnd = nextWet(data.hours, climbableIdx, rock, wet)
  const etaLabel = (iso: string) => formatEta(iso, today, localeTag(), m.day_today())

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
      <p className="tagline">{lightTagline(now.light)}</p>

      {eta ? (
        <div className="outlook outlook--warn">
          <WeatherGlyph code={2} className="outlook-glyph" />
          <p className="outlook-body">
            {m.outlook_dry_around({ label: etaLabel(eta.timeIso) })}{' '}
            <span className="outlook-sub">
              —{' '}
              {windowEnd
                ? windowEnd.hours <= 6
                  ? m.outlook_window_brief({ label: etaLabel(windowEnd.timeIso) })
                  : m.outlook_window_good({ label: etaLabel(windowEnd.timeIso) })
                : m.outlook_dry_spell()}
            </span>
          </p>
        </div>
      ) : windowEnd ? (
        <div className="outlook outlook--bad">
          <WeatherGlyph code={61} className="outlook-glyph" />
          <p className="outlook-body">
            {m.outlook_rain_returns({ label: etaLabel(windowEnd.timeIso), hours: windowEnd.hours })}
          </p>
        </div>
      ) : (
        <div className="outlook outlook--good">
          <WeatherGlyph code={0} className="outlook-glyph" />
          <p className="outlook-body">{m.outlook_no_rain()}</p>
        </div>
      )}

      <ul className="reasons">
        {now.reasons.map((r) => (
          <li key={r.code}>{reasonText(r)}</li>
        ))}
      </ul>

      <MetricGrid point={point} />

      <div className="section-head">
        <h2>{m.now_today_window()}</h2>
        {isFetching && <span className="refreshing">{m.now_refreshing()}</span>}
      </div>
      <HourlyStrip ticks={ticks} />
      <Legend />
    </section>
  )
}
