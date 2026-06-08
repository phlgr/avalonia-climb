import type { RockProfile } from '../config'
import type { HourPoint } from './weather'

export type Light = 'green' | 'yellow' | 'red'

/**
 * A reason is a language-neutral code plus any numbers to interpolate. The UI
 * turns it into a localized string, so the scoring stays free of display text.
 */
export type Reason =
  | { code: 'rainingNow' }
  | { code: 'wetInside' }
  | { code: 'wetInsideWait' }
  | { code: 'tempPrime'; temp: number }
  | { code: 'tempCold'; temp: number }
  | { code: 'tempHot'; temp: number }
  | { code: 'tempWarm'; temp: number }
  | { code: 'tempCool'; temp: number }
  | { code: 'airDry'; rh: number }
  | { code: 'airHumid'; rh: number }
  | { code: 'surfaceDamp' }
  | { code: 'rockDry' }
  | { code: 'windStrong'; wind: number }
  | { code: 'rainSoon'; hours: number }

/** The four factors blended into the conditions score. */
export type ScoreFactor = 'temp' | 'humidity' | 'dryness' | 'wind'

/** One factor's contribution to the weighted score, for the "how it adds up" popover. */
interface ScorePart {
  factor: ScoreFactor
  /** Relative weight of this factor (0–1). */
  weight: number
  /** This factor's own score (0–1). */
  sub: number
  /** Points this factor contributes to the 0–100 total. */
  points: number
}

/** How a score comes together: the weighted blend, plus any hard-rule override. */
export interface Breakdown {
  parts: ScorePart[]
  /** Weighted-blend total (0–100), before any hard-red override. */
  blend: number
  /** A hard rule forced the score to red, overriding the blend. */
  override?: 'rainingNow' | 'wetInside'
}

export interface Assessment {
  light: Light
  /** 0–100 overall conditions score (only meaningful when not a hard red). */
  score: number
  /** Ordered reasons (language-neutral codes), most important first. */
  reasons: Reason[]
  /** Per-factor breakdown of how the score was reached. */
  breakdown: Breakdown
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
/**
 * Shortest contiguous run of non-red daylight hours that counts as a usable
 * session. A day's verdict comes from its best *qualifying* window — so a brief
 * gap between showers (the rock momentarily reads dry) can't make a rainy day
 * look like a "maybe". Below this, the day is a hard red.
 */
const MIN_WINDOW_HOURS = 3

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

  // ── Component scores (0–1), always computed so the breakdown is available even
  // when a hard rule forces red.
  const tScore = bandScore(p.tempC, rock.idealTempC, rock.okTempC)
  const hScore = humidityScore(p.humidity, rock.humidityGreasyPct)
  const wScore = windScore(p.windKmh)
  const dryScore = w.surfaceWet ? clamp01(1 - w.surfaceMm / FILM_FULL_MM) : 1

  const part = (factor: ScoreFactor, weight: number, sub: number): ScorePart => ({
    factor,
    weight,
    sub,
    points: Math.round(100 * weight * sub),
  })
  const parts: ScorePart[] = [
    part('temp', SCORE_WEIGHTS.temp, tScore),
    part('dryness', SCORE_WEIGHTS.dryness, dryScore),
    part('humidity', SCORE_WEIGHTS.humidity, hScore),
    part('wind', SCORE_WEIGHTS.wind, wScore),
  ]
  const score = Math.round(
    100 *
      (SCORE_WEIGHTS.temp * tScore +
        SCORE_WEIGHTS.humidity * hScore +
        SCORE_WEIGHTS.dryness * dryScore +
        SCORE_WEIGHTS.wind * wScore),
  )
  const breakdown: Breakdown = { parts, blend: score }

  // ── Hard reds: nothing about nice air overrides active rain or wet fragile rock.
  if (rainingNow) {
    return {
      light: 'red',
      score: 0,
      reasons: [{ code: 'rainingNow' }],
      breakdown: { ...breakdown, override: 'rainingNow' },
    }
  }
  // Fragile rock (sandstone/grit/conglomerate) must never be climbed damp —
  // wet holds snap and the crag scars. Any moisture, internal or on the
  // surface, is a hard NO, regardless of how nice the air is.
  if (rock.fragileWhenWet && (w.coreUnsafe || w.surfaceWet)) {
    return {
      light: 'red',
      score: 0,
      reasons: w.coreUnsafe
        ? [{ code: 'wetInside' }, { code: 'wetInsideWait' }]
        : [{ code: 'surfaceDamp' }],
      breakdown: { ...breakdown, override: 'wetInside' },
    }
  }

  // ── Reasons, most decisive first.
  const reasons: Reason[] = []
  const [okLo, okHi] = rock.okTempC
  const temp = Math.round(p.tempC)
  if (tScore >= 0.85) reasons.push({ code: 'tempPrime', temp })
  else if (p.tempC < okLo) reasons.push({ code: 'tempCold', temp })
  else if (p.tempC > okHi) reasons.push({ code: 'tempHot', temp })
  else if (p.tempC > rock.idealTempC[1]) reasons.push({ code: 'tempWarm', temp })
  else reasons.push({ code: 'tempCool', temp })

  if (hScore >= 0.8) reasons.push({ code: 'airDry', rh: p.humidity })
  else if (hScore <= 0.45) reasons.push({ code: 'airHumid', rh: p.humidity })

  if (w.surfaceWet) reasons.push({ code: 'surfaceDamp' })
  else reasons.push({ code: 'rockDry' })

  if (wScore <= 0.5) reasons.push({ code: 'windStrong', wind: Math.round(p.windKmh) })

  const soon = rainSoonMm(hours, index, INCOMING_HOURS)
  if (soon >= RAIN_MM) reasons.push({ code: 'rainSoon', hours: INCOMING_HOURS })

  // ── It's dry, so it's climbable: being dry is never on its own a reason to
  // stay off. Friction quality only decides good (green) vs marginal (yellow);
  // a slick surface (on rock that's sound when wet) or incoming rain holds it
  // to marginal, but never red — only wet rock is a hard no.
  let light: Light = score >= GREEN_MIN ? 'green' : 'yellow'
  if (light === 'green' && (w.surfaceWet || soon >= RAIN_MM)) light = 'yellow'

  return { light, score, reasons, breakdown }
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
  /** Breakdown of the best-scoring hour, for the "how it adds up" popover. */
  breakdown: Breakdown
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

    const assessed = dayHours.map((i) => ({
      hour: Number(hours[i].time.slice(11, 13)),
      a: assessHour(hours, i, rock, wet),
    }))

    // Group daylight into contiguous non-red runs, then keep only those long
    // enough to be a real session (MIN_WINDOW_HOURS). The day's verdict is the
    // best hour of the strongest qualifying window — a lone good hour between
    // showers no longer speaks for the whole day.
    interface Run {
      startHour: number
      endHour: number
      length: number
      best: Assessment
    }
    const runs: Run[] = []
    let current: { hour: number; a: Assessment }[] = []
    const flush = () => {
      if (current.length === 0) return
      const best = current.reduce((m, x) => (x.a.score > m.a.score ? x : m)).a
      runs.push({
        startHour: current[0].hour,
        endHour: current[current.length - 1].hour,
        length: current.length,
        best,
      })
      current = []
    }
    for (const x of assessed) {
      if (x.a.light === 'red') flush()
      else current.push(x)
    }
    flush()

    const qualifying = runs.filter((r) => r.length >= MIN_WINDOW_HOURS)
    const chosen = qualifying.reduce<Run | null>(
      (m, r) => (!m || r.best.score > m.best.score ? r : m),
      null,
    )
    const best = chosen ? chosen.best : null
    const window: DayForecast['window'] = chosen
      ? { startHour: chosen.startHour, endHour: chosen.endHour }
      : null

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
      breakdown: best ? best.breakdown : { parts: [], blend: 0 },
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
