import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { activeRockProfile, CRAG } from '../config'

export const Route = createRootRoute({ component: RootLayout })

function RootLayout() {
  const rock = activeRockProfile()
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
        <nav className="nav">
          <Link to="/" activeProps={{ className: 'active' }} activeOptions={{ exact: true }}>
            Now
          </Link>
          <Link to="/forecast" activeProps={{ className: 'active' }}>
            7-day
          </Link>
          <Link to="/method" activeProps={{ className: 'active' }}>
            Method
          </Link>
        </nav>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <footer className="foot">
        <p>
          <strong>{CRAG.rock}</strong> · {rock.blurb}
        </p>
        <p className="muted">
          Weather &amp; ET₀ from{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>
          . Conditions are modelled, not measured &#8212;{' '}
          <Link to="/method">how it works &amp; sources</Link>.
        </p>
        <p className="muted">A hint, not a safety guarantee — always check the rock yourself.</p>
      </footer>
    </div>
  )
}
