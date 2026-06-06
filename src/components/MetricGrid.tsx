import type { HourPoint } from '../lib/weather'
import { m } from '../paraglide/messages.js'

/** Key live numbers behind the current verdict. */
export function MetricGrid({ point }: { point: HourPoint }) {
  const items = [
    { label: m.metric_temp(), value: `${Math.round(point.tempC)}°`, unit: 'C' },
    { label: m.metric_humidity(), value: `${point.humidity}`, unit: '%' },
    { label: m.metric_wind(), value: `${Math.round(point.windKmh)}`, unit: 'km/h' },
    { label: m.metric_rain(), value: point.precipMm.toFixed(1), unit: 'mm' },
  ]
  return (
    <div className="metrics">
      {items.map((item) => (
        <div key={item.label} className="metric">
          <span className="metric-value">
            {item.value}
            <small>{item.unit}</small>
          </span>
          <span className="metric-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
