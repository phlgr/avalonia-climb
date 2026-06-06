// Open-Meteo returns timezone-local timestamps as "YYYY-MM-DDTHH:00" (no offset).
// We compare against the browser's local clock, which matches the crag for a
// user in the same timezone (the common case for a single-crag app).

const pad = (n: number) => String(n).padStart(2, '0')

/** Current local time as "YYYY-MM-DDTHH:00", matching Open-Meteo's hour strings. */
export function localNowHourIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`
}

/** Today's local date as "YYYY-MM-DD". */
export function todayLocalDate(now: Date = new Date()): string {
  return localNowHourIso(now).slice(0, 10)
}

/** "Mon" / "Tue" weekday + day-of-month for a "YYYY-MM-DD" date, plus a Today/Tomorrow flag. */
export function formatDayLabel(dateIso: string, today: string): { weekday: string; day: number } {
  const [y, m, d] = dateIso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday =
    dateIso === today ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' })
  return { weekday, day: d }
}

/** "8–13h" style window label. */
export function formatWindow(startHour: number, endHour: number): string {
  if (startHour === endHour) return `${startHour}:00`
  return `${startHour}:00–${endHour}:00`
}
