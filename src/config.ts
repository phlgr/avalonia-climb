// ── Crag + rock configuration ──────────────────────────────────────────────
// Everything location-specific lives here. To point this app at a different
// crag, change CRAG below (coordinates + rock type) and you're done — the
// scoring adapts to the rock via ROCK_PROFILES.
//
// Drying is modelled as a two-reservoir water balance driven by hourly FAO-56
// reference evapotranspiration (ET₀), the standard measure of evaporative demand
// (sun + temperature + wind + humidity). See src/lib/scoring.ts and the
// citations in the README. Each rock type sets how rain splits between a
// fast-drying surface film and slow internal moisture, and how fast each dries.

type RockType =
  | 'sandstone'
  | 'granite'
  | 'gneiss'
  | 'limestone'
  | 'gritstone'
  | 'basalt'
  | 'conglomerate'

export interface RockProfile {
  /** Fraction (0–1) of rain that soaks into the rock's pores rather than sitting on the surface. */
  absorptivity: number
  /** Surface-film evaporation per unit ET₀. Impermeable rock sheds/dries its surface fast (>1). */
  surfaceDryMult: number
  /** Internal-moisture loss per unit ET₀. Always slow — this is why porous rock stays unsafe for days. */
  coreDryMult: number
  /** Internal moisture (mm-equiv) above which fragile rock is unsafe to climb. */
  coreWetThresholdMm: number
  /**
   * Climbing this rock wet/damp damages it and breaks holds (sandstone, grit,
   * conglomerate). When true and internal moisture is high, conditions are a
   * hard RED regardless of how nice the air feels — an ethics + safety rule
   * (see BMC "Respect the Rock" / Access Fund), not comfort.
   */
  fragileWhenWet: boolean
  /** Holds seepage in cracks/pockets/tufas, so the surface stays damp longer than it looks. */
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

// Tuned from climbing-ethics + drying research. Porous rock (sandstone, grit,
// conglomerate) splits rain into a large slow-draining core; impermeable rock
// (granite, gneiss, basalt) keeps water on the surface where ET₀ clears it fast.
const ROCK_PROFILES: Record<RockType, RockProfile> = {
  sandstone: {
    absorptivity: 0.55,
    surfaceDryMult: 1.4,
    coreDryMult: 0.3,
    coreWetThresholdMm: 1.2,
    fragileWhenWet: true,
    seepage: false,
    idealTempC: [5, 15],
    okTempC: [-2, 20],
    humidityGreasyPct: 75,
    blurb: 'Never climb wet — holds snap and the rock is up to ~75% weaker when damp.',
  },
  gritstone: {
    absorptivity: 0.5,
    surfaceDryMult: 1.3,
    coreDryMult: 0.28,
    coreWetThresholdMm: 1.2,
    fragileWhenWet: true,
    seepage: false,
    idealTempC: [2, 10],
    okTempC: [-6, 16],
    humidityGreasyPct: 72,
    blurb: 'Permeable and fragile when wet; friction is king on cold, dry days.',
  },
  conglomerate: {
    absorptivity: 0.45,
    surfaceDryMult: 1.3,
    coreDryMult: 0.3,
    coreWetThresholdMm: 1.3,
    fragileWhenWet: true,
    seepage: true,
    idealTempC: [3, 14],
    okTempC: [-3, 20],
    humidityGreasyPct: 72,
    blurb: 'Cobbles pull when wet and pockets trap water — best cool, dry winter days.',
  },
  limestone: {
    absorptivity: 0.18,
    surfaceDryMult: 2.0,
    coreDryMult: 0.5,
    coreWetThresholdMm: 2.0,
    fragileWhenWet: false,
    seepage: true,
    idealTempC: [3, 14],
    okTempC: [-3, 20],
    humidityGreasyPct: 75,
    blurb: 'Holds go soapy when wet and seepage lingers in pockets/tufas after rain.',
  },
  granite: {
    absorptivity: 0.05,
    surfaceDryMult: 3.0,
    coreDryMult: 1.0,
    coreWetThresholdMm: 5,
    fragileWhenWet: false,
    seepage: false,
    idealTempC: [2, 14],
    okTempC: [-6, 22],
    humidityGreasyPct: 70,
    blurb: 'Sound when wet but slick; dries fast. Skin grips best when cold and dry.',
  },
  gneiss: {
    absorptivity: 0.05,
    surfaceDryMult: 3.0,
    coreDryMult: 1.0,
    coreWetThresholdMm: 5,
    fragileWhenWet: false,
    seepage: false,
    idealTempC: [2, 14],
    okTempC: [-6, 22],
    humidityGreasyPct: 70,
    blurb: 'Hard and impermeable like granite — sound when wet, just low-friction.',
  },
  basalt: {
    absorptivity: 0.06,
    surfaceDryMult: 3.0,
    coreDryMult: 1.0,
    coreWetThresholdMm: 5,
    fragileWhenWet: false,
    seepage: false,
    idealTempC: [2, 16],
    okTempC: [-6, 22],
    humidityGreasyPct: 70,
    blurb: 'Igneous and impermeable — slick when wet but sound, dries quickly.',
  },
}

export interface CragConfig {
  name: string
  region: string
  latitude: number
  longitude: number
  rock: RockType
  /**
   * Per-crag tweaks merged over the base rock profile. Avalonia is compact,
   * fast-draining Ruhrsandstein — it soaks up less and dries faster than generic
   * soft sandstone, so it gets a lower absorptivity and quicker drying.
   */
  profileOverride?: Partial<RockProfile>
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
  profileOverride: {
    absorptivity: 0.4,
    surfaceDryMult: 1.8,
    coreDryMult: 0.5,
    coreWetThresholdMm: 1.0,
    blurb:
      'Compact, fast-draining Ruhrsandstein — dries quicker than soft sandstone, but still never climb it wet.',
  },
  dayStartHour: 8,
  dayEndHour: 20,
}

/** The rock profile for the configured crag, with any crag-specific overrides applied. */
export function activeRockProfile(): RockProfile {
  return { ...ROCK_PROFILES[CRAG.rock], ...CRAG.profileOverride }
}
