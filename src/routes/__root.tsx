import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { CRAG } from '../config'
import { rockName } from '../i18n'
import { m } from '../paraglide/messages.js'
import { getLocale, locales, setLocale } from '../paraglide/runtime.js'

export const Route = createRootRoute({ component: RootLayout })

/** Topographic-peak mark — nested contour rings, echoing a crag topo. */
function TopoMark() {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative brand mark beside the visible name
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <ellipse cx="16" cy="18" rx="12" ry="8.5" />
      <ellipse cx="16" cy="16.5" rx="7.5" ry="5.5" />
      <ellipse cx="16" cy="15" rx="3" ry="2.2" />
    </svg>
  )
}

/** Little mountaineering glyphs for the bottom tabs. */
function TabIcon({ name }: { name: 'now' | 'forecast' | 'method' }) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative; the tab label sits beside it
    <svg
      className="tab-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {name === 'now' && (
        <>
          <circle cx="17" cy="6.5" r="2.5" />
          <path d="M3 19 L10 8 L14 14 L17.5 9.5 L21 19" />
        </>
      )}
      {name === 'forecast' && (
        <>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9.5 H20.5" />
          <path d="M8 3.5 V6.5" />
          <path d="M16 3.5 V6.5" />
        </>
      )}
      {name === 'method' && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 6.5 L14.5 13 L12 17.5 L9.5 13 Z" />
        </>
      )}
    </svg>
  )
}

function RootLayout() {
  const current = getLocale()
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <TopoMark />
          </span>
          <div>
            <h1>{CRAG.name}</h1>
            <p className="brand-sub">{CRAG.region}</p>
          </div>
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: small 2-button toggle, role=group is appropriate */}
        <div className="lang" role="group" aria-label="Language">
          {locales.map((loc) => (
            <button
              key={loc}
              type="button"
              className={`lang-btn${loc === current ? ' active' : ''}`}
              aria-pressed={loc === current}
              onClick={() => setLocale(loc)}
            >
              {loc.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <footer className="foot">
        <p>
          <strong>{rockName(CRAG.rock)}</strong> · {m.crag_blurb()}
        </p>
        <p className="muted">
          {m.footer_weather_from()}{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>
          . {m.footer_modelled()} <Link to="/method">{m.footer_method_link()}</Link>.
        </p>
        <p className="muted">{m.footer_disclaimer()}</p>
        <p className="muted">
          <a href="https://github.com/phlgr/avalonia-climb" target="_blank" rel="noreferrer">
            {m.footer_source()}
          </a>
        </p>
      </footer>

      <nav className="tabbar" aria-label="Primary">
        <div className="tabbar-inner">
          <Link
            to="/"
            className="tab"
            activeProps={{ className: 'active' }}
            activeOptions={{ exact: true }}
          >
            <TabIcon name="now" />
            <span className="tab-label">{m.nav_now()}</span>
          </Link>
          <Link to="/forecast" className="tab" activeProps={{ className: 'active' }}>
            <TabIcon name="forecast" />
            <span className="tab-label">{m.nav_forecast()}</span>
          </Link>
          <Link to="/method" className="tab" activeProps={{ className: 'active' }}>
            <TabIcon name="method" />
            <span className="tab-label">{m.nav_method()}</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
