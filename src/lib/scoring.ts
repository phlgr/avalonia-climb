import type { RockProfile } from '../config'
import type { HourPoint } from './weather'

export type Light = 'green' | 'yellow' | 'red'

export interface Assessment {
  light: Light
  /** 0–100 overall conditions score (only meaningful when not a hard red). */
  score: number
  /** Ordered, human-readable explanations — most important first. */
  reasons: string[]
  rockWet: boolean
  rainingNow: boolean
}

const RAIN_MM = 0.2 // per-hour precip considered enough to wet the rock
const INCOMING_HOURS = 3 // look-ahead window for imminent rain

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

/** 1 inside the ideal band, ramping to 0 at the edges of the ok band. */
function bandScore(v: number, ideal: [number, number], ok: [number, number]): number {
  const [a, b] = ideal
  const [lo, hi] = ok
  if (v >= a && v <= b) return 1
  if (v < a) return clamp01((v - lo) / (a - lo))
  return clamp01((hi - v) / (hi - b))
}

function humidityScore(h: number, greasyPct: number): number {
  const great = greasyPct - 20 // fully grippy below here
  if (h <= great) return 1
  if (h >= 97) return 0
  return clamp01((97 - h) / (97 - great))
}

function windScore(kmh: number): number {
  if (kmh <= 30) return 1
  if (kmh >= 50) return 0.25
  return clamp01(1 - ((kmh - 30) / 20) * 0.75)
}

/** Hours since the last hour (at or before `index`) with meaningful rain. ∞ if none seen. */
function hoursSinceRain(hours: HourPoint[], index: number): number {
  for (let i = index; i >= 0; i--) {
    if (hours[i].precipMm >= RAIN_MM) return index - i
  }
  return Number.POSITIVE_INFINITY
}

/** mm of rain expected within the next `window` hours after `index`. */
function rainSoonMm(hours: HourPoint[], index: number, window: number): number {
  let mm = 0
  for (let i = index + 1; i <= index + window && i < hours.length; i++) {
    mm += hours[i].precipMm
  }
  return mm
}

function fmtAgo(h: number): string {
  if (!Number.isFinite(h)) return 'no recent rain'
  if (h === 0) return 'raining now'
  if (h === 1) return '1h ago'
  return `${h}h ago`
}

/** Assess a single hourly point against the rock profile. */
export function assessHour(hours: HourPoint[], index: number, rock: RockProfile): Assessment {
  const p = hours[index]
  const sinceRain = hoursSinceRain(hours, index)
  const rainingNow = p.precipMm >= RAIN_MM
  // Seepage rock (limestone/conglomerate) stays damp well past the surface drying.
  const wetWindow = rock.seepage ? rock.dryingHours * 1.5 : rock.dryingHours
  const rockWet = rainingNow || sinceRain < wetWindow

  // ── Hard reds: nothing about nice air overrides wet fragile rock or active rain.
  if (rainingNow) {
    return {
      light: 'red',
      score: 0,
      reasons: ['Raining now — rock is wet'],
      rockWet: true,
      rainingNow,
    }
  }
  if (rock.fragileWhenWet && rockWet) {
    const need = Math.max(0, Math.ceil(rock.dryingHours - sinceRain))
    return {
      light: 'red',
      score: 0,
      reasons: [
        `Rock likely still wet (rain ${fmtAgo(sinceRain)}) — climbing it now damages holds`,
        `~${need}h more drying needed`,
      ],
      rockWet: true,
      rainingNow,
    }
  }

  // ── Component scores (0–1).
  const tScore = bandScore(p.tempC, rock.idealTempC, rock.okTempC)
  const hScore = humidityScore(p.humidity, rock.humidityGreasyPct)
  const wScore = windScore(p.windKmh)
  const dryScore = rockWet ? clamp01(sinceRain / rock.dryingHours) : 1

  const score = Math.round(100 * (0.35 * tScore + 0.25 * hScore + 0.3 * dryScore + 0.1 * wScore))

  // ── Reasons, most decisive first.
  const reasons: string[] = []
  const [okLo, okHi] = rock.okTempC
  if (tScore >= 0.85) reasons.push(`Prime friction temps (${Math.round(p.tempC)}°C)`)
  else if (p.tempC < okLo) reasons.push(`Bitterly cold (${Math.round(p.tempC)}°C)`)
  else if (p.tempC > okHi) reasons.push(`Too warm for friction (${Math.round(p.tempC)}°C)`)
  else if (p.tempC > rock.idealTempC[1]) reasons.push(`A bit warm (${Math.round(p.tempC)}°C)`)
  else reasons.push(`Cool-ish (${Math.round(p.tempC)}°C)`)

  if (hScore >= 0.8) reasons.push(`Dry air (${p.humidity}% RH) — grippy`)
  else if (hScore <= 0.45) reasons.push(`Humid (${p.humidity}% RH) — holds may feel greasy`)

  if (rockWet) reasons.push(`Rock drying out (last rain ${fmtAgo(sinceRain)})`)
  else if (Number.isFinite(sinceRain)) reasons.push(`Rock dry (last rain ${fmtAgo(sinceRain)})`)

  if (wScore <= 0.5) reasons.push(`Strong wind (${Math.round(p.windKmh)} km/h)`)

  const soon = rainSoonMm(hours, index, INCOMING_HOURS)
  if (soon >= RAIN_MM) reasons.push(`Rain expected within ${INCOMING_HOURS}h`)

  // ── Light. Slick (non-fragile but wet) rock or incoming rain can't be green.
  let light: Light = score >= 68 ? 'green' : score >= 45 ? 'yellow' : 'red'
  if (light === 'green' && (rockWet || soon >= RAIN_MM)) light = 'yellow'

  return { light, score, reasons, rockWet, rainingNow }
}

/** Index of the hour matching `nowIso` (local "YYYY-MM-DDTHH:00"); nearest past hour otherwise. */
export function findNowIndex(hours: HourPoint[], nowIso: string): number {
  const exact = hours.findIndex((h) => h.time === nowIso)
  if (exact !== -1) return exact
  let idx = 0
  for (let i = 0; i < hours.length; i++) {
    if (hours[i].time <= nowIso) idx = i
    else break
  }
  return idx
}

export interface DayForecast {
  /** Local date "YYYY-MM-DD". */
  date: string
  /** Best light achievable in the daytime window. */
  light: Light
  bestScore: number
  /** Best contiguous daytime window of green/yellow hours, or null if none. */
  window: { startHour: number; endHour: number } | null
  tMinC: number
  tMaxC: number
  precipMm: number
  maxPrecipProb: number
  /** Representative weather code (midday-ish). */
  weatherCode: number
}

/** Build per-day forecasts from `fromDate` onward, scoring each day's daylight window. */
export function buildForecast(
  hours: HourPoint[],
  rock: RockProfile,
  dayStart: number,
  dayEnd: number,
  fromDate: string,
): DayForecast[] {
  const byDate = new Map<string, number[]>() // date -> hour indices
  hours.forEach((h, i) => {
    const date = h.time.slice(0, 10)
    if (date < fromDate) return
    const list = byDate.get(date)
    if (list) list.push(i)
    else byDate.set(date, [i])
  })

  const days: DayForecast[] = []
  for (const [date, indices] of byDate) {
    const dayHours = indices.filter((i) => {
      const hour = Number(hours[i].time.slice(11, 13))
      return hour >= dayStart && hour <= dayEnd
    })
    if (dayHours.length === 0) continue

    let best: Assessment | null = null
    let bestHour = dayStart
    const lights: { hour: number; light: Light }[] = []
    for (const i of dayHours) {
      const a = assessHour(hours, i, rock)
      const hour = Number(hours[i].time.slice(11, 13))
      lights.push({ hour, light: a.light })
      if (!best || a.score > best.score) {
        best = a
        bestHour = hour
      }
    }

    // Longest contiguous run of non-red hours, biased toward the best hour.
    let window: DayForecast['window'] = null
    let runStart: number | null = null
    for (let k = 0; k <= lights.length; k++) {
      const ok = k < lights.length && lights[k].light !== 'red'
      if (ok && runStart === null) runStart = lights[k].hour
      if (!ok && runStart !== null) {
        const end = lights[k - 1].hour
        if (runStart <= bestHour && bestHour <= end) window = { startHour: runStart, endHour: end }
        else if (!window) window = { startHour: runStart, endHour: end }
        runStart = null
      }
    }

    const temps = dayHours.map((i) => hours[i].tempC)
    const allDay = indices // full 24h for precip totals
    const precipMm = allDay.reduce((s, i) => s + hours[i].precipMm, 0)
    const maxPrecipProb = Math.max(...allDay.map((i) => hours[i].precipProb))
    const middayIdx =
      dayHours.find((i) => Number(hours[i].time.slice(11, 13)) === 13) ?? dayHours[0]

    days.push({
      date,
      light: best ? best.light : 'red',
      bestScore: best ? best.score : 0,
      window,
      tMinC: Math.min(...temps),
      tMaxC: Math.max(...temps),
      precipMm: Math.round(precipMm * 10) / 10,
      maxPrecipProb,
      weatherCode: hours[middayIdx].weatherCode,
    })
  }

  days.sort((a, b) => a.date.localeCompare(b.date))
  return days.slice(0, 7)
}
