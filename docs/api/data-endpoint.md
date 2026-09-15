# Requesting data for multiple indicators

```
GET /api/v1/data.{format}?{parameters}
```

Filters the statistical data by indicator, geography, time and any other dimension, then returns
every matching indicator's data in one of six formats. **Always returns data grouped by
indicator**, even if your request only ever matches one — see [What you get back](#what-you-get-back)
below. If you want just one indicator, named up front, use
[the single-indicator endpoint](./data-item-endpoint.md) (`/api/v1/data/{indicator}.{format}`)
instead — it returns that indicator's data directly, without the grouping, and has a couple of
other differences of its own. Read [Conventions](./README.md#conventions-read-this-first) first if
you haven't.

## `{format}`

| Value       | Output                                                                             |
| ----------- | ---------------------------------------------------------------------------------- |
| `json`      | JSON-Stat 2.0 (a standard format for statistical data cubes)                       |
| `cols.json` | JSON, column-oriented: `{ areacd: [...], value: [...], ... }`                      |
| `rows.json` | JSON, row-oriented: `[{ areacd, value, ... }, ...]`                                |
| `csv`       | Plain-text CSV                                                                     |
| `csvw`      | [CSV on the Web](https://csvw.org/) JSON metadata describing the equivalent `.csv` |
| `xlsx`      | An accessible Excel workbook (native Table markup, named heading styles)           |

Any other value returns `404` (`Requested data format "<x>" not found. Only json, xlsx, csv,
csvw, cols.json, rows.json available.`). Full descriptions and worked examples of each format's
actual content are in [data-formats.md](./data-formats.md) — this page focuses on parameters and
what you get back overall.

## Parameters

| Parameter             | Default                                     | Description                                                                                                                                                                                    |
| --------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `topic`               | `all`                                       | One or more topic/sub-topic codes                                                                                                                                                              |
| `indicator`           | `all`                                       | One or more indicator slugs                                                                                                                                                                    |
| `excludeMultivariate` | `false`                                     | Drop multivariate indicators unless explicitly named in `indicator`                                                                                                                            |
| `geo`                 | `all`                                       | One or more area GSS codes, or geography level keys (`ctry`, `rgn`, `cauth`, `utla`, `ltla`)                                                                                                   |
| `geoExtent`           | `all`                                       | Restrict `geo` level keys to areas within this parent GSS code                                                                                                                                 |
| `geoCluster`          | `all`                                       | Restrict to a named cluster, `{grouping}_{cluster}`                                                                                                                                            |
| `hasGeo`              | `any`                                       | Only include indicators/observations covering a given GSS code, level, or geography type                                                                                                       |
| `time`                | `latest`                                    | A date, date range, or `earliest`/`latest`/`all`                                                                                                                                               |
| `timeNearest`         | `none`                                      | Whether to substitute the nearest available date if the requested one is out of range                                                                                                          |
| `measure`             | `all`                                       | Which measure column(s) to include (e.g. `value`, `lci_95`, `uci_95`)                                                                                                                          |
| `includeNames`        | `true`                                      | Include area names alongside area codes                                                                                                                                                        |
| `includeStatus`       | `true` for `json`/`xlsx`, `false` otherwise | Include observation-status flags                                                                                                                                                               |
| `dimension_{code}`    | `all`                                       | Filter any other dimension the indicator has (discover valid codes/values via [the dimensions metadata route](./metadata-endpoint.md#get-apiv1metadataindicatorsindicatordimensionsdimension)) |

> **Corrections to the old wiki**: `includeNames` defaults to `true` here (not excluded by
> default as previously documented), and `geoExtent`'s default is the string `all` (not a UK GSS
> code) — see [important-notes.md](./important-notes.md) for this and other corrected defaults.

### `topic` / `indicator`

Comma-separated codes, or `all`. Combined, they're **additive** (OR'd), not a further narrowing —
`?topic=housing&indicator=employment-rate` returns every housing indicator _plus_
`employment-rate`, not their intersection. `indicator` values are indicator slugs (see
`/metadata/taxonomy` or `/metadata/indicators` to look these up).

```
GET /api/v1/data.csv?topic=housing,crime
GET /api/v1/data.json?indicator=employment-rate
```

Naming a single specific indicator here still groups it under that one indicator's name in the
response — this endpoint's response never changes shape depending on how many indicators end up
matching. If you want the data for one indicator returned directly, without that grouping, use
[`/api/v1/data/{indicator}.{format}`](./data-item-endpoint.md) instead.

### `excludeMultivariate`

Must be the exact word `true` to take effect (see
[value-parsing rules](./README.md#request-format)) — `?excludeMultivariate=1` is silently ignored.
When `true`, drops any multivariate indicator (one broken down by an extra dimension such as age
or sex) _unless_ it's named explicitly in `indicator`.

```
GET /api/v1/data.csv?topic=population&excludeMultivariate=true
```

### `geo` / `geoExtent` / `geoCluster`

`geo` accepts GSS codes and/or the five geography-level keys `ctry`, `rgn`, `cauth`, `utla`,
`ltla` (comma-separated, mixable). GSS codes are case-insensitive, same as everywhere else in
this API.

```
GET /api/v1/data.csv?geo=ltla,K02000001
```

`geoExtent`, given a GSS code, restricts a `geo` level key to just that parent's descendants —
e.g. `ltla`s within a single region:

```
GET /api/v1/data.csv?geo=ltla&geoExtent=N92000002
```

`geoCluster` restricts to a named cluster (`{grouping}_{cluster}`, e.g. `economic_a`) — see
[Discovering `geoCluster` values](#discovering-geocluster-values) below. It doesn't remove
individually-requested GSS codes from `geo` even if they're outside the cluster, but it does
override level keys in `geo`.

```
GET /api/v1/data.cols.json?indicator=employment-rate&geoCluster=global_a
```

#### Discovering `geoCluster` values

There's no dedicated endpoint for cluster codes; the three valid `{grouping}` values as shipped
are `global`, `economic` and `demographic`, each with clusters `a`–`d` (i.e. `global_a` …
`demographic_d`). This list is drawn from live service data, not a fixed set — treat it as
illustrative rather than a permanent contract.

### `hasGeo`

Restricts to indicators/observations that cover a specific area. Unlike `geo` (which filters
_which observations come back_), `hasGeo` is closer to "does this indicator exist for this
place at all" — and it accepts three different kinds of value, resolved in this order:

1. A GSS code (`E07000148`) — indicators that include that exact area.
2. One of the five geography-level keys (`ctry`, `rgn`, `cauth`, `utla`, `ltla`) — indicators whose
   coverage includes that level.
3. A geography **type** code (the 3-character GSS prefix, e.g. `E07`, `E06`, `cauth`'s `E47`) —
   indicators whose coverage includes that type. The full set of type codes recognised here is
   `K02`, `E92`, `N92`, `S92`, `W92`, `E12`, `E47`, `E10`, `E06`, `E08`, `E09`, `N09`, `S12`,
   `W06`, `E07`.

Anything else, including `all`, is a `400` (`Invalid 'hasGeo' parameter...`). The default, `any`,
means "no filter" — the same setting the [metadata endpoints](./metadata-endpoint.md) use for
`hasGeo`, so a value can be reused across both without translating it.

`hasGeo` interacts with `time`: a **level** key (`ltla` etc.) filters at the indicator level only
and leaves time filtering untouched, but a **GSS code or type code** additionally restricts which
_time periods_ are considered to ones where that specific area/type actually has an observation —
so combining a type-code `hasGeo` with the default `time=latest` can come back empty even though
the same request with `time=all` succeeds, because "latest" for the _unfiltered_ indicator isn't
necessarily a period where that type has data:

```
GET /api/v1/data.json?indicator=employment-rate&hasGeo=E07                → 200, empty (value: []) with default time=latest
GET /api/v1/data.json?indicator=employment-rate&hasGeo=E07&time=all       → 200, populated
```

### `time` / `timeNearest`

| `time` value                                  | Behaviour                                                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `latest` (default)                            | Most recent available period                                                                                                                            |
| `earliest`                                    | Earliest available period                                                                                                                               |
| `all`                                         | Every available period                                                                                                                                  |
| `YYYY`                                        | Last available value in that year                                                                                                                       |
| `YYYY-MM`                                     | Last available value in that month                                                                                                                      |
| `YYYY-MM-DD`                                  | A value only if it falls on that exact date                                                                                                             |
| `A,B` (any two of the above, comma-separated) | Every period from the start of `A` to the end of `B`, inclusive. `earliest`/`latest` are valid as either end: `time=earliest,2010`, `time=2010,latest`. |

```
GET /api/v1/data.cols.json?indicator=employment-rate&geo=E07000148&time=2019,2025
```

`timeNearest` only applies to a **single** time value, not a range — passing it alongside a
`time` range is accepted but silently has no effect.

| `timeNearest` value | Behaviour (single `time` value only)                                                         |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `none` (default)    | Return nothing if the requested date isn't covered                                           |
| `latest`            | Substitute the latest available period if the requested date is later than any available     |
| `earliest`          | Substitute the earliest available period if the requested date is earlier than any available |
| `any`               | Whichever of the above applies                                                               |

```
GET /api/v1/data.cols.json?indicator=employment-rate&geo=E07000148&time=2030&timeNearest=latest
```

A `time` value has to be a real year within the service's known data range or the request is a
flat `400` (`Request contained invalid time period.`) — this applies even to values inside a
range, so an out-of-bounds range endpoint fails validation before `timeNearest` would ever come
into play.

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
indicator. The set of valid `{code}` suffixes isn't a fixed list — it's generated from the
underlying data and lists every non-geography/non-time dimension key that appears _anywhere_
across the whole data set. As shipped, that's exactly two: `sex` and `age` (so `dimension_sex`
and `dimension_age` are the only two accepted `dimension_*` parameter names right now) — this
list will grow if a future data update adds a new dimension. Any `dimension_{code}` not in that
list is rejected outright (`400`, unrecognised parameter) before filtering even runs — so a
misspelled `dimension_*` name fails the same generic way a typo'd unrelated parameter would, not
with a dimension-specific error message. Comma-separate multiple values for the same dimension.

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
`includeStatus` adds an observation-level status flag where the underlying indicator has one
(defaults to `true` for `json`/`xlsx`, `false` for the other four formats — the one parameter
whose default genuinely varies by `{format}`).

## What you get back

Every format here groups results by indicator, whether one indicator matched or many — this
endpoint's response never changes structure depending on how many indicators end up matching.
(This wasn't always true — see
[important-notes.md](./important-notes.md#the-two-data-endpoints-and-what-they-replaced) if you're looking for
the older, less predictable behaviour this replaced.)

| Format      | What you get                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `json`      | A wrapper object with every matched indicator's full data listed inside it (possibly an empty list)                                     |
| `cols.json` | An object keyed by indicator slug, each value a columns object (`{ "employment-rate": {...}, "claimant-count": {...} }`, possibly `{}`) |
| `rows.json` | Same keyed-by-slug shape, each value a list of row objects                                                                              |
| `csv`       | An `indicator` column (the indicator's display name) is included in every row                                                           |
| `csvw`      | Describes an `indicator` column rather than one indicator's own details                                                                 |
| `xlsx`      | One sheet per matched indicator (plus a table-of-contents and notes sheet), possibly no data sheets at all                              |

**`json`, one matched indicator** (`?indicator=employment-rate&geo=E07000148`) — still grouped:

```json
{
	"version": "2.0",
	"class": "collection",
	"label": "ONS Explore Local Statistics API response",
	"link": {
		"item": [
			{
				"class": "dataset",
				"...": "the full indicator data - same structure the single-indicator endpoint returns directly"
			}
		]
	}
}
```

**`cols.json`, two indicators** (`?indicator=employment-rate,claimant-count&geo=E07000148`):

```json
{
	"employment-rate": {
		"areacd": ["E07000148"],
		"areanm": ["Norwich"],
		"period": ["2023-01-01/P1Y"],
		"value": [82.7],
		"lci_95": [75],
		"uci_95": [90.4]
	},
	"claimant-count": {
		"areacd": ["E07000148"],
		"areanm": ["Norwich"],
		"period": ["2025-01-01/P1Y"],
		"value": [4]
	}
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

An empty result — whether because no indicator matched `topic`/`indicator`/`hasGeo` at all, or
because matched indicators' `geo`/`time`/`measure`/`dimension_*` filters left no observations —
is a valid `200`, not an error: an empty list of indicators (`link.item: []` for `json`, `{}` for
`cols.json`/`rows.json`, a header-only `csv`, no data sheets for `xlsx`). This endpoint never
returns the older `400 No data available for the selected filters.` message — that message is
specific to [the single-indicator endpoint](./data-item-endpoint.md#empty-results), where it means
something narrower. An actually malformed request (bad `hasGeo`, bad `time` shape, too broad a
request — see below) still `400`s exactly as before; only "valid filters, nothing left" changed.

## Requests that get rejected as too large

This check is specific to this endpoint — [the single-indicator endpoint](./data-item-endpoint.md)
never applies it at all, since a request for one named indicator can't be broad on the indicator
axis (see below).

A request is rejected with `400` (`Too much data requested. Try narrowing your parameters.`) if
**all three** of these are true at once — this is deliberate, not accidental; a request only
needs to be narrow on _one_ of the three axes to be allowed:

- **time** is broad: `time=all`, or a range/list of more than one period.
- **indicator selection** is broad: `indicator=all`, more than 20 comma-separated indicators, or
  more than one `topic`.
- **geo** is broad: no `geoExtent`/`geoCluster` narrowing it down, and `geo` includes `all`,
  `ltla` or `utla`.

`format=csvw` is exempt from this check entirely (it returns metadata only, not observation
data, regardless of how broad the filters are).

Plenty of individually-large requests are allowed through: `time=all` across every indicator for
one small area, or one broad `geo` group for a single time period, are both fine. If you're
building a client that needs to avoid `400`s on large pulls, narrow at least one axis —
`geoExtent` or `geoCluster` to make `geo` non-broad is usually the cheapest lever, since it
doesn't require giving up `time=all` or `indicator=all`.
