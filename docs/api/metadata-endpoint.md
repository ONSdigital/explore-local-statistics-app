# Metadata

Indicator metadata and the topic taxonomy. All served from data bundled at build time — none of
these routes touch the network. See [Conventions](./README.md#conventions-read-this-first) first.

> Structural metadata for a specific _request_ (not a whole indicator) is also available from the
> data endpoint itself via `format=csvw` — see
> [data-formats.md](./data-formats.md#csvw--csv-on-the-web-metadata). Use that instead of this
> page's routes if what you actually need is "describe the CSV I just downloaded", not "describe
> this indicator in general".

## `GET /api/v1/metadata/indicators`

Metadata for indicators, filterable, as a list. Implementation: `getIndicators.ts`.

| Parameter             | Default | Description                                                                                                                                                                                              |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `indicator`           | `all`   | One or more indicator slugs                                                                                                                                                                              |
| `topic`               | `all`   | One or more topic/sub-topic codes                                                                                                                                                                        |
| `hasGeo`              | `any`   | Restrict to indicators covering a GSS code, level, or type — `any` (the default) means "no filter", same sentinel as [the data endpoint](./data-endpoint.md#hasgeo); `all` is not accepted (`400`)       |
| `hasYear`             | `all`   | Restrict to indicators covering a given year (`YYYY`)                                                                                                                                                    |
| `excludeMultivariate` | `false` | Drop every multivariate indicator unconditionally (no "unless named in `indicator`" exception — see [gotchas.md](./gotchas.md#excludemultivariate-means-two-different-things-depending-on-the-endpoint)) |
| `fullDims`            | `false` | Include each dimension's full `category` value list (expensive; see below)                                                                                                                               |
| `asLookup`            | `false` | Return `{ [slug]: {...} }` instead of an array                                                                                                                                                           |

```
GET /api/v1/metadata/indicators?topic=employment
```

```json
[
	{
		"label": "Economic inactivity rate (Great Britain)",
		"slug": "economic-inactivity-rate",
		"topic": "economy",
		"subTopic": "employment",
		"source": ["..."],
		"updated": "...",
		"isMultivariate": false,
		"hasTimeseries": true,
		"confidenceIntervals": true,
		"measure": "Percentage",
		"unit": "%",
		"geography": {
			"countries": ["E", "N", "S", "W"],
			"levels": ["ctry", "rgn", "cauth", "utla", "ltla"],
			"types": ["..."],
			"year": 2025,
			"initialLevel": "ltla"
		},
		"dimensions": {
			"areacd": { "id": "areacd", "label": "Area code", "order": 0 },
			"period": { "id": "period", "label": "Time period", "order": 1 },
			"measure": { "id": "measure", "label": "Measure", "order": 2 }
		}
	}
]
```

`dimensions.<key>` omits `category` (the full list of valid values for that dimension) unless
`fullDims=true` — with it, each dimension gets a `category: { index: {...}, label: {...} }` the
same shape [the dimensions route](#get-apiv1metadataindicatorsindicatordimensionsdimension) below
returns for one dimension at a time. For an indicator with many dimension values (e.g. every area
code it covers), `fullDims=true` on this list route multiplies that cost by every matched
indicator — prefer the single-indicator or single-dimension routes below if you only need one
indicator's or one dimension's values.

## `GET /api/v1/metadata/indicators/{indicator}`

Metadata for one indicator. Same parameters and `fullDims` behaviour as the list route above
(minus `indicator`, `asLookup`); returns a bare object, not wrapped in an array, and `404`s
(`Indicator "<x>" not found.`) rather than filtering to zero results.

```
GET /api/v1/metadata/indicators/employment-rate
```

```json
{
	"label": "Employment rate (Great Britain)",
	"slug": "employment-rate",
	"topic": "economy",
	"subTopic": "employment",
	"isMultivariate": false,
	"geography": {
		"countries": ["E", "N", "S", "W"],
		"levels": ["ctry", "rgn", "cauth", "utla", "ltla"],
		"types": [
			"E06",
			"E07",
			"E08",
			"E09",
			"E10",
			"E12",
			"E47",
			"E92",
			"K02",
			"K03",
			"K04",
			"N92",
			"S12",
			"S92",
			"W06",
			"W92"
		],
		"year": 2025,
		"initialLevel": "ltla"
	},
	"dimensions": {
		"areacd": { "id": "areacd", "label": "Area code", "order": 0 },
		"period": { "id": "period", "label": "Time period", "order": 1 },
		"measure": { "id": "measure", "label": "Measure", "order": 2 }
	}
}
```

`geography.types` here is this **indicator's own** coverage (which GSS type prefixes it actually
has data for) — a different, indicator-specific list from
[the fixed set `hasGeo` type-code matching checks against](./data-endpoint.md#hasgeo) globally;
don't confuse the two. `geography.levels`/`.types` together are the fastest way to check, before
making a data request, whether a given `hasGeo`/`geo` filter is even possible for this indicator.

## `GET /api/v1/metadata/indicators/{indicator}/dimensions/{dimension}`

Every valid value of one dimension of one indicator — **the** cheap, targeted way to discover
what values to pass as a `dimension_{code}=...` filter on
[the data endpoint](./data-endpoint.md#dimension_code), rather than pulling a whole indicator's
`fullDims=true` metadata just to read one dimension. No query parameters accepted (unknown ones
are silently ignored — see
[gotchas.md](./gotchas.md#routes-with-no-parameter-validation)); always includes `category`
regardless (there's no `fullDims` toggle here — see
[gotchas.md](./gotchas.md#fulldims-asymmetry-between-the-two-dimension-metadata-routes)).

```
GET /api/v1/metadata/indicators/employment-rate/dimensions/period
```

```json
{
	"id": "period",
	"label": "Time period",
	"category": {
		"index": { "2004-01-01/P1Y": 0, "2005-01-01/P1Y": 1, "...": "...", "2023-01-01/P1Y": 19 }
	}
}
```

`{indicator}` not found: `404` (`Indicator code "<x>" not found.`). `{dimension}` not a real
dimension of that indicator: `404` (`Dimension code "<x>" not found.`).

## `GET /api/v1/metadata/taxonomy`

The topic → sub-topic → indicator hierarchy that drives the app's own navigation. Implementation:
`getTaxonomy.ts` (built from the same underlying indicator metadata as
`/metadata/indicators?minimalMetadata` internally).

| Parameter             | Default | Description                                                                         |
| --------------------- | ------- | ----------------------------------------------------------------------------------- |
| `topic`               | `all`   | Restrict to a topic/sub-topic                                                       |
| `hasGeo`              | `any`   | Same semantics as [`/metadata/indicators`'s `hasGeo`](#get-apiv1metadataindicators) |
| `hasYear`             | `all`   | Restrict to indicators covering a given year                                        |
| `excludeMultivariate` | `false` | Same "unconditional drop" semantics as `/metadata/indicators`                       |
| `flat`                | `false` | Return a flat list instead of nesting by topic                                      |

```
GET /api/v1/metadata/taxonomy
```

```json
{
	"meta": { "count": 110, "total": 110 },
	"data": [
		{
			"label": "Population",
			"slug": "population",
			"children": [
				{
					"label": "Total population",
					"slug": "population-count",
					"description": "Mid-year estimate of the total number of people",
					"index": 0
				},
				{
					"label": "Population by age and sex",
					"slug": "population-by-age-and-sex",
					"description": "Percentage of the total population by sex and five-year age band",
					"index": 1
				}
			]
		}
	]
}
```

Nested (the default): each top-level entry is a topic, with either indicators directly under
`children` (where topic and sub-topic are the same) or an intermediate sub-topic layer. `index`
on a leaf indicator is its position within its immediate parent (topic or sub-topic), not a
global index.

With `flat=true`, `data` is instead a flat array of indicators (the same minimal fields —
`label`, `slug`, `topic`, `subTopic`, `description` — each with explicit `topic`/`subTopic`
fields since there's no nesting to imply them):

```
GET /api/v1/metadata/taxonomy?flat=true
```

```json
{
	"meta": { "count": 110, "total": 110 },
	"data": [
		{
			"label": "Total population",
			"slug": "population-count",
			"topic": "population",
			"subTopic": "population",
			"description": "Mid-year estimate of the total number of people"
		}
	]
}
```

`meta.count` is the number matched by your filters; `meta.total` is the total across the whole
taxonomy regardless of filters — the same distinction pagination `meta.total` carries elsewhere
in this API, repurposed here for "how filtered is this" rather than "how many pages are there".
