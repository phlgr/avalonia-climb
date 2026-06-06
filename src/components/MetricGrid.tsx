import type { HourPoint } from '../lib/weather'

/** Key live numbers behind the current verdict. */
export function MetricGrid({ point }: { point: HourPoint }) {
  const items = [
    { label: 'Temp', value: `${Math.round(point.tempC)}°`, unit: 'C' },
    { label: 'Humidity', value: `${point.humidity}`, unit: '%' },
    { label: 'Wind', value: `${Math.round(point.windKmh)}`, unit: 'km/h' },
    { label: 'Rain', value: point.precipMm.toFixed(1), unit: 'mm' },
  ]
  return (
    <div className="metrics">
      {items.map((m) => (
        <div key={m.label} className="metric">
          <span className="metric-value">
            {m.value}
            <small>{m.unit}</small>
          </span>
          <span className="metric-label">{m.label}</span>
        </div>
      ))}
    </div>
  )
}
