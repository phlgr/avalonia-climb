import { createFileRoute } from '@tanstack/react-router'
import { DayCard } from '../components/DayCard'
import { HourlyStrip, type HourTick } from '../components/HourlyStrip'
import { MetricGrid } from '../components/MetricGrid'
import { TrafficLight } from '../components/TrafficLight'
import { Legend } from '../components/Ui'
import { lightTagline, reasonText } from '../i18n'
import type { DayForecast, Light, Reason } from '../lib/scoring'
import type { HourPoint } from '../lib/weather'

// A dev gallery to eyeball every verdict state at once (the live page only ever
// shows today's real weather). Not linked in the nav — open /preview directly.
export const Route = createFileRoute('/preview')({ component: PreviewView })

interface Sample {
  light: Light
  score: number
  point: HourPoint
  reasons: Reason[]
}

const SAMPLES: Sample[] = [
  {
    light: 'green',
    score: 84,
    point: {
      time: '2026-06-09T11:00',
      tempC: 8,
      humidity: 55,
      precipMm: 0,
      precipProb: 5,
      windKmh: 15,
      weatherCode: 0,
      et0: 0.3,
    },
    reasons: [{ code: 'rockDry' }, { code: 'tempPrime', temp: 8 }, { code: 'airDry', rh: 55 }],
  },
  {
    light: 'yellow',
    score: 54,
    point: {
      time: '2026-06-10T13:00',
      tempC: 16,
      humidity: 78,
      precipMm: 0,
      precipProb: 40,
      windKmh: 8,
      weatherCode: 3,
      et0: 0.18,
    },
    reasons: [
      { code: 'surfaceDamp' },
      { code: 'tempWarm', temp: 16 },
      { code: 'airHumid', rh: 78 },
    ],
  },
  {
    light: 'red',
    score: 0,
    point: {
      time: '2026-06-11T10:00',
      tempC: 12,
      humidity: 92,
      precipMm: 0.6,
      precipProb: 90,
      windKmh: 5,
      weatherCode: 61,
      et0: 0.05,
    },
    reasons: [{ code: 'wetInside' }, { code: 'wetInsideWait' }, { code: 'rainSoon', hours: 2 }],
  },
]

const TODAY = '2026-06-06'

const DAYS: DayForecast[] = [
  {
    date: '2026-06-09',
    light: 'green',
    bestScore: 84,
    window: { startHour: 9, endHour: 18 },
    tMinC: 6,
    tMaxC: 14,
    precipMm: 0,
    maxPrecipProb: 5,
    weatherCode: 0,
  },
  {
    date: '2026-06-10',
    light: 'yellow',
    bestScore: 54,
    window: { startHour: 12, endHour: 16 },
    tMinC: 10,
    tMaxC: 19,
    precipMm: 0.2,
    maxPrecipProb: 40,
    weatherCode: 3,
  },
  {
    date: '2026-06-11',
    light: 'red',
    bestScore: 0,
    window: null,
    tMinC: 9,
    tMaxC: 13,
    precipMm: 6.4,
    maxPrecipProb: 90,
    weatherCode: 61,
  },
]

const HOURS: HourTick[] = [
  ['red', 8],
  ['red', 9],
  ['yellow', 10],
  ['yellow', 11],
  ['green', 12],
  ['green', 13],
  ['green', 14],
  ['green', 15],
  ['yellow', 16],
  ['yellow', 17],
  ['red', 18],
  ['red', 19],
].map(([light, hour]) => ({ light: light as Light, hour: hour as number, isNow: hour === 13 }))

// Styling lives here (not in styles.css) so it ships only with the dev gallery.
const PREVIEW_CSS = `
.preview { display: flex; flex-direction: column; }
.preview-state {
  position: relative;
  margin-top: 0.5rem;
  padding: 0.5rem 1rem 1.25rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--paper-card) 55%, transparent);
}
.preview-tag {
  display: inline-block;
  margin: 0.6rem 0 0.2rem;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.preview-tag--green { color: var(--go); }
.preview-tag--yellow { color: var(--almost); }
.preview-tag--red { color: var(--no); }
@media (prefers-reduced-motion: no-preference) {
  .preview > * { animation: rise 0.5s both cubic-bezier(0.22, 1, 0.36, 1); }
  .preview > :nth-child(2) { animation-delay: 0.06s; }
  .preview > :nth-child(3) { animation-delay: 0.12s; }
  .preview > :nth-child(n + 4) { animation-delay: 0.18s; }
}
`

function PreviewView() {
  // Dev-only gallery: in a production build `import.meta.env.DEV` is statically
  // false, so everything below is dead code and rollup tree-shakes it (plus the
  // mock data and PREVIEW_CSS) out of the bundle. The route stays registered so
  // types resolve.
  if (!import.meta.env.DEV) return null
  return (
    <div className="preview">
      <style>{PREVIEW_CSS}</style>
      <div className="section-head">
        <h2>Verdict states</h2>
      </div>
      {SAMPLES.map((s) => (
        <section className={`preview-state preview-state--${s.light}`} key={s.light}>
          <span className={`preview-tag preview-tag--${s.light}`}>{s.light}</span>
          <TrafficLight light={s.light} score={s.score} />
          <p className="tagline">{lightTagline(s.light)}</p>
          <ul className="reasons">
            {s.reasons.map((r) => (
              <li key={r.code}>{reasonText(r)}</li>
            ))}
          </ul>
          <MetricGrid point={s.point} />
        </section>
      ))}

      <div className="section-head">
        <h2>Forecast & hourly</h2>
      </div>
      <div className="days">
        {DAYS.map((d) => (
          <DayCard key={d.date} day={d} today={TODAY} />
        ))}
      </div>
      <HourlyStrip ticks={HOURS} />
      <Legend />
    </div>
  )
}
