# Avalonia — Bouldering Conditions 🟢🟡🔴

A traffic-light "go / no-go" indicator and 7-day forecast for bouldering at
**Avalonia** (Ruhrtal, between Wetter and Herdecke, NRW — compact Ruhrsandstein).

The scoring is **rock-type aware**: Avalonia is sandstone, so the rule of "never
climb it wet" is enforced as a hard red regardless of how nice the air feels,
while friction (cool temps, low humidity) decides between green and yellow.

- 🟢 **Good to climb** — dry rock, good friction, no rain incoming.
- 🟡 **Marginal** — climbable but compromised (warm/humid, breezy, drying out, or rain soon).
- 🔴 **No-go** — raining, or the sandstone is still wet (climbing it now breaks holds).

## How it works

- Weather comes from [Open-Meteo](https://open-meteo.com) (free, no API key). It
  pulls the **past 3 days** so it can model how wet the rock still is, plus a
  **7-day** hourly forecast.
- `src/lib/scoring.ts` turns each hour into a light using the active rock profile.
- `src/config.ts` holds the crag (coordinates + rock type) and a table of rock
  profiles (drying behaviour, wet-rock fragility, ideal temps, humidity sensitivity).

### Drying model (the interesting bit)

Instead of a naïve "hours since rain", drying is a **two-reservoir water balance**
stepped hour by hour:

- **Surface film** — rain that sits on the rock (slickness). Dries fast.
- **Internal moisture** — rain that soaks into the pores. Dries slowly, and is
  what keeps porous rock like sandstone unsafe for a day or more *after the
  surface looks dry*.

Both reservoirs drain in proportion to **reference evapotranspiration (ET₀)** —
a standard index of evaporative demand from sun, temperature, wind and humidity,
which Open-Meteo provides hourly. So the "🪨 likely dry around …" estimate
reflects the actual forecast (a sunny, breezy day dries the rock far faster than
a cold, damp one) rather than a fixed delay. Each rock type sets how rain splits
between the two reservoirs and how fast each one dries; near freezing,
evaporation is throttled.

> **Note on ET₀:** FAO-56 defines ET₀ over a *grass reference surface* (an
> agronomy/irrigation standard) — it is **not** a study of rock. We use it only
> as a proxy for evaporative demand. The rock-specific behaviour rests on
> porous-media evaporation physics and climbing-ethics guidance, not on FAO-56.

**Citations**

- Surface-evaporation physics — Penman (1948), *Natural evaporation from open
  water, bare soil and grass*, Proc. R. Soc. A 193 — <https://doi.org/10.1098/rspa.1948.0037>.
- Drying of porous rock — Or, Lehmann, Shahraeeni & Shokri (2013), *Advances in
  Soil Evaporation Physics—A Review*, Vadose Zone Journal 12(4) —
  <https://doi.org/10.2136/vzj2012.0163>.
- ET₀ definition (the value pulled from Open-Meteo) — FAO-56, Allen et al. (1998)
  — <https://www.fao.org/4/x0490e/x0490e00.htm>.
- Wet sandstone strength loss (up to ~45% of compressive strength when saturated,
  most within hours) — Tomor, Nichols & Orbán (2024), *Evaluation of the Loss of
  Uniaxial Compressive Strength of Sandstones Due to Moisture*, Int. J.
  Architectural Heritage 18(5) — <https://doi.org/10.1080/15583058.2023.2188313>.
- Climbing ethic — BMC "Respect the Rock"
  (<https://www.thebmc.co.uk/en/respect-the-rock>) and Access Fund
  (<https://www.accessfund.org/latest-news/open-gate-blog/how-to-assess-sandstone-after-rain-or-snow>).

### Point it at a different crag

Edit `CRAG` in [`src/config.ts`](src/config.ts) — change the coordinates and the
`rock` type. The scoring adapts automatically. Sandstone/gritstone/conglomerate
get the hard "don't climb wet" rule; limestone/conglomerate also get a seepage
penalty; granite/gneiss/basalt dry fast.

## Develop

```sh
bun install
bun run dev        # http://localhost:5173/
bun run build      # production build into dist/
bun run preview    # serve the production build
bun run typecheck  # tsc --noEmit
bun run lint       # biome
bun run knip       # unused files/deps
```

Tooling: **Bun · Vite · TanStack Router + Query · Biome · Knip · Lefthook**.

## Deploy (GitHub Pages)

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes
`dist/` to GitHub Pages. The site is served at the custom domain
**isavaloniadry.gartz.dev** (`public/CNAME`), so `vite.config.ts` sets
`base = '/'`. A `404.html` copy of `index.html` is emitted so client-side routes
survive a hard refresh.

Custom-domain DNS: a `CNAME` record `isavaloniadry` → `phlgr.github.io` in the
`gartz.dev` zone. To enable Pages: repo **Settings → Pages → Source: GitHub
Actions** (already configured).

> A hint, not a safety guarantee. Conditions models are approximate — always
> check the actual rock before you climb, especially after rain.
