import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { CRAG } from '../config'
import { rockName } from '../i18n'
import { m } from '../paraglide/messages.js'
import { getLocale, locales, setLocale } from '../paraglide/runtime.js'

export const Route = createRootRoute({ component: RootLayout })

function RootLayout() {
  const current = getLocale()
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            ▲
          </span>
          <div>
            <h1>{CRAG.name}</h1>
            <p className="brand-sub">{CRAG.region}</p>
          </div>
        </div>
        <div className="topbar-right">
          <nav className="nav">
            <Link to="/" activeProps={{ className: 'active' }} activeOptions={{ exact: true }}>
              {m.nav_now()}
            </Link>
            <Link to="/forecast" activeProps={{ className: 'active' }}>
              {m.nav_forecast()}
            </Link>
            <Link to="/method" activeProps={{ className: 'active' }}>
              {m.nav_method()}
            </Link>
          </nav>
          <div className="lang">
            {locales.map((loc) => (
              <button
                key={loc}
                type="button"
                className={`lang-btn${loc === current ? ' active' : ''}`}
                aria-pressed={loc === current}
                aria-label={`Switch language to ${loc.toUpperCase()}`}
                onClick={() => setLocale(loc)}
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>
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
    </div>
  )
}
