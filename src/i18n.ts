// Bridges the app's dynamic values (scoring reason codes, WMO weather codes,
// locale-aware date formatting) to Paraglide's compiled, type-safe messages.
import type { RockType } from './config'
import type { Light, Reason } from './lib/scoring'
import { m } from './paraglide/messages.js'
import { getLocale } from './paraglide/runtime.js'

/** BCP-47 tag for Intl date formatting, derived from the active locale. */
export function localeTag(): string {
  return getLocale() === 'de' ? 'de-DE' : 'en-GB'
}

/** Localized name of a rock type. */
export function rockName(rock: RockType): string {
  switch (rock) {
    case 'sandstone':
      return m.rock_sandstone()
    case 'gritstone':
      return m.rock_gritstone()
    case 'conglomerate':
      return m.rock_conglomerate()
    case 'limestone':
      return m.rock_limestone()
    case 'granite':
      return m.rock_granite()
    case 'gneiss':
      return m.rock_gneiss()
    case 'basalt':
      return m.rock_basalt()
  }
}

export function lightLabel(light: Light): string {
  return light === 'green' ? m.light_green() : light === 'yellow' ? m.light_yellow() : m.light_red()
}

export function lightTagline(light: Light): string {
  return light === 'green'
    ? m.tagline_green()
    : light === 'yellow'
      ? m.tagline_yellow()
      : m.tagline_red()
}

/** Turn a language-neutral scoring reason into a localized string. */
export function reasonText(r: Reason): string {
  switch (r.code) {
    case 'rainingNow':
      return m.reason_raining_now()
    case 'wetInside':
      return m.reason_wet_inside()
    case 'wetInsideWait':
      return m.reason_wet_inside_wait()
    case 'tempPrime':
      return m.reason_temp_prime({ temp: r.temp })
    case 'tempCold':
      return m.reason_temp_cold({ temp: r.temp })
    case 'tempHot':
      return m.reason_temp_hot({ temp: r.temp })
    case 'tempWarm':
      return m.reason_temp_warm({ temp: r.temp })
    case 'tempCool':
      return m.reason_temp_cool({ temp: r.temp })
    case 'airDry':
      return m.reason_air_dry({ rh: r.rh })
    case 'airHumid':
      return m.reason_air_humid({ rh: r.rh })
    case 'surfaceDamp':
      return m.reason_surface_damp()
    case 'rockDry':
      return m.reason_rock_dry()
    case 'windStrong':
      return m.reason_wind_strong({ wind: r.wind })
    case 'rainSoon':
      return m.reason_rain_soon({ hours: r.hours })
  }
}

/** Localized short label for a WMO weather code. */
export function weatherLabel(code: number): string {
  if (code === 0) return m.weather_clear()
  if (code <= 2) return m.weather_partly_cloudy()
  if (code === 3) return m.weather_overcast()
  if (code <= 48) return m.weather_fog()
  if (code <= 57) return m.weather_drizzle()
  if (code <= 67) return m.weather_rain()
  if (code <= 77) return m.weather_snow()
  if (code <= 82) return m.weather_rain_showers()
  if (code <= 86) return m.weather_snow_showers()
  return m.weather_thunderstorm()
}
