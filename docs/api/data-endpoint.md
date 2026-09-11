# Requesting data

```
GET /api/v1/data.{format}?{parameters}
```

The main data endpoint. Filters the underlying JSON-Stat data cube by indicator, geography, time
and any other dimension, then returns the result in one of six formats. Read
[Conventions](./README.md#conventions-read-this-first) first if you haven't.

Implementation, if you need to trace behaviour beyond what's documented here:
`src/routes/(api)/api/v1/data.[format]/+server.ts` → `getFilteredData.ts` → `filterIndicators.ts`
(which datasets match) → `filterDatasets.ts` → `filterJSONStat` per dataset (dimension-level
filtering + formatting, in `dataFormatters.ts`).

## `{format}`

| Value | Output |
|---|---|
| `json` | JSON-Stat 2.0 (the cube format used internally) |
| `cols.json` | JSON, column-oriented: `{ areacd: [...], value: [...], ... }` |
| `rows.json` | JSON, row-oriented: `[{ areacd, value, ... }, ...]` |
| `csv` | Plain-text CSV |
| `csvw` | [CSV on the Web](https://csvw.org/) JSON metadata describing the equivalent `.csv` |
| `xlsx` | An accessible Excel workbook (native Table markup, named heading styles) |

Any other value returns `404` (`Requested data format "<x>" not found. Only json, xlsx, csv,
csvw, cols.json, rows.json available.`). Full descriptions and worked examples of each format's
actual content are in [data-formats.md](./data-formats.md) — this page focuses on parameters and
which format gets which response *shape*.

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `topic` | `all` | One or more topic/sub-topic codes |
| `indicator` | `all` | One or more indicator slugs |
| `excludeMultivariate` | `false` | Drop multivariate indicators unless explicitly named in `indicator` |
| `geo` | `all` | One or more area GSS codes, or geography level keys (`ctry`, `rgn`, `cauth`, `utla`, `ltla`) |
| `geoExtent` | `all` | Restrict `geo` level keys to areas within this parent GSS code |
| `geoCluster` | `all` | Restrict to a named cluster, `{grouping}_{cluster}` |
| `hasGeo` | `any` | Only include datasets/observations covering a given GSS code, level, or geography type |
| `time` | `latest` | A date, date range, or `earliest`/`latest`/`all` |
| `timeNearest` | `none` | Whether to substitute the nearest available date if the requested one is out of range |
| `measure` | `all` | Which measure column(s) to include (e.g. `value`, `lci_95`, `uci_95`) |
| `includeNames` | `true` | Include area names alongside area codes |
| `includeStatus` | `true` for `json`/`xlsx`, `false` otherwise | Include observation-status flags |
| `dimension_{code}` | `all` | Filter any other dimension the indicator has (discover valid codes/values via [the dimensions metadata route](./metadata-endpoint.md#get-apiv1metadataindicatorsindicatordimensionsdimension)) |

> **Corrections to the old wiki**: `includeNames` defaults to `true` here (not excluded by
> default as previously documented), and `geoExtent`'s default is the string `all` (not a UK GSS
> code) — see [gotchas.md](./gotchas.md) for this and other corrected defaults.

### `topic` / `indicator`

Comma-separated codes, or `all`. Combined, they're **additive** (OR'd), not a further narrowing —
`?topic=housing&indicator=employment-rate` returns every housing indicator *plus*
`employment-rate`, not their intersection. `indicator` values are indicator slugs (see
`/metadata/taxonomy` or `/metadata/indicators` to look these up).

```
GET /api/v1/data.csv?topic=housing,crime
GET /api/v1/data.json?indicator=employment-rate
```

Whether a request counts as "single indicator" (which changes the response *shape* for
`json`/`cols.json`/`rows.json` — see [Response shape](#response-shape-single-indicator-vs-collection)
below) is a specific, narrow condition: `topic` must be `all`, `indicator` must be a single slug
(not a list, not `all`). A topic-filtered request that happens to match only one indicator still
gets the multi-indicator (collection) shape.

### `excludeMultivariate`

Must be the literal string `true` to take effect (see
[coercion rules](./README.md#request-format)) — `?excludeMultivariate=1` is silently ignored.
When `true`, drops any multivariate indicator (one broken down by an extra dimension such as age
or sex) *unless* it's named explicitly in `indicator`.

```
GET /api/v1/data.csv?topic=population&excludeMultivariate=true
```

### `geo` / `geoExtent` / `geoCluster`

`geo` accepts GSS codes and/or the five geography-level keys `ctry`, `rgn`, `cauth`, `utla`,
`ltla` (comma-separated, mixable). Values must be **uppercase** GSS codes — unlike the `/geo/*`
lookup routes, this endpoint does not upper-case for you, so a lowercase code silently matches
nothing rather than erroring (see
[gotchas.md](./gotchas.md#uppercase-matters-here-and-only-here)).

```
GET /api/v1/data.csv?geo=ltla,K02000001
```

`geoExtent`, given a GSS code, restricts a `geo` level key to just that parent's descendants —
e.g. `ltla`s within a single region:

```
GET /api/v1/data.csv?geo=ltla&geoExtent=N92000002
```

`geoCluster` restricts to a named cluster (`{grouping}_{cluster}`, e.g. `economic_a`) — see
[data-endpoint.md#discovering-geocluster-values](#discovering-geocluster-values) below. It
doesn't remove individually-requested GSS codes from `geo` even if they're outside the cluster,
but it does override level keys in `geo`.

```
GET /api/v1/data.cols.json?indicator=employment-rate&geoCluster=global_a
```

#### Discovering `geoCluster` values

There's no dedicated endpoint for cluster codes; the three valid `{grouping}` values as shipped
are `global`, `economic` and `demographic`, each with clusters `a`–`d` (i.e. `global_a` …
`demographic_d`). This is app data, not a fixed enum — treat it as illustrative rather than a
permanent contract.

### `hasGeo`

Restricts to datasets/observations that cover a specific area. Unlike `geo` (which filters
*which observations come back*), `hasGeo` is closer to "does this indicator exist for this
place at all" — and it accepts three different kinds of value, resolved in this order:

1. A GSS code (`E07000148`) — datasets that include that exact area.
2. One of the five geography-level keys (`ctry`, `rgn`, `cauth`, `utla`, `ltla`) — datasets whose
   coverage includes that level.
3. A geography **type** code (the 3-character GSS prefix, e.g. `E07`, `E06`, `cauth`'s `E47`) —
   datasets whose coverage includes that type. The full set of type codes recognised here is
   `K02`, `E92`, `N92`, `S92`, `W92`, `E12`, `E47`, `E10`, `E06`, `E08`, `E09`, `N09`, `S12`,
   `W06`, `E07`.

Anything else (including `all` — see [gotchas.md](./gotchas.md#hasgeoall-crashes-with-a-500)) is
a `400`. The default, `any`, means "no filter" — this is **not** the same sentinel the metadata
endpoints use for "no filter" (they use `all`; `any` is invalid there). See
[gotchas.md](./gotchas.md#the-hasgeo-no-filter-sentinel-is-not-the-same-string-everywhere) for
the full comparison.

`hasGeo` interacts with `time`: a **level** key (`ltla` etc.) filters at the dataset level only
and leaves time filtering untouched, but a **GSS code or type code** additionally restricts which
*time periods* are considered to ones where that specific area/type actually has an observation —
so combining a type-code `hasGeo` with the default `time=latest` can come back empty even though
the same request with `time=all` succeeds, because "latest" for the *unfiltered* dataset isn't
necessarily a period where that type has data:

```
GET /api/v1/data.json?indicator=employment-rate&hasGeo=E07                → 400, no data (with default time=latest)
GET /api/v1/data.json?indicator=employment-rate&hasGeo=E07&time=all       → 200
```

### `time` / `timeNearest`

| `time` value | Behaviour |
|---|---|
| `latest` (default) | Most recent available period |
| `earliest` | Earliest available period |
| `all` | Every available period |
| `YYYY` | Last available value in that year |
| `YYYY-MM` | Last available value in that month |
| `YYYY-MM-DD` | A value only if it falls on that exact date |
| `A,B` (any two of the above, comma-separated) | Every period from the start of `A` to the end of `B`, inclusive. `earliest`/`latest` are valid as either end: `time=earliest,2010`, `time=2010,latest`. |

```
GET /api/v1/data.cols.json?indicator=employment-rate&geo=E07000148&time=2019,2025
```

`timeNearest` only applies to a **single** time value, not a range — passing it alongside a
`time` range is accepted but silently has no effect (confirmed by reading `filterTime`/
`getTimeRange` in `dataFilters.ts`: the range code path never reads `nearest` at all).

| `timeNearest` value | Behaviour (single `time` value only) |
|---|---|
| `none` (default) | Return nothing if the requested date isn't covered |
| `latest` | Substitute the latest available period if the requested date is later than any available |
| `earliest` | Substitute the earliest available period if the requested date is earlier than any available |
| `any` | Whichever of the above applies |

```
GET /api/v1/data.cols.json?indicator=employment-rate&geo=E07000148&time=2030&timeNearest=latest
```

A `time` value has to be a real year within the dataset's overall range (checked against the
cube's known year span before any per-dataset filtering runs) or the request is a flat `400`
(`Request contained invalid time period.`) — this applies even to values inside a range, so an
out-of-bounds range endpoint fails validation before `timeNearest` would ever come into play.

### `measure`

Which measure column(s) to include — e.g. `value`, `lci_95`, `uci_95` for indicators with
confidence intervals. Valid values are indicator-specific; discover them via that indicator's
`measure` dimension (`/metadata/indicators/{indicator}?fullDims=true`, or
`/metadata/indicators/{indicator}/dimensions/measure`). Default `all` includes every measure the
indicator has.

```
GET /api/v1/data.cols.json?indicator=employment-rate&geo=E07000148&measure=value
```

### `dimension_{code}`

Filters any dimension that isn't geography or time — e.g. `age`, `sex` on a multivariate
indicator. The set of valid `{code}` suffixes isn't a fixed list in code: it's
`summaryStats.otherDims` — an array baked into the bundled `json-stat-summary.json` by the data
pipeline (`scripts/data:generate`), listing every non-geo/non-time dimension key that appears
*anywhere* across the whole data cube. As shipped, that's exactly two: `sex` and `age` (so
`dimension_sex` and `dimension_age` are the only two accepted `dimension_*` parameter names right
now) — this will grow if a future dataset adds a new dimension, without any code change. Any
`dimension_{code}` not in that list is rejected outright by
[parameter validation](./README.md#request-format) (`400`, unknown parameter) before filtering
even runs — so an unrecognised `dimension_*` name fails the same generic way a typo'd unrelated
parameter would, not with a dimension-specific error message. Comma-separate multiple values for
the same dimension.

```
GET /api/v1/data.cols.json?indicator=population-by-age-and-sex&geo=E07000148&dimension_sex=female&dimension_age=0-4,5-9
```
```json
{
  "areacd": ["E07000148", "E07000148"],
  "areanm": ["Norwich", "Norwich"],
  "period": ["2024-06-30", "2024-06-30"],
  "sex": ["Female", "Female"],
  "age": ["0 to 4", "5 to 9"],
  "value": [2.21, 2.44]
}
```

### `includeNames` / `includeStatus`

`includeNames=true` (the default) adds an `areanm` field/column alongside `areacd`.
`includeStatus` adds an observation-level status flag where the underlying dataset has one
(defaults to `true` for `json`/`xlsx`, `false` for the other four formats — the one parameter
whose default genuinely varies by `{format}`).

## Response shape: single indicator vs. collection

This is the sharpest edge in the whole API and the one most likely to break a client that assumes
one consistent shape. Whether a request is "single indicator" is decided once, by the narrow rule
in [`topic`/`indicator`](#topic--indicator) above (`topic=all` **and** a single `indicator`
slug) — and it changes the top-level shape for three of the six formats:

| Format | Single indicator | Multiple / all indicators |
|---|---|---|
| `json` | A bare JSON-Stat **dataset** object (`class: "dataset"`) | A JSON-Stat **collection** (`class: "collection"`, datasets under `link.item[]`) |
| `cols.json` | The bare columns object directly (`{ areacd: [...], value: [...] }`) | An object keyed by indicator slug, each value a columns object (`{ "employment-rate": {...}, "claimant-count": {...} }`) |
| `rows.json` | A bare array of row objects | An object keyed by indicator slug, each value an array of row objects |
| `csv` | No `indicator` column | An `indicator` column (the indicator's display label) is prepended to every row |
| `csvw` | Dataset-specific Dublin Core fields (`dc:title`, `dc:description`, etc.) present; no `indicator` column described | No dataset-specific fields; an `indicator` column with an `aboutUrl` pointing back at `/metadata/indicators` is described instead |
| `xlsx` | One data sheet | One sheet per indicator (plus a table-of-contents and notes sheet) |

**`json`, single indicator** (`?indicator=employment-rate&geo=E07000148`):
```json
{
  "version": "2.0",
  "class": "dataset",
  "label": "Employment rate (Great Britain)",
  "id": ["areacd", "period", "measure"],
  "size": [1, 1, 3],
  "dimension": {
    "areacd": { "label": "Area code", "category": { "index": { "E07000148": 0 }, "label": { "E07000148": "Norwich" } } },
    "period": { "label": "Time period", "category": { "index": { "2023-01-01/P1Y": 0 } } },
    "measure": { "label": "Measure", "category": { "index": { "value": 0, "lci_95": 1, "uci_95": 2 } } }
  },
  "status": {},
  "value": [82.7, 75, 90.4]
}
```

**`json`, multiple indicators** (`?topic=employment&geo=E07000148`):
```json
{
  "version": "2.0",
  "class": "collection",
  "label": "ONS Explore Local Statistics API response",
  "link": { "item": [ { "class": "dataset", "...": "one full dataset object per indicator, same shape as above" } ] }
}
```

**`cols.json`, two indicators** (`?indicator=employment-rate,claimant-count&geo=E07000148`):
```json
{
  "employment-rate": { "areacd": ["E07000148"], "areanm": ["Norwich"], "period": ["2023-01-01/P1Y"], "value": [82.7], "lci_95": [75], "uci_95": [90.4] },
  "claimant-count": { "areacd": ["E07000148"], "areanm": ["Norwich"], "period": ["2025-01-01/P1Y"], "value": [4] }
}
```
Note the different `period` per indicator (each has its own `latest`) and that `claimant-count`
has no confidence-interval columns at all — column sets vary **per indicator**, not just per
request. A client that infers columns from the first indicator and applies them to the rest will
be wrong.

**`csv`, two indicators**:
```csv
indicator,areacd,areanm,period,value,lci_95,uci_95
Employment rate (Great Britain),E07000148,Norwich,2023-01-01/P1Y,82.7,75,90.4
Claimant Count,E07000148,Norwich,2025-01-01/P1Y,4,,
```
(CSV always has one fixed column set for the whole response — the union across all indicators —
so `claimant-count`'s missing confidence-interval cells come back as empty strings, not absent
columns.)

## No matching data

If every filter passes validation but nothing actually matches (wrong combination of `geo` +
`time` + indicator, for instance), the response is **`400`**, not an empty `200` or a `404`:
```json
{ "message": "No data available for the selected filters." }
```

## Requests that get rejected as too large

Before filtering runs, `isOversizedRequest` (`requestValidators.ts`) rejects a request with `400`
(`Too much data requested. Try narrowing your parameters.`) if **all three** of these are true at
once — this is a deliberate `&&`, not an accidental one; a request only needs to be narrow on
*one* of the three axes to be allowed:

- **time** is broad: `time=all`, or a range/list of more than one period.
- **indicator selection** is broad: `indicator=all`, more than 20 comma-separated indicators, or
  more than one `topic`.
- **geo** is broad: no `geoExtent`/`geoCluster` narrowing it down, and `geo` includes `all`,
  `ltla` or `utla`.

`format=csvw` is exempt from this check entirely (it returns metadata only, not observation
data, regardless of how broad the filters are).

Because it's an AND, plenty of individually-large requests are allowed through: `time=all` across
every indicator for one small area, or one broad `geo` group for a single time period, are both
fine. If you're building a client that needs to avoid `400`s on large pulls, narrow at least one
axis — `geoExtent` or `geoCluster` to make `geo` non-broad is usually the cheapest lever, since it
doesn't require giving up `time=all` or `indicator=all`.
