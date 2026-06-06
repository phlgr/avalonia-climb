// ── Crag + rock configuration ──────────────────────────────────────────────
// Everything location-specific lives here. To point this app at a different
// crag, change CRAG below (coordinates + rock type) and you're done — the
// scoring adapts to the rock via ROCK_PROFILES.

type RockType =
  | 'sandstone'
  | 'granite'
  | 'gneiss'
  | 'limestone'
  | 'gritstone'
  | 'basalt'
  | 'conglomerate'

export interface RockProfile {
  /** Hours of dry weather after meaningful rain before the rock climbs well again. */
  dryingHours: number
  /**
   * Climbing this rock wet/damp damages it and breaks holds (sandstone, grit,
   * conglomerate). When true and the rock is judged wet, conditions are hard-RED
   * regardless of how nice the air feels — an ethics + safety rule, not comfort.
   */
  fragileWhenWet: boolean
  /** Holds seepage in cracks/pockets/tufas long after the surface looks dry. */
  seepage: boolean
  /** Ideal air-temperature band for friction, °C. */
  idealTempC: [number, number]
  /** Still climbable band, °C — outside ideal but not a dealbreaker. */
  okTempC: [number, number]
  /** Relative humidity (%) above which holds get greasy and friction drops. */
  humidityGreasyPct: number
  /** One-line description shown in the UI. */
  blurb: string
}

// Sourced from climbing-ethics / friction research across rock types.
const ROCK_PROFILES: Record<RockType, RockProfile> = {
  sandstone: {
    dryingHours: 24,
    fragileWhenWet: true,
    seepage: false,
    idealTempC: [5, 15],
    okTempC: [-2, 20],
    humidityGreasyPct: 75,
    blurb: 'Never climb wet — holds snap and the rock is up to ~75% weaker when damp.',
  },
  granite: {
    dryingHours: 16,
    fragileWhenWet: false,
    seepage: false,
    idealTempC: [2, 14],
    okTempC: [-6, 22],
    humidityGreasyPct: 70,
    blurb: 'Sound when wet but slick; dries fast. Skin grips best when cold and dry.',
  },
  gneiss: {
    dryingHours: 16,
    fragileWhenWet: false,
    seepage: false,
    idealTempC: [2, 14],
    okTempC: [-6, 22],
    humidityGreasyPct: 70,
    blurb: 'Hard and impermeable like granite — sound when wet, just low-friction.',
  },
  limestone: {
    dryingHours: 36,
    fragileWhenWet: false,
    seepage: true,
    idealTempC: [3, 14],
    okTempC: [-3, 20],
    humidityGreasyPct: 75,
    blurb: 'Holds go soapy when wet and seepage lingers in pockets/tufas after rain.',
  },
  gritstone: {
    dryingHours: 36,
    fragileWhenWet: true,
    seepage: false,
    idealTempC: [2, 10],
    okTempC: [-6, 16],
    humidityGreasyPct: 72,
    blurb: 'Permeable and fragile when wet; friction is king on cold, dry days.',
  },
  basalt: {
    dryingHours: 16,
    fragileWhenWet: false,
    seepage: false,
    idealTempC: [2, 16],
    okTempC: [-6, 22],
    humidityGreasyPct: 70,
    blurb: 'Igneous and impermeable — slick when wet but sound, dries quickly.',
  },
  conglomerate: {
    dryingHours: 36,
    fragileWhenWet: true,
    seepage: true,
    idealTempC: [3, 14],
    okTempC: [-3, 20],
    humidityGreasyPct: 72,
    blurb: 'Cobbles pull when wet and pockets trap water — best cool, dry winter days.',
  },
}

export interface CragConfig {
  name: string
  region: string
  latitude: number
  longitude: number
  rock: RockType
  /**
   * Optional override for this specific crag's drying time. Avalonia is compact,
   * fast-draining Ruhrsandstein, so it dries faster than generic soft sandstone.
   */
  dryingHoursOverride?: number
  /** Daylight bounds (local hour, 24h) used when picking a day's climbing window. */
  dayStartHour: number
  dayEndHour: number
}

export const CRAG: CragConfig = {
  name: 'Avalonia',
  region: 'Ruhrtal · Wetter / Herdecke, NRW',
  latitude: 51.4025,
  longitude: 7.4099,
  rock: 'sandstone',
  dryingHoursOverride: 18,
  dayStartHour: 8,
  dayEndHour: 20,
}

/** The rock profile for the configured crag, with any crag-specific overrides applied. */
export function activeRockProfile(): RockProfile {
  const base = ROCK_PROFILES[CRAG.rock]
  return CRAG.dryingHoursOverride != null
    ? { ...base, dryingHours: CRAG.dryingHoursOverride }
    : base
}
