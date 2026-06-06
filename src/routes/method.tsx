import { createFileRoute } from '@tanstack/react-router'
import { activeRockProfile, CRAG } from '../config'
import { rockName } from '../i18n'
import { GREEN_MIN, INCOMING_HOURS, SCORE_WEIGHTS, YELLOW_MIN } from '../lib/scoring'
import { m } from '../paraglide/messages.js'

export const Route = createFileRoute('/method')({ component: MethodView })

const band = ([lo, hi]: [number, number]) => `${lo} – ${hi} °C`

function MethodView() {
  const rock = activeRockProfile()
  const name = rockName(CRAG.rock)
  const weights = [
    { key: m.method_w_temp(), pct: SCORE_WEIGHTS.temp },
    { key: m.method_w_dryness(), pct: SCORE_WEIGHTS.dryness },
    { key: m.method_w_humidity(), pct: SCORE_WEIGHTS.humidity },
    { key: m.method_w_wind(), pct: SCORE_WEIGHTS.wind },
  ]

  return (
    <article className="method">
      <h2>{m.method_title()}</h2>
      <p className="method-lead">{m.method_lead({ name: CRAG.name, rock: name })}</p>

      <section className="m-section">
        <h3>{m.method_s1h()}</h3>
        <p>{m.method_rules_intro()}</p>
        <ul className="m-rules">
          <li>
            <strong>{m.method_rule_rain_strong()}</strong>
            {m.method_rule_rain_rest()}
          </li>
          <li>
            <strong>{m.method_rule_wet_strong()}</strong>
            {m.method_rule_wet_rest({ rock: name })}
          </li>
        </ul>
        <p>{m.method_blend_intro()}</p>
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
          <span className="chip chip--green">🟢 {GREEN_MIN}–100</span>
          <span className="chip chip--yellow">
            🟡 {YELLOW_MIN}–{GREEN_MIN - 1}
          </span>
          <span className="chip chip--red">🔴 0–{YELLOW_MIN - 1}</span>
        </p>
        <p className="muted">{m.method_thresholds_note({ h: INCOMING_HOURS })}</p>
      </section>

      <section className="m-section">
        <h3>{m.method_s2h({ rock: name })}</h3>
        <p>{m.crag_blurb()}</p>
        <dl className="rock-facts">
          <div>
            <dt>{m.method_f_best_friction()}</dt>
            <dd>{band(rock.idealTempC)}</dd>
          </div>
          <div>
            <dt>{m.method_f_still_ok()}</dt>
            <dd>{band(rock.okTempC)}</dd>
          </div>
          <div>
            <dt>{m.method_f_greasy_above()}</dt>
            <dd>{rock.humidityGreasyPct}% RH</dd>
          </div>
          <div>
            <dt>{m.method_f_climb_when_wet()}</dt>
            <dd>{rock.fragileWhenWet ? m.method_f_never() : m.method_f_slick_ok()}</dd>
          </div>
        </dl>
        <p className="muted">{m.method_s2note()}</p>
      </section>

      <section className="m-section">
        <h3>{m.method_s3h()}</h3>
        <p>{m.method_s3intro()}</p>
        <div className="m-grid">
          <div className="m-card">
            <h4>{m.method_surface_title()}</h4>
            <p>{m.method_surface_body()}</p>
          </div>
          <div className="m-card">
            <h4>{m.method_core_title()}</h4>
            <p>{m.method_core_body({ rock: name })}</p>
          </div>
        </div>
        <p>{m.method_et0()}</p>
        <p className="m-caveat">
          <strong>{m.method_caveat_strong()}</strong>
          {m.method_caveat_body()}
        </p>
        <p>{m.method_eta_explain()}</p>
      </section>

      <section className="m-section">
        <h3>{m.method_s4h()}</h3>
        <p>
          {m.method_s4pre()}{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>{' '}
          {m.method_s4post()}
        </p>
      </section>

      <section className="m-section">
        <h3>{m.method_s5h()}</h3>
        <ul className="m-limits">
          <li>{m.method_limit_1()}</li>
          <li>{m.method_limit_2()}</li>
          <li>{m.method_limit_3()}</li>
          <li>{m.method_limit_4()}</li>
        </ul>
      </section>

      <section className="m-section">
        <h3>{m.method_sources_h()}</h3>
        <ul className="sources">
          <li>
            <strong>{m.method_src_evap()}</strong> —{' '}
            <a href="https://doi.org/10.1098/rspa.1948.0037" target="_blank" rel="noreferrer">
              Penman (1948), <em>Natural evaporation from open water, bare soil and grass</em>
            </a>
            , Proc. R. Soc. A 193.
          </li>
          <li>
            <strong>{m.method_src_porous()}</strong> —{' '}
            <a href="https://doi.org/10.2136/vzj2012.0163" target="_blank" rel="noreferrer">
              Or, Lehmann, Shahraeeni &amp; Shokri (2013),{' '}
              <em>Advances in Soil Evaporation Physics—A Review</em>
            </a>
            , Vadose Zone Journal 12(4).
          </li>
          <li>
            <strong>{m.method_src_et0()}</strong> —{' '}
            <a href="https://www.fao.org/4/x0490e/x0490e00.htm" target="_blank" rel="noreferrer">
              FAO-56, Allen et al. (1998)
            </a>
            .
          </li>
          <li>
            <strong>{m.method_src_sandstone()}</strong> —{' '}
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
            <strong>{m.method_src_ethic()}</strong> —{' '}
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
            {m.method_src_ethic_tail()}
          </li>
          <li>
            <strong>{m.method_src_data()}</strong> —{' '}
            <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer">
              Open-Meteo
            </a>{' '}
            {m.method_src_data_tail()}
          </li>
        </ul>
      </section>
    </article>
  )
}
