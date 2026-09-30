# Geography: hierarchy & lookup

Areas, geography levels, and parent/child/sibling relationships between them. See
[Conventions](./README.md#conventions-read-this-first) first, and
[important-notes.md](./important-notes.md#geolevel-means-a-different-set-of-values-depending-on-the-route) for a
table of which geography levels are valid on which route.

GSS codes are case-insensitive throughout this API, including on this page's routes.

## `GET /api/v1/geo/list`

Flat list of areas, filterable.

| Parameter         | Default  | Description                                       |
| ----------------- | -------- | ------------------------------------------------- |
| `geo`             | `all`    | A geography level, or GSS code(s)                 |
| `geoExtent`       | `all`    | Restrict to descendants of this parent GSS code   |
| `year`            | `latest` | Filter to areas valid in a given year, or `all`   |
| `indicator`       | `all`    | Restrict to areas covered by a specific indicator |
| `asLookup`        | `false`  | Return `{ [areacd]: {...} }` instead of a list    |
| `groupByLevel`    | `false`  | Group results as `[{ key, label, areas: [...] }]` |
| `includeParents`  | `false`  | Include each area's parent GSS codes              |
| `includeChildren` | `false`  | Include each area's child GSS codes               |
| `includeDates`    | `false`  | Include `start`/`end` validity years              |
| `includeLevel`    | `false`  | Include the area's level key(s)                   |

`geo` accepts one of five geography levels — `ctry` (country), `rgn` (region), `cauth` (combined
authority), `utla` (upper tier/unitary authority) or `ltla` (lower tier/unitary authority) — or
one or more GSS codes.

```
GET /api/v1/geo/list?geo=cauth&includeLevel=true
```

```json
[
	{ "areacd": "E47000001", "areanm": "Greater Manchester", "level": ["cauth"] },
	{ "areacd": "E47000002", "areanm": "South Yorkshire", "level": ["cauth"] }
]
```

A plain list (or `{ [areacd]: {...} }` with `asLookup=true`, or the grouped shape with
`groupByLevel=true`).

## `GET /api/v1/geo/levels`

The five geography levels the service uses (country, region, combined authority, upper-tier and
lower-tier authority — see [`geo/list`](#get-apiv1geolist) above), with their GSS type-code
prefixes and, optionally, member areas.

| Parameter      | Default  | Description                                                                   |
| -------------- | -------- | ----------------------------------------------------------------------------- |
| `year`         | `latest` | Only relevant with `includeAreas=true`; filter member areas by year, or `all` |
| `includeAreas` | `true`   | Include each level's member area codes                                        |

```
GET /api/v1/geo/levels
```

```json
[
	{
		"key": "ctry",
		"label": "Country",
		"codes": ["K02", "E92", "N92", "S92", "W92"],
		"areas": ["K02000001", "E92000001", "N92000002", "S92000003", "W92000004"]
	},
	{
		"key": "rgn",
		"label": "Region/country",
		"codes": ["N92", "S92", "W92", "E12"],
		"areas": ["N92000002", "..."]
	},
	{ "key": "cauth", "...": "..." },
	{ "key": "utla", "...": "..." },
	{ "key": "ltla", "...": "..." }
]
```

`codes` is the level's GSS type-code prefixes (what `hasGeo`'s type-code matching, described in
[data-endpoint.md](./data-endpoint.md#hasgeo), checks against); `areas` (when `includeAreas` is
true, the default) is every actual GSS code at that level.

## `GET /api/v1/geo/lookup/{code}`

Full metadata for one area: name, bounding box, centroid, parent type/group codes, and its
children (grouped by level — a much finer-grained set of levels than the five above, going all
the way down to electoral wards, middle- and lower-layer super output areas, and output areas).
**Fetches from an external source at request time** — see
[Conventions](./README.md#external-data-endpoints-different-failure-mode). No query parameters
accepted (any are rejected with `400`).

```
GET /api/v1/geo/lookup/E07000148
```

```json
{
	"type": "Feature",
	"properties": {
		"areacd": "E07000148",
		"areanm": "Norwich",
		"bounds": [1.20389, 52.595184, 1.342244, 52.684935],
		"centroid": [1.264756, 52.628057],
		"groupcd": "ltla",
		"groupnm": "local authority district",
		"typecd": "E07",
		"typenm": "non-metropolitan district",
		"children": [
			{
				"key": "wd",
				"label": "Electoral ward",
				"areas": [{ "areacd": "E05012901", "areanm": "Bowthorpe" }, "..."]
			},
			{
				"key": "msoa",
				"label": "Middle-layer super output area",
				"areas": [
					{ "areacd": "E02005588", "areanm": "Norwich 005", "hclnm": "Bowthorpe & West Earlham" },
					"..."
				]
			}
		]
	}
}
```

A code that doesn't look like a GSS code (letter followed by 8 digits) is `404` (`Area not found.
"<x>" is not a valid GSS code.`); a well-formed code that isn't recognised is also `404` but with
a different message (`Area not found. Could not retreive metadata for "<x>".` — note the typo,
"retreive", which is a real artefact of the underlying error message, not a mistake in this doc).

### The related-areas family only covers five geography levels

`/geo/related/{code}` and its `parents`/`children`/`siblings` sub-routes only work with the same
five geography levels described under [`geo/list`](#get-apiv1geolist) above — country, region,
combined authority, upper-tier and lower-tier authority. They stop at lower-tier authority: a
lower-tier authority like Norwich (`E07000148`) genuinely has **no children** in this system (an
empty list, not an error) — verified:

```
GET /api/v1/geo/related/E07000148/children   → []
GET /api/v1/geo/related/E10000020/children   → 7 lower-tier authorities (Norfolk's own children)
```

This is a different, coarser hierarchy than [`/geo/lookup/{code}`](#get-apiv1geolookupcode),
which drills all the way down to wards, middle- and lower-layer super output areas, and output
areas, via a separate, richer data source. If you need Norwich's wards, use
`/geo/lookup/E07000148`, not `/geo/related/E07000148/children` — the latter will not error, it
will just come back empty.

## `GET /api/v1/geo/related/{code}`

All four relationship types for one area in a single call — equivalent to calling the four
sub-routes below and combining the results under matching keys.

| Parameter      | Default | Description                                    |
| -------------- | ------- | ---------------------------------------------- |
| `includeNames` | `true`  | Include `areanm` alongside `areacd` throughout |

```
GET /api/v1/geo/related/E07000148
```

```json
{
	"parents": [{ "areacd": "E10000020", "areanm": "Norfolk" }, "..."],
	"children": [{ "key": "wd", "label": "Electoral ward", "areas": ["..."] }, "..."],
	"siblings": { "parent": { "areacd": "E10000020", "areanm": "Norfolk" }, "siblings": ["..."] },
	"similar": [{ "key": "global", "label": "All indicators", "similar": ["..."] }, "..."]
}
```

Each key has exactly the response documented for its own sub-route below — see
[important-notes.md](./important-notes.md#top-level-response-shapes-vary-route-to-route) for how those differ
from each other (in particular, `siblings` can come back as an empty `{}`).

### `GET /api/v1/geo/related/{code}/parents`

A plain list, outermost (country/UK) first.

```
GET /api/v1/geo/related/E07000148/parents
```

```json
[
	{ "areacd": "E10000020", "areanm": "Norfolk" },
	{ "areacd": "E12000006", "areanm": "East of England" },
	{ "areacd": "E92000001", "areanm": "England" },
	{ "areacd": "K02000001", "areanm": "United Kingdom" }
]
```

### `GET /api/v1/geo/related/{code}/children`

| Parameter      | Default             | Description                                                                                                                          |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `geoLevel`     | (none — all levels) | Restrict to one of the five geography levels. An invalid value here is silently ignored (returns unfiltered children), not an error. |
| `includeNames` | `true`              | Include `areanm`                                                                                                                     |

```
GET /api/v1/geo/related/E10000020/children
```

```json
[
	{ "areacd": "E07000143", "areanm": "Breckland" },
	{ "areacd": "E07000144", "areanm": "Broadland" },
	{ "areacd": "E07000148", "areanm": "Norwich" },
	{ "...": "..." }
]
```

A plain list of GSS codes (`includeNames=false`), or `{ areacd, areanm }` objects
(`includeNames=true`, the default). Empty for any area with nothing below it in the five-level
hierarchy — see [above](#the-related-areas-family-only-covers-five-geography-levels).

### `GET /api/v1/geo/related/{code}/siblings`

| Parameter      | Default                       | Description                                                                                                                                                                     |
| -------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parentLevel`  | (the area's immediate parent) | Look for siblings under a _wider_ parent level instead, one of the five geography levels; an unrecognised value is `404`, not silently ignored (unlike `children`'s `geoLevel`) |
| `includeNames` | `true`                        | Include `areanm`                                                                                                                                                                |

```
GET /api/v1/geo/related/E07000148/siblings
```

```json
{
	"parent": { "areacd": "E10000020", "areanm": "Norfolk" },
	"siblings": [{ "areacd": "E07000143", "areanm": "Breckland" }, "..."]
}
```

Returns a bare `{}` (not `{ parent: null, siblings: [] }`) if the area has no parent at the
resolved level — e.g. requesting siblings of the UK itself
(`/api/v1/geo/related/K02000001/siblings`). Guard for the missing keys before accessing them.

### `GET /api/v1/geo/related/{code}/similar`

Statistically similar areas, grouped by comparison type (`global`, and others derived from the
service's clustering data — see [data-endpoint.md](./data-endpoint.md#discovering-geocluster-values)
for the cluster-grouping names this draws on). No query parameters beyond `includeNames`
(default `true`).

```
GET /api/v1/geo/related/E07000148/similar
```

```json
[
	{
		"key": "global",
		"label": "All indicators",
		"similar": [{ "areacd": "E07000062", "areanm": "Hastings" }, "..."],
		"cluster": {
			"key": "b",
			"label": "B",
			"areas": [{ "areacd": "E06000001", "areanm": "Hartlepool" }, "..."],
			"description": "Local authorities in this cluster have a high percentage of children in relative poverty and high level of gigabit capable broadband availability. ..."
		}
	}
]
```

`cluster` (the named group this area itself belongs to, with its full membership and a
human-readable `description`) is only present where the area has a resolved cluster assignment
for that comparison type — absent otherwise, not `null`. Note `cluster.key` is lowercase while
`cluster.label` is the same value upper-cased for display — don't assume they're interchangeable
if you're matching on `key` elsewhere.
