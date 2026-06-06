import { CRAG } from '../config'

// Open-Meteo: free, no API key, returns local times when timezone=auto.
// past_days=2 lets us see recent rain (is the rock still wet?); forecast_days=7
// drives the forecast view.
const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'

const HOURLY_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'precipitation',
  'precipitation_probability',
  'wind_speed_10m',
  'weather_code',
  // FAO-56 reference evapotranspiration (mm/h) — our measure of evaporative
  // demand (sun + temp + wind + humidity), i.e. how fast the rock dries.
  'et0_fao_evapotranspiration',
] as const

export interface HourPoint {
  /** Local ISO timestamp, e.g. "2026-06-06T14:00". */
  time: string
  tempC: number
  humidity: number
  /** Precipitation for the hour, mm. */
  precipMm: number
  /** Probability of precipitation, %. */
  precipProb: number
  windKmh: number
  weatherCode: number
  /** Reference evapotranspiration for the hour, mm — the rock's drying power. */
  et0: number
}

export interface WeatherData {
  timezone: string
  /** Chronological hourly points spanning the past 3 days through 7 days ahead. */
  hours: HourPoint[]
}

interface OpenMeteoResponse {
  timezone: string
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
    precipitation: number[]
    precipitation_probability: number[]
    wind_speed_10m: number[]
    weather_code: number[]
    et0_fao_evapotranspiration: number[]
  }
}

export async function fetchWeather(): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(CRAG.latitude),
    longitude: String(CRAG.longitude),
    hourly: HOURLY_VARS.join(','),
    past_days: '3',
    forecast_days: '7',
    timezone: 'auto',
    wind_speed_unit: 'kmh',
  })

  const res = await fetch(`${ENDPOINT}?${params}`)
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed: ${res.status} ${res.statusText}`)
  }
  const data = (await res.json()) as OpenMeteoResponse
  const h = data.hourly

  const hours: HourPoint[] = h.time.map((time, i) => ({
    time,
    tempC: h.temperature_2m[i],
    humidity: h.relative_humidity_2m[i],
    precipMm: h.precipitation[i],
    precipProb: h.precipitation_probability[i] ?? 0,
    windKmh: h.wind_speed_10m[i],
    weatherCode: h.weather_code[i],
    et0: Math.max(0, h.et0_fao_evapotranspiration[i] ?? 0),
  }))

  return { timezone: data.timezone, hours }
}
