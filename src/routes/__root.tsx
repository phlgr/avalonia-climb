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
      </footer>

      <nav className="tabbar" aria-label="Primary">
        <div className="tabbar-inner">
          <Link
            to="/"
            className="tab"
            activeProps={{ className: 'active' }}
            activeOptions={{ exact: true }}
          >
            {m.nav_now()}
          </Link>
          <Link to="/forecast" className="tab" activeProps={{ className: 'active' }}>
            {m.nav_forecast()}
          </Link>
          <Link to="/method" className="tab" activeProps={{ className: 'active' }}>
            {m.nav_method()}
          </Link>
        </div>
      </nav>
    </div>
  )
}
