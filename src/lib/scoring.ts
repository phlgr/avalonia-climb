import type { RockProfile } from '../config'
import type { HourPoint } from './weather'

export type Light = 'green' | 'yellow' | 'red'

export interface Assessment {
  light: Light
  /** 0–100 overall conditions score (only meaningful when not a hard red). */
  score: number
  /** Ordered, human-readable explanations — most important first. */
  reasons: string[]
}

const RAIN_MM = 0.2 // per-hour precip considered enough to wet the rock
const SURFACE_WET_MM = 0.1 // surface film above this reads as damp/slick
const FILM_FULL_MM = 1.5 // surface film at which dryness score bottoms out
const FREEZE_EVAP_FACTOR = 0.15 // evaporation nearly stops at/below freezing

/** Look-ahead window (hours) for warning about imminent rain. */
export const INCOMING_HOURS = 3
/** Relative weight of each factor in the 0–100 conditions score (sums to 1). */
export const SCORE_WEIGHTS = { temp: 0.35, humidity: 0.25, dryness: 0.3, wind: 0.1 } as const
/** Score at/above which the light is green; at/above YELLOW_MIN it's yellow; below, red. */
export const GREEN_MIN = 68
export const YELLOW_MIN = 45

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

// ── Drying model ────────────────────────────────────────────────────────────
// A two-reservoir water balance, stepped hourly across the whole series. Rain
// splits between a surface film (slickness; dries fast) and the rock's internal
// pores (the slow reservoir that keeps porous rock unsafe long after the surface
// looks dry). Both drain in proportion to FAO-56 reference evapotranspiration
// (ET₀) — the standard index of evaporative demand from sun, temp, wind and
// humidity — so "time to dry" reflects the actual forecast, not a fixed delay.

export interface Wetness {
  surfaceMm: number
  coreMm: number
  /** Surface is damp/slick. */
  surfaceWet: boolean
  /** Internal moisture is above the fragile-rock safety threshold. */
  coreUnsafe: boolean
}

/** Forward pass: surface-film and internal-moisture reservoirs for every hour. */
export function computeWetness(hours: HourPoint[], rock: RockProfile): Wetness[] {
  const out: Wetness[] = []
  let surface = 0
  let core = 0
  for (const h of hours) {
    const evap = h.tempC <= 0 ? h.et0 * FREEZE_EVAP_FACTOR : h.et0
    const soak = h.precipMm * rock.absorptivity
    const film = h.precipMm - soak
    surface = Math.max(0, surface + film - evap * rock.surfaceDryMult)
    core = Math.max(0, core + soak - evap * rock.coreDryMult)
    // Seepage rock weeps stored water back onto the surface, keeping it damp.
    const surfaceWet = surface > SURFACE_WET_MM || (rock.seepage && core > 0.5)
    out.push({
      surfaceMm: surface,
      coreMm: core,
      surfaceWet,
      coreUnsafe: core > rock.coreWetThresholdMm,
    })
  }
  return out
}

function rainSoonMm(hours: HourPoint[], index: number, window: number): number {
  let mm = 0
  for (let i = index + 1; i <= index + window && i < hours.length; i++) {
    mm += hours[i].precipMm
  }
  return mm
}

/** Assess a single hourly point against the rock profile and precomputed wetness. */
export function assessHour(
  hours: HourPoint[],
  index: number,
  rock: RockProfile,
  wet: Wetness[],
): Assessment {
  const p = hours[index]
  const w = wet[index]
  const rainingNow = p.precipMm >= RAIN_MM

  // ── Hard reds: nothing about nice air overrides active rain or wet fragile rock.
  if (rainingNow) {
    return { light: 'red', score: 0, reasons: ['Raining now — rock is wet'] }
  }
  if (rock.fragileWhenWet && w.coreUnsafe) {
    return {
      light: 'red',
      score: 0,
      reasons: [
        'Rock still wet inside — climbing it now breaks holds and damages the crag',
        'Internal moisture lingers after the surface looks dry — wait for it to clear',
      ],
    }
  }

  // ── Component scores (0–1).
  const tScore = bandScore(p.tempC, rock.idealTempC, rock.okTempC)
  const hScore = humidityScore(p.humidity, rock.humidityGreasyPct)
  const wScore = windScore(p.windKmh)
  const dryScore = w.surfaceWet ? clamp01(1 - w.surfaceMm / FILM_FULL_MM) : 1

  const score = Math.round(
    100 *
      (SCORE_WEIGHTS.temp * tScore +
        SCORE_WEIGHTS.humidity * hScore +
        SCORE_WEIGHTS.dryness * dryScore +
        SCORE_WEIGHTS.wind * wScore),
  )

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

  if (w.surfaceWet) reasons.push('Surface still damp — drying out')
  else reasons.push('Rock is dry')

  if (wScore <= 0.5) reasons.push(`Strong wind (${Math.round(p.windKmh)} km/h)`)

  const soon = rainSoonMm(hours, index, INCOMING_HOURS)
  if (soon >= RAIN_MM) reasons.push(`Rain expected within ${INCOMING_HOURS}h`)

  // ── Light. Slick surface or incoming rain can't be green.
  let light: Light = score >= GREEN_MIN ? 'green' : score >= YELLOW_MIN ? 'yellow' : 'red'
  if (light === 'green' && (w.surfaceWet || soon >= RAIN_MM)) light = 'yellow'

  return { light, score, reasons }
}

/**
 * Is the rock unclimbable at hour `index`? Raining, slick surface, or (for
 * fragile rock) saturated inside. Drives both the drying ETA and the dry window.
 */
function isWet(hours: HourPoint[], index: number, rock: RockProfile, wet: Wetness[]): boolean {
  return (
    hours[index].precipMm >= RAIN_MM ||
    wet[index].surfaceWet ||
    (rock.fragileWhenWet && wet[index].coreUnsafe)
  )
}

/** A point in the future, expressed both as an hour offset and an ISO timestamp. */
export interface ForecastPoint {
  hours: number
  timeIso: string
}

/**
 * Forward-search for when the rock becomes climbable again. Returns null if it's
 * already climbable, or if it won't dry within the forecast.
 */
export function dryEta(
  hours: HourPoint[],
  index: number,
  rock: RockProfile,
  wet: Wetness[],
): ForecastPoint | null {
  if (!isWet(hours, index, rock, wet)) return null
  for (let j = index + 1; j < hours.length; j++) {
    if (!isWet(hours, j, rock, wet)) return { hours: j - index, timeIso: hours[j].time }
  }
  return null
}

/** First hour at/after `index` when the rock goes wet again — i.e. the end of a dry window. */
export function nextWet(
  hours: HourPoint[],
  index: number,
  rock: RockProfile,
  wet: Wetness[],
): ForecastPoint | null {
  for (let j = index + 1; j < hours.length; j++) {
    if (isWet(hours, j, rock, wet)) return { hours: j - index, timeIso: hours[j].time }
  }
  return null
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
  wet: Wetness[],
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
      const a = assessHour(hours, i, rock, wet)
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
    const allDay = indices // full day for precip totals
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
