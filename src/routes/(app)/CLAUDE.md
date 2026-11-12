# Front end (area C)

The user-facing pages (`src/routes/(app)/`), shared components (`src/lib/components/`) and front-end
helpers (`src/lib/utils.ts`, `src/lib/util/`, `src/lib/config.ts`). The overview, including a table
of every page and the data it loads, is under "C. Front end" in
[`docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md). Analytics events are in
[`docs/ANALYTICS.md`](../../../docs/ANALYTICS.md).

## How pages get data

- **Through the API, not `src/lib/api/` directly.** `load` functions are universal (`+page.ts`) and
  call `fetch(resolve('/api/v1/...'))`. During server rendering SvelteKit handles these in-process;
  in the browser they are HTTP requests. The response shapes are documented in `docs/api/`.
- Importing pure helpers from `src/lib/api/` is fine (area slug helpers, `getParam`,
  `hasValidParams`, format lists, `geoYearFilter`, `timeRangesOverlap`). Don't import anything that
  reads `$lib/data` through the server reader: it uses `$app/server` and won't run in the browser.
- A few small files are imported from `$lib/data/` directly, which puts them in the client bundle
  (`json-stat-summary.json`, `areas-in-data.json`, `geo-latest-year.json`, `geo-start-years.json`,
  `indicator_redirects.json`, `product-links.json`, and `topo.json` in `AreaNavMap.svelte`). Think
  about bundle size before adding another.
- Each page's `load` returns `title`, `description`, `pageType` and `breadcrumbLinks`, used by
  `(app)/+layout.svelte` for the `<head>`, breadcrumbs and the page-view event. `pageType` is
  reported to analytics as `contentSubType`, so changing it changes reports.
- `/indicators/[code]/embed` uses `+page@.svelte` to skip the `(app)` layout (no header, footer or
  page views), since it is shown in an iframe on other sites.

## Charts

- Build data URLs with `makeDataUrl()` (`src/lib/utils.ts`); the download links on
  `indicators/[code]/+page.svelte` are the only hand-built ones. A plain-string `indicator` gives
  the single-indicator route and an ungrouped response; an array, even with one item, gives the
  multi-indicator route and a response grouped by indicator. Charts use `cols.json`.
- `ChartDataLoader.svelte` fetches when the chart is visible and treats both an error body
  (`message`) and an empty `cols.json` (every column zero-length) as "no data". Empty results are
  200s, not errors.
- `ChartActions.svelte` derives download links by swapping the format in the chart's data URL, so a
  chart's downloads always match what it shows.
- If you change the parameters a chart sends, update the matching request shape in
  `src/lib/api/data/__fixtures__/queryShapes.ts`, which the API benchmarks use.

## Conventions

- Svelte 5 runes (`$props`, `$state`, `$derived`, `$effect`). Some older components still use
  `on:` event syntax from the design-system library.
- Use `@onsvisual/svelte-components` (ONS Design System) for UI before writing your own, and
  `getName()` from `@onsvisual/robo-utils` for area names with the right article ("the North East").
  See the README for working against a local copy of the library.
- Internal links and fetch paths go through `resolve()` from `$app/paths`: production runs under the
  base path `/explore-local-statistics`.
- Geography groupings come from `src/lib/config/geoLevels.ts` (shared with the pipeline and the API).
  Colours, palettes, `maxAreasSelectable` and `extremeAreas` are in `src/lib/config.ts`.
- Components used by one page live next to it in `src/routes/(app)/`; shared ones go in
  `src/lib/components/` (`charts/`, `modals/`, `nav/`, `visuals/`).
- Send analytics through `analyticsEvent()` or the wrappers in `src/lib/utils.ts`
  (`downloadEvent`, `areaSelectEvent`), and update `docs/ANALYTICS.md` when you add or change an
  event.
