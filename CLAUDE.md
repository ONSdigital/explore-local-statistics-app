# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"Explore Local Statistics" is an ONS (Office for National Statistics) SvelteKit app that lets users browse UK statistical indicators by area (region, local authority, etc.) via maps, charts and tables, and exposes the same data through a public JSON/CSV/XLSX API.

## Commands

- `npm run dev` — start the dev server
- `npm run build` / `npm run preview` — production build / preview it locally
- `npm run check` — svelte-kit sync + svelte-check (TypeScript/Svelte type checking)
- `npm run lint` — `prettier --check .` + `eslint .`; `npm run format` to auto-fix formatting
- `npm run test:unit` — Vitest, run once (`vitest --watch=false`); a single file: `npx vitest run src/path/to/file.test.ts`
- `npm run test:integration` — Playwright, builds and previews the app first (see `playwright.config.ts`); tests live in `tests/`
- `npm run audit` — `auditjs ossi` dependency vulnerability scan

Equivalent `make` targets (`lint`, `test`, `audit`, `build`, `build-local`, `run`) wrap these npm scripts for Concourse CI (`ci/*.yml`, `ci/scripts/*.sh`) and Docker builds; CI currently treats `make lint` as a no-op (see the `lint:` target in `Makefile`).

## Data pipeline (separate from the app's runtime)

The app does not fetch data live — all indicator/geo data is pre-processed into static files under `src/lib/data/` (JSON, gzipped CSV, XLSX) that get bundled at build time. These are regenerated via scripts in `scripts/`, run in this order:

1. `npm run data:download` — pulls raw CSVW datasets into `scripts/raw-data/` (a nested git checkout of the [explore-local-statistics-data](https://github.com/ONSdigital/explore-local-statistics-data) repo, whose branch is set in `scripts/config/data-repo-version.json`)
2. `npm run data:metadata` — generates CSVW metadata JSON per dataset
3. `npm run data:checks` — pre-flight consistency checks, writes `scripts/data-update-changelog.txt`
   (1–3 combined: `npm run data:ingest`)
4. `npm run data:generate` — builds the combined JSON-stat data cube (`src/lib/data/json-stat*.json`) from `scripts/config/manifest_metadata.csv`, which drives the indicator taxonomy
5. `npm run data:spreadsheets` — generates the downloadable XLSX files
6. `npm run meta:sitemap` — generates the sitemap
   (4–6 combined: `npm run data:build`)

Geo boundary/area data has its own pipeline: `npm run geo:generate` (`scripts/make-geo-data.ts`) and `npm run geo:clusters` (`scripts/make-clusters.ts`), combined as `npm run geo:all`.

The full data-update workflow (branching, editing the manifest, QA, going live) is documented in `scripts/managing-updates.md` — read it before touching anything under `scripts/` or `scripts/config/`.

## Architecture

**Routing** (`src/routes/`) is split into two route groups:
- `(app)/` — the user-facing SvelteKit pages (home, `/areas/[code]`, `/indicators/[code]`, area/indicator search, embeds).
- `(api)/api/` — a versioned public HTTP API (`/api/v1/...`) for data, geo lookups and metadata, plus health/alive checks. Route handlers are thin: they validate query params (`src/lib/api/utils.ts`, `src/lib/api/data/helpers/requestValidators.ts`) and delegate to functions in `src/lib/api/`.

**`src/lib/api/`** holds all data-access/query logic, independent of routing, organized by domain:
- `data/` — filtering the indicator data cube and generating output formats (CSV/CSVW/XLSX) — entry point `getFilteredData.ts`
- `geo/` — area lookups by code/name/postcode/lng-lat, parent/child/sibling/similar-area relationships
- `metadata/` — indicator/dimension/taxonomy metadata

Each domain's `getX.ts` files are the public entry points; `helpers/` subfolders hold internal filtering/formatting utilities. Route handlers under `(api)/api/` and page `load` functions under `(app)/` both call into this layer rather than duplicating logic.

**`src/lib/data/`** contains the pre-generated static data files (see Data pipeline above) plus `index.ts`, a small dual-mode JSON reader: in Vite/dev it uses `import.meta.glob` + SvelteKit's `$app/server` `read`; in the built Node server it reads from disk directly. Data is read once and cached in memory — treat these files as an immutable data layer, not something to mutate at runtime. `json-stat.json`/`json-stat-summary.json` are the core data cube consumed by `getFilteredData.ts`.

**Config** is split between `src/lib/config.ts` (colours/palettes and misc app constants) and `src/lib/config/` (geo levels, geo lookups, measures, nav map sources, topics) — check both before adding new constants.

**Components** (`src/lib/components/`): `charts/` (Bar, Line, Map, Table, Beeswarm, Pyramid, Sparkline, wrapped by `IndicatorChart.svelte`/`ChartDataLoader.svelte`), `modals/`, `nav/` (area/indicator search, pagination), `visuals/` (map primitives). This project uses the Svelte port of the ONS Design System, `@onsvisual/svelte-components` (see README for `npm link` workflow when developing against a local copy of that library).

**Logging**: `src/lib/logger.ts` (pino) is wired into `console.*` globally in `src/hooks.server.ts` for non-dev environments — don't reintroduce raw `console.log` calls expecting dev-only behaviour.

## Build/deploy notes

- The SvelteKit adapter is chosen at config time in `svelte.config.js`: Vercel adapter if `VERCEL` env var is set, otherwise the Node adapter — relevant if changing build/runtime behaviour.
- `SVELTEKIT_BASE_PATH`, `SVELTEKIT_ASSETS_PATH` and `SVELTEKIT_APP_VERSION` env vars configure the base path, CDN asset path and app version for production builds (see `Makefile` and `svelte.config.js`).
- Production static assets can be served from a CDN bucket instead of the app container (`ENABLE_S3_ASSETS` in `Makefile`); currently disabled.

## Performance notes for the data API

Request path for `/api/v1/data.[format]` (the main data endpoint) and its helpers:

`+server.ts` → `getFilteredData.ts` → `filterIndicators.ts` (dataset-level filter) → `filterDatasets.ts` → `filterJSONStat` per dataset (dimension-level filter) → `dataFormatters.ts` (`dimsToItems`/`itemsToCols`/`colsToRows`) → response, or `generateXLSX.ts`/`generateCSV.ts` for those formats.

- **The data cube is in-memory, not re-read per request.** `getFilteredData.ts` does `const cube = await readData('json-stat')` as a top-level await, and `src/lib/data/index.ts` caches by key after first read — so `json-stat.json` (~11MB) is parsed once per server process, not per request. Cold-start/memory footprint scales with this file, not request latency; don't chase "read the file faster" here.
- **No `Cache-Control` headers are set anywhere in `src/routes/(api)/`** (checked, none exist). The deployed app sits behind Cloudflare, which already covers server/edge-side caching, so that's not a gap to fix here. `Cache-Control` also governs the *client's own* cache, though (browser, or any API consumer) — without it, repeat requests for the same URL always go back out over the network instead of being served locally. That's the remaining opportunity, and it's independent of Cloudflare.
- **Cost scales with the cartesian product of filtered dimensions, not the output size.** `dimsToItems` (`dataFormatters.ts`) expands filtered dims into every combination before `itemsToCols`/`colsToRows` filters out empty values — a request with several loosely-filtered dimensions can be expensive even if few observations actually have data. Profile with real query shapes, not just "large result" requests.
- **`filterIndicators.ts` has a fast path** (`params.topic === 'all' && single indicator string && hasGeo === 'any'`) using a precomputed `summaryStats.indicatorLookup` index instead of scanning/filtering the full dataset array. Any new filter combinations added to this function should consider whether they need a similar precomputed-index fast path, or whether they fall through to the `O(n)` `.filter()` path.
- **`isOversizedRequest` (`requestValidators.ts`) only rejects requests where time, indicator *and* geo are all simultaneously "large"** (`&&`, not `||`) — e.g. `time=all` across every indicator for a single small area is allowed, as is one broad geo group for a single time period. If optimization work changes what's actually expensive (e.g. after the cartesian-product cost above is addressed), revisit this heuristic rather than assuming it already guards the true hot spots.
- **`toJSONStat` (`dataFormatters.ts`) does a `structuredClone` of every cube key per dataset per request** to avoid mutating the shared in-memory cube — necessary for correctness (the cube is shared/cached across requests) but a real per-request cost worth profiling for JSON-format requests specifically.
- **XLSX generation (`generateXLSX.ts`) uses `@protobi/exceljs`** and is `await`ed inline in `filterDatasets.ts`/`getFilteredData.ts` — likely the heaviest format to generate; profile it separately from JSON/CSV before assuming the same bottlenecks apply.
- `dataFormatters.ts`'s `makeColFill` is an existing example of the codebase's preferred optimization style: build a specialized closure once outside the loop (based on the boolean flags for a given request) instead of branching per row — match this pattern rather than introducing per-item conditionals if optimizing similar hot loops.
- There's no benchmark/profiling script in the repo today — establish one (e.g. timing representative requests against `npm run preview`, or a Vitest bench) before/after changes so improvements are measured against real query shapes rather than assumed.
