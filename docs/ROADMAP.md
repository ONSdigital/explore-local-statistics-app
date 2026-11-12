# Roadmap

Open work only, tagged by area (Data pipeline, API, Front end, Build and deploy, Docs). Reasons
behind past decisions are in [DECISIONS.md](./DECISIONS.md). When something here is done, delete it
and add a line to `DECISIONS.md`.

## Where things stand (14 Oct 2026)

- Data updates go through the process in
  [`scripts/managing-updates.md`](../scripts/managing-updates.md), which happens regularly.
- The `/api/v1/` API was reworked and documented in Sep 2026 ([docs/api/](./api/README.md)). It is
  used by the app's own pages and is not yet publicised to outside users, so breaking changes are
  still possible.
- There are no real automated tests (see below), so changes are checked with `npm run check`,
  `npm run lint`, the data API benchmarks and by hand in the dev server.

## Tests

| Area      | Item                                               | Notes                                                                                                                                                                                                                                                                 |
| --------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API       | Unit tests for the data API                        | Highest value first: the shared cube is never mutated across requests (the check described in DECISIONS.md, 9 Sep 2026, was never committed); the `filterIndicators` fast path gives the same result as a scan; empty-result shapes; `hasGeo` by code, level and type |
| Front end | Unit tests for `makeDataUrl` and area slug helpers | Tests for the slug helpers and `slugify` existed under `src/lib/util/` and were deleted (Jan 2026, when the app code was migrated from the `els-api-poc` repo); worth bringing back against `src/lib/api/geo/helpers/areaSlugUtils.ts`                                |
| Front end | Replace the Playwright starter test                | `tests/test.ts` looks for "Welcome to SvelteKit" and would fail. A few smoke tests (home, an area page, an indicator page, an embed) would catch broken loads                                                                                                         |
| Tests     | Remove `src/index.test.ts`                         | A `1 + 2 = 3` placeholder, once real unit tests exist                                                                                                                                                                                                                 |

## API

| Area | Item                                               | Notes                                                                                                                                                                                                                                                                                                                                   |
| ---- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API  | `Cache-Control` headers                            | None are set. Cloudflare covers the server side, but browsers and other clients re-request every time. The data only changes on deploy, so long cache times are possible if URLs or ETags allow it                                                                                                                                      |
| API  | Finish the review of `docs/api/important-notes.md` | Reviewed item by item in Sep 2026, deciding fix or leave for each: present one item with a recommendation, and agree before changing code. Still to decide: boolean parameters only accept the exact word `true` (`getParam`), and the `fullDims` difference between the two dimension-metadata routes (probably fine, as cost control) |
| API  | Empty multi-indicator responses                    | When nothing matches, `cols.json`/`rows.json` return `{}`. No decision yet on whether that is the right empty shape                                                                                                                                                                                                                     |
| API  | Large CSV responses                                | CSV is returned as one string (`text()`). Wrapping large bodies as a stream was much faster for `Buffer`s in testing (DECISIONS.md, Streaming); not yet measured for CSV                                                                                                                                                                |
| API  | Shorten the comment in `data.[format]/+server.ts`  | The XLSX branch's comment narrates the streaming change; the detail is now in DECISIONS.md                                                                                                                                                                                                                                              |
| API  | `handleError` hook                                 | Commented out in `src/hooks.server.ts` because it broke the custom logger                                                                                                                                                                                                                                                               |

## Front end

| Area      | Item                                  | Notes                                                                                                                                                                                                                       |
| --------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Front end | Fix the analytics quirks              | Listed in [ANALYTICS.md](./ANALYTICS.md#known-quirks). To be fixed as a separate piece of work. Agree the changes with whoever uses the analytics data first, since fixes change what reports see, then update ANALYTICS.md |
| Front end | `topo.json` in the area page's bundle | `AreaNavMap.svelte` imports the ~700 KB `topo.json` into client JavaScript. Check whether it should be fetched from `/api/v1/geo/boundaries.topojson` instead, as charts do                                                 |

## Build and deploy

| Area             | Item                      | Notes                                                                                                                                                                                                                                         |
| ---------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build and deploy | Turn on lint in CI        | `make lint` is a no-op (`exit 0`). Run `npm run lint` locally first and fix what it finds                                                                                                                                                     |
| Build and deploy | Remove `ENABLE_S3_ASSETS` | Decided not to return to serving assets from a CDN bucket (DECISIONS.md, Build and deploy). Remove the switch and the bucket steps from the `Makefile` and `Dockerfile` (`Makefile` TODO); check the Nomad plan's asset path at the same time |

## Docs

| Area | Item                         | Notes                                                                                       |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| Docs | `.prettierignore` stale path | Ignores `scripts/insights/raw`, which no longer exists; raw data is now `scripts/raw-data/` |
