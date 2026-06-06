import { createFileRoute } from '@tanstack/react-router'
import { activeRockProfile, CRAG } from '../config'
import { GREEN_MIN, INCOMING_HOURS, SCORE_WEIGHTS, YELLOW_MIN } from '../lib/scoring'

export const Route = createFileRoute('/method')({ component: MethodView })

const band = ([lo, hi]: [number, number]) => `${lo} – ${hi} °C`

function MethodView() {
  const rock = activeRockProfile()
  const weights = [
    { key: 'Temperature / friction', pct: SCORE_WEIGHTS.temp },
    { key: 'Dryness (surface film)', pct: SCORE_WEIGHTS.dryness },
    { key: 'Humidity', pct: SCORE_WEIGHTS.humidity },
    { key: 'Wind', pct: SCORE_WEIGHTS.wind },
  ]

  return (
    <article className="method">
      <h2>How we decide</h2>
      <p className="method-lead">
        Every hour we pull the forecast for {CRAG.name}, model how wet the rock is, score the
        climbing conditions from 0&#8211;100, and turn that into a light. It's tuned to the rock you
        actually climb on &#8212; {CRAG.rock} &#8212; and the drying is real physics, not a fixed
        &ldquo;wait N hours after rain&rdquo;. It's a hint, not a safety guarantee.
      </p>

      <section className="m-section">
        <h3>1 · The verdict</h3>
        <p>Two hard rules can force a 🔴 on their own, no matter how nice the air is:</p>
        <ul className="m-rules">
          <li>
            <strong>It's raining</strong> (now, or this hour) &#8212; wet rock.
          </li>
          <li>
            <strong>The rock is still wet inside.</strong> For fragile rock like {CRAG.rock},
            climbing while the core is saturated snaps holds and damages the crag &#8212; even once
            the surface looks dry.
          </li>
        </ul>
        <p>
          Otherwise we blend four factors into a 0&#8211;100 score, each weighted by how much it
          matters for friction on this rock:
        </p>
        <div className="weights">
          {weights.map((w) => (
            <div className="weight-row" key={w.key}>
              <span className="weight-label">{w.key}</span>
              <span className="weight-track">
                <span className="weight-fill" style={{ width: `${w.pct * 100}%` }} />
              </span>
              <span className="weight-pct">{Math.round(w.pct * 100)}%</span>
            </div>
          ))}
        </div>
        <p className="m-thresholds">
          <span className="chip chip--green">🟢 {GREEN_MIN}&#8211;100</span>
          <span className="chip chip--yellow">
            🟡 {YELLOW_MIN}&#8211;{GREEN_MIN - 1}
          </span>
          <span className="chip chip--red">🔴 0&#8211;{YELLOW_MIN - 1}</span>
        </p>
        <p className="muted">
          A would-be green is knocked down to yellow if the surface is still damp or rain is due
          within {INCOMING_HOURS}h &#8212; you can climb, but it's compromised.
        </p>
      </section>

      <section className="m-section">
        <h3>2 · Reading the rock — {CRAG.rock}</h3>
        <p>{rock.blurb}</p>
        <dl className="rock-facts">
          <div>
            <dt>Best friction</dt>
            <dd>{band(rock.idealTempC)}</dd>
          </div>
          <div>
            <dt>Still OK</dt>
            <dd>{band(rock.okTempC)}</dd>
          </div>
          <div>
            <dt>Gets greasy above</dt>
            <dd>{rock.humidityGreasyPct}% RH</dd>
          </div>
          <div>
            <dt>Climb when wet?</dt>
            <dd>{rock.fragileWhenWet ? 'Never' : 'Slick, but OK'}</dd>
          </div>
        </dl>
        <p className="muted">
          Swap the crag in one config file and every threshold here adapts &#8212; granite dries
          fast and is sound when wet; limestone seeps; grit and sandstone are fragile.
        </p>
      </section>

      <section className="m-section">
        <h3>3 · How we model drying</h3>
        <p>
          Rain doesn't just &ldquo;clear after a day&rdquo;. We track two reservoirs of water in the
          rock, stepped hour by hour through the forecast:
        </p>
        <div className="m-grid">
          <div className="m-card">
            <h4>💧 Surface film</h4>
            <p>
              Water sitting on the rock &#8212; what makes holds slick. Dries quickly. Drives the
              dryness score.
            </p>
          </div>
          <div className="m-card">
            <h4>🪨 Internal moisture</h4>
            <p>
              Water soaked into the pores. Dries slowly &#8212; this is why {CRAG.rock} stays unsafe
              for a day or more <em>after the surface looks dry</em>.
            </p>
          </div>
        </div>
        <p>
          Both drain in proportion to <strong>reference evapotranspiration (ET₀)</strong> &#8212; a
          standard index of how hard the air is pulling moisture off a surface, computed from the
          forecast's sun, temperature, wind and humidity. So a warm, breezy day dries the rock far
          faster than a cold, still, damp one, and near freezing the drying nearly stops.
        </p>
        <p className="m-caveat">
          <strong>Honest caveat:</strong> ET₀ is defined for a <em>grass</em> reference surface
          (FAO-56), not rock &#8212; we borrow it only as a proxy for evaporative demand. The
          rock-specific parts (how much rain soaks in, how slowly the core dries, &ldquo;never climb
          it wet&rdquo;) rest on porous-media evaporation physics and climbing-ethics guidance, not
          on the ET₀ standard itself.
        </p>
        <p>
          The &ldquo;🪨 likely dry around &hellip;&rdquo; estimate isn't a fixed delay &#8212; it's
          the first hour the forward simulation says the rock is climbable again. We also look past
          it: if more rain is coming, we show when that dry window closes.
        </p>
      </section>

      <section className="m-section">
        <h3>4 · The weather data</h3>
        <p>
          Hourly forecast from{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>{' '}
          (free, no account). We fetch the <strong>past 3 days</strong> &#8212; so we know how wet
          the rock already is &#8212; plus <strong>7 days ahead</strong>: temperature, humidity,
          wind, precipitation &amp; probability, weather code, and FAO-56 ET₀.
        </p>
      </section>

      <section className="m-section">
        <h3>5 · Honesty &amp; limits</h3>
        <ul className="m-limits">
          <li>It's a model with hand-tuned parameters, not measurements of the actual rock.</li>
          <li>
            Forecasts are wrong sometimes; shade, seepage lines and aspect vary across a crag.
          </li>
          <li>We only look back 3 days, so a very wet spell before that is invisible.</li>
          <li>
            <strong>Always check the rock yourself</strong> &#8212; if it's damp, don't climb it.
          </li>
        </ul>
      </section>

      <section className="m-section">
        <h3>Sources</h3>
        <ul className="sources">
          <li>
            <strong>Evaporation physics</strong> &#8212;{' '}
            <a href="https://doi.org/10.1098/rspa.1948.0037" target="_blank" rel="noreferrer">
              Penman (1948), <em>Natural evaporation from open water, bare soil and grass</em>
            </a>
            , Proc. R. Soc. A 193.
          </li>
          <li>
            <strong>Drying of porous rock</strong> &#8212;{' '}
            <a href="https://doi.org/10.2136/vzj2012.0163" target="_blank" rel="noreferrer">
              Or, Lehmann, Shahraeeni &amp; Shokri (2013),{' '}
              <em>Advances in Soil Evaporation Physics&mdash;A Review</em>
            </a>
            , Vadose Zone Journal 12(4).
          </li>
          <li>
            <strong>ET₀ definition</strong> (the value we pull from Open-Meteo; a grass reference,
            used here only as a proxy) &#8212;{' '}
            <a href="https://www.fao.org/4/x0490e/x0490e00.htm" target="_blank" rel="noreferrer">
              FAO-56, Allen et al. (1998)
            </a>
            .
          </li>
          <li>
            <strong>Wet sandstone is weaker</strong> (up to ~45% loss of compressive strength when
            saturated, most within hours) &#8212;{' '}
            <a
              href="https://doi.org/10.1080/15583058.2023.2188313"
              target="_blank"
              rel="noreferrer"
            >
              Tomor, Nichols &amp; Orbán (2024)
            </a>
            , Int. J. Architectural Heritage 18(5).
          </li>
          <li>
            <strong>Climbing ethic</strong> &#8212;{' '}
            <a href="https://www.thebmc.co.uk/en/respect-the-rock" target="_blank" rel="noreferrer">
              BMC Respect the Rock
            </a>{' '}
            &amp;{' '}
            <a
              href="https://www.accessfund.org/latest-news/open-gate-blog/how-to-assess-sandstone-after-rain-or-snow"
              target="_blank"
              rel="noreferrer"
            >
              Access Fund
            </a>
            : don't climb grit &amp; sandstone when wet.
          </li>
          <li>
            <strong>Data</strong> &#8212;{' '}
            <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer">
              Open-Meteo forecast API
            </a>{' '}
            (weather &amp; ET₀).
          </li>
        </ul>
      </section>
    </article>
  )
}
