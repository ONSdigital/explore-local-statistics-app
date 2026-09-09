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
- **No `Cache-Control` headers are set anywhere in `src/routes/(api)/`** (checked, none exist). The deployed app sits behind Cloudflare, which already covers server/edge-side caching, so that's not a gap to fix here. `Cache-Control` also governs the _client's own_ cache, though (browser, or any API consumer) — without it, repeat requests for the same URL always go back out over the network instead of being served locally. That's the remaining opportunity, and it's independent of Cloudflare.
- **Cost scales with the cartesian product of filtered dimensions, not the output size.** `dimsToItems` (`dataFormatters.ts`) expands filtered dims into every combination before `itemsToCols`/`colsToRows` filters out empty values — a request with several loosely-filtered dimensions can be expensive even if few observations actually have data. Profile with real query shapes, not just "large result" requests.
- **`filterIndicators.ts` has a fast path** (`params.topic === 'all' && single indicator string && hasGeo === 'any'`) using a precomputed `summaryStats.indicatorLookup` index instead of scanning/filtering the full dataset array — measured ~25-35x faster than the scan path (see `filterIndicators.bench.ts`). Any new filter combinations added to this function should consider whether they need a similar precomputed-index fast path, or whether they fall through to the `O(n)` `.filter()` path.
- **`isOversizedRequest` (`requestValidators.ts`) only rejects requests where time, indicator _and_ geo are all simultaneously "large"** (`&&`, not `||`) — e.g. `time=all` across every indicator for a single small area is allowed, as is one broad geo group for a single time period. The real "download data" links on indicator pages (`/api/v1/data.xlsx?indicator=<slug>&time=all`) hit exactly this gap: single indicator + `time=all` + default `geo=all` is a genuinely broad request that isn't rejected. If optimization work changes what's actually expensive, revisit this heuristic rather than assuming it already guards the true hot spots.
- **`toJSONStat` (`dataFormatters.ts`) does a `structuredClone` of every cube key per dataset per request** to avoid mutating the shared in-memory cube — necessary for correctness (the cube is shared/cached across requests) but a real per-request cost worth profiling for JSON-format requests specifically.
- **`cols.json` — the format every chart in the app actually requests (see `IndicatorChart.svelte`/`ChartDataLoader.svelte`) — measured ~4-6x slower than plain `json` for the same filtered data**, and its own `dimsToItems`/`itemsToCols` step is the one built with the "specialized closure" pattern below. Since it's the highest-traffic format by far, it should be the priority target for optimization work, not `json`/`csv`/`xlsx` which are comparatively rare.
- **XLSX generation (`generateXLSX.ts`) uses `@protobi/exceljs`** and is by far the most expensive format — measured ~90-110ms for a single-indicator/all-geo/all-time request, ~150-1000x slower than the equivalent `cols.json`/`json` request for the same filter (`generateXLSX.bench.ts`, `getFilteredData.bench.ts`). It currently builds the whole workbook via `workbook.xlsx.writeBuffer()` (not exceljs's separate `stream.xlsx.WorkbookWriter` streaming API) — relevant to both the planned `@protobi/exceljs` → `documonster` migration and any streaming investigation (see below).
- `dataFormatters.ts`'s `makeColFill` is an existing example of the codebase's preferred optimization style: build a specialized closure once outside the loop (based on the boolean flags for a given request) instead of branching per row — match this pattern rather than introducing per-item conditionals if optimizing similar hot loops.

### Benchmarks

A Vitest benchmark suite exists under `src/lib/api/data/` — run it with `npm run test:bench` (or `npx vitest bench <path>` for one file). It measures the pipeline above against representative request shapes rather than synthetic worst cases:

- `__fixtures__/queryShapes.ts` — the shared request-param fixtures, each commented with which real UI call site it represents (chart line/table, chart map/bar, single-value, full download). Keep these in sync if those call sites' param-building logic changes.
- `getFilteredData.bench.ts` — end-to-end pipeline timing across the fixtures above, plus a same-query format comparison (`cols.json`/`rows.json`/`json`).
- `filterIndicators.bench.ts` — isolates the dataset-level filter's fast path vs. scan path.
- `helpers/generateXLSX.bench.ts` — isolates spreadsheet generation from filtering, using the full-download fixture. **Re-run this one before and after the `@protobi/exceljs` → `documonster` swap**, against the same fixture, to compare the two libraries like-for-like rather than by feel — it's the reason this file exists as its own benchmark rather than being folded into `getFilteredData.bench.ts`.

**`src/test/mockAppServer.ts`** (wired in via `test.setupFiles` in `vite.config.ts`) mocks `$app/server`'s `read()`, which `src/lib/data/index.ts` depends on. That function needs SvelteKit's dev/build runtime and throws (`__SVELTEKIT_TRACK__ is not defined`) under plain Vitest — so before this, nothing importing `$lib/data` (i.e. most of `src/lib/api/`) could be unit-tested or benchmarked at all. The mock reads the same files straight off disk instead; it's only valid pre-build (a built app's asset URLs are content-hashed, which the mock doesn't attempt to resolve), so it's for `test:unit`/`test:bench`, not for exercising the real production asset path.

### Streaming (open investigation, not yet implemented)

No part of the current pipeline streams — `+server.ts` always returns a fully-built `Response` (`json(datasets.data)` or a complete `Buffer`/string), and `dimsToItems`/`itemsToCols`/`generateXLSX` all build their entire result in memory before anything is returned. The benchmarks above are the baseline to compare a streaming approach against: they measure _total_ time, which is what streaming would trade for a faster _time-to-first-byte_ at (likely) similar or higher total cost. Concretely:

- For `cols.json`/`json`/`rows.json`, streaming would mean restructuring `+server.ts` to return a `ReadableStream` and `dataFormatters.ts` to yield incrementally rather than building full arrays — a bigger change than it looks, since `itemsToCols`'s column-oriented output (`{ areacd: [...], value: [...] }`) doesn't have a natural row-by-row streaming shape the way `toRows`'s output does.
- For `xlsx`, exceljs (and presumably `documonster`, given its "similar API") has a separate streaming writer (`stream.xlsx.WorkbookWriter`) distinct from the `Workbook`/`writeBuffer()` API `generateXLSX.ts` uses today — worth evaluating as part of the same migration rather than as a separate follow-up, so the format isn't re-plumbed twice.
- Whatever's tried, benchmark it against `getFilteredData.bench.ts`'s existing fixtures so "faster" is measured against the same shapes, and capture time-to-first-byte specifically (Vitest `bench` alone won't show that — it measures total function time) rather than only total time.
