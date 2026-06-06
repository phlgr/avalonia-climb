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
  pulls the **past 2 days** so it knows whether the rock is still wet, plus a
  **7-day** hourly forecast.
- `src/lib/scoring.ts` turns each hour into a light using the active rock profile.
- `src/config.ts` holds the crag (coordinates + rock type) and a table of rock
  profiles (drying time, wet-rock fragility, ideal temps, humidity sensitivity).

### Point it at a different crag

Edit `CRAG` in [`src/config.ts`](src/config.ts) — change the coordinates and the
`rock` type. The scoring adapts automatically. Sandstone/gritstone/conglomerate
get the hard "don't climb wet" rule; limestone/conglomerate also get a seepage
penalty; granite/gneiss/basalt dry fast.

## Develop

```sh
bun install
bun run dev        # http://localhost:5173/avalonia-climb/
bun run build      # production build into dist/
bun run preview    # serve the production build
bun run typecheck  # tsc --noEmit
bun run lint       # biome
bun run knip       # unused files/deps
```

Tooling: **Bun · Vite · TanStack Router + Query · Biome · Knip · Lefthook**.

## Deploy (GitHub Pages)

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes
`dist/` to GitHub Pages. The site is served from `/<repo>/`, so `vite.config.ts`
sets `base = '/avalonia-climb/'` (change it for a custom domain). A `404.html`
copy of `index.html` is emitted so client-side routes survive a hard refresh.

To enable: repo **Settings → Pages → Source: GitHub Actions**.

> A hint, not a safety guarantee. Conditions models are approximate — always
> check the actual rock before you climb, especially after rain.
