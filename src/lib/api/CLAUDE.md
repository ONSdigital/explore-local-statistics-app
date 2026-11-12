# Back end and API (area B)

The query layer (`src/lib/api/`), the routes that expose it (`src/routes/(api)/`) and the data reader
(`src/lib/data/index.ts`). The overview is under "B. Back end and API" in
[`docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md). The behaviour API consumers rely on is
documented in [`docs/api/`](../../../docs/api/README.md): read the relevant page, and
`docs/api/important-notes.md`, before changing what a route accepts or returns, and update them
alongside the change. Past fixes and measurements are in `docs/DECISIONS.md` ("API and back end").

## Layout

- `data/`, `geo/`, `metadata/`: one domain each. `getX.ts` files are the entry points; `helpers/`
  are internal. `utils.ts` has parameter parsing (`getParam`) and validation (`hasValidParams`);
  `config.ts` has the allowed formats and parameters per route, and the ONS CDN base URLs that
  `geo/` fetches from at request time.
- Route handlers in `src/routes/(api)/api/v1/` stay thin: validate parameters, call one entry point,
  turn `{ error, message }` into `error()`, and return the response.
- Data request path: `+server.ts` → `getFilteredData.ts` → `filterIndicators.ts` →
  `filterDatasets.ts` (`filterJSONStat` per dataset) → `helpers/dataFormatters.ts`
  (`dimsToCols`/`colsToRows`/`toJSONStat`), or `generateCSV.ts`/`generateCSVW.ts`/`generateXLSX.ts`.

## Rules

- **Never mutate data from `$lib/data`.** The default export of `$lib/data` returns the same cached object to every
  request, so a change made for one request corrupts all later ones. `toJSONStat` copies only what it
  replaces (`size`, and each dimension's `category`); follow that pattern.
- **Check `.error` straight away** on anything that can return `{ error, message }` instead of its
  normal result (`filterIndicators`, `makeDatasetFilter`, `getFilteredData`, `getTaxonomy`…). Missing
  this check has caused 500s three times.
- **Every route calls `hasValidParams`**, even routes that take no parameters, so unknown parameters
  are a 400 rather than ignored.
- **Two data routes, fixed shapes.** `data.[format]` is always grouped by indicator (even for zero
  or one match); `data/[indicator].[format]` is always one ungrouped indicator. The route handler
  sets `params.singleIndicator`; don't infer it from the number of matches. Anything that varies by
  shape (CSV `indicator` column, CSVW fields) must use that flag.
- **Empty results are 200s**, not errors. `filterJSONStat` returns `null` only when the measure
  dimension (always last) is empty.
- **`hasGeo`'s no-filter value is `any`** everywhere. It can be an area code, a geography level or a
  type: use `makeDatasetGeoFilter` (`metadata/helpers/datasetFilters.ts`) rather than reimplementing the check (the `filterIndicators` fast
  path does this).
- GSS codes in parameters are upper-cased before matching. Note that there are two different
  `makeGeoFilter` functions (`data/helpers/makeGeoFilter.ts` and `geo/helpers/geoFilters.ts`).
- `excludeMultivariate` never excludes an indicator named explicitly.

## Performance

- The cube (~11 MB) is parsed once per process; making the read faster won't help requests.
- Cost grows with the number of combinations of the filtered dimensions, not the output size.
  Profile with the real request shapes in `data/__fixtures__/queryShapes.ts`, and keep those in step
  with the front-end code that builds them.
- `cols.json` is the format every chart uses and the one most worth optimising. In hot loops, follow
  `makeColFill` (`dataFormatters.ts`): build a specialised closure once per request, from its flags
  and resolved output arrays, rather than branching or looking up properties per row.
- XLSX is streamed (`Workbook.toStream`, returned as a `Readable`). Native Excel Tables, with filter
  buttons off, and named heading styles are accessibility requirements, which is why
  `Stream.WorkbookWriter` (no Tables) can't be used. Streaming only helps workbooks with many sheets.
- JSON formats stay buffered; streaming them was tried and is slower. No `Cache-Control` is set
  (see `docs/ROADMAP.md`).
- Benchmarks: `npm run test:bench`, or one file with `npx vitest bench <path>`.
  - `getFilteredData.bench.ts`: the whole pipeline, plus a format comparison.
  - `filterIndicators.bench.ts`: fast path and scan path. Only the topic-filtered and all-indicator
    cases take the scan path. Check the fast-path condition in `filterIndicators.ts` before adding a
    case meant to cover the scan.
  - `helpers/generateXLSX.bench.ts`: spreadsheet generation alone.

## Testing

`src/test/mockAppServer.ts` (a Vitest setup file) stands in for `$app/server`'s `read()`, which
throws outside SvelteKit, so code importing `$lib/data` can run under Vitest. It reads source files,
so it only works before a build. There are no unit tests yet: verify behaviour changes against the
dev server (`curl` the affected routes) and update `docs/api/` with what you find.
