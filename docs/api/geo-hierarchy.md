# Geography: hierarchy & lookup

Areas, geography levels, and parent/child/sibling relationships between them. See
[Conventions](./README.md#conventions-read-this-first) first, and
[gotchas.md](./gotchas.md#geolevel-means-a-different-set-of-keys-depending-on-the-route) for the
`geoLevel` key-set table these routes are referenced in.

GSS codes are case-insensitive throughout this API, including on this page's routes.

## `GET /api/v1/geo/list`

Flat list of areas, filterable. Implementation: `getAreasList.ts`.

| Parameter         | Default  | Description                                       |
| ----------------- | -------- | ------------------------------------------------- |
| `geo`             | `all`    | Level key (5-key set) or GSS code(s)              |
| `geoExtent`       | `all`    | Restrict to descendants of this parent GSS code   |
| `year`            | `latest` | Filter to areas valid in a given year, or `all`   |
| `indicator`       | `all`    | Restrict to areas covered by a specific indicator |
| `asLookup`        | `false`  | Return `{ [areacd]: {...} }` instead of an array  |
| `groupByLevel`    | `false`  | Group results as `[{ key, label, areas: [...] }]` |
| `includeParents`  | `false`  | Include each area's parent GSS codes              |
| `includeChildren` | `false`  | Include each area's child GSS codes               |
| `includeDates`    | `false`  | Include `start`/`end` validity years              |
| `includeLevel`    | `false`  | Include the area's level key(s)                   |

```
GET /api/v1/geo/list?geo=cauth&includeLevel=true
```

```json
[
	{ "areacd": "E47000001", "areanm": "Greater Manchester", "level": ["cauth"] },
	{ "areacd": "E47000002", "areanm": "South Yorkshire", "level": ["cauth"] }
]
```

Bare array (or `{ [areacd]: {...} }` with `asLookup=true`, or the grouped shape with
`groupByLevel=true`).

## `GET /api/v1/geo/levels`

The geography levels/groups the app itself uses (the 5-key `geoLevels` set — see
[gotchas.md](./gotchas.md#geolevel-means-a-different-set-of-keys-depending-on-the-route)), with
their GSS type-code prefixes and, optionally, member areas. Implementation: `getGeoLevels.ts`.

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
children (grouped by level, in the app's internal navigation grouping — 13-key `geoLevelsNav`,
not the 5-key set — with combined-authority/upper-tier/lower-tier levels merged into one
`cauth` group for navigation purposes). Implementation: `getAreaByCode.ts`. **Fetches from an
external CDN at request time** — see
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

A bare code that doesn't match GSS shape (`^[EKNSW]\d{8}$`) is `404` (`Area not found. "<x>" is
not a valid GSS code.`); a well-formed code the upstream metadata store doesn't recognise is also
`404` but with a different message (`Area not found. Could not retreive metadata for "<x>".` —
note the source typo, "retreive").

### The `related`/`parents`/`children`/`siblings` family only covers the 5-level statistical hierarchy

All four routes below (and `/geo/related/{code}` itself) read from the same bundled
`geo-metadata.json`, which only encodes the app's 5-level statistical hierarchy — `ctry` → `rgn`
→ `cauth`/`utla` → `ltla` — the same 5-key `geoLevels` set used by
[the data endpoint's `geo`/`hasGeo`](./data-endpoint.md#geo--geoextent--geocluster). It stops at
`ltla`: an LTLA like Norwich (`E07000148`) genuinely has **no children** in this system (an empty
array, not an error) — verified:

```
GET /api/v1/geo/related/E07000148/children   → []
GET /api/v1/geo/related/E10000020/children   → 7 LTLAs (Norfolk's own children)
```

This is a different, smaller hierarchy than
[`/geo/lookup/{code}`](#get-apiv1geolookupcode), which drills all the way down to ward/MSOA/LSOA/
OA via a separate, richer external data source. If you need Norwich's wards, use
`/geo/lookup/E07000148`, not `/geo/related/E07000148/children` — the latter will not error, it
will just come back empty.

## `GET /api/v1/geo/related/{code}`

All four relationship types for one area in a single call — equivalent to calling the four
sub-routes below and combining the results under matching keys. Implementation:
`getRelatedAreas.ts`.

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

Each key has exactly the shape documented for its own sub-route below — see
[gotchas.md](./gotchas.md#top-level-response-envelopes-vary-route-to-route) for how those differ
from each other (in particular, `siblings` can come back as an empty `{}`).

### `GET /api/v1/geo/related/{code}/parents`

Bare array, outermost (country/UK) first.

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

| Parameter      | Default             | Description                                                                                                                                   |
| -------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `geoLevel`     | (none — all levels) | Restrict to one level, **5-key `geoLevels` set only**. An invalid value here is silently ignored (returns unfiltered children), not an error. |
| `includeNames` | `true`              | Include `areanm`                                                                                                                              |

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

Bare array of GSS codes (`includeNames=false`), or `{ areacd, areanm }` objects
(`includeNames=true`, the default). Empty for any area with nothing below it in the 5-level
hierarchy — see [above](#the-relatedparentschildrensiblings-family-only-covers-the-5-level-statistical-hierarchy).

### `GET /api/v1/geo/related/{code}/siblings`

| Parameter      | Default                       | Description                                                                                                                                                               |
| -------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parentLevel`  | (the area's immediate parent) | Look for siblings under a _wider_ parent level instead — **5-key `geoLevels` set**; an unrecognised value is `404`, not silently ignored (unlike `children`'s `geoLevel`) |
| `includeNames` | `true`                        | Include `areanm`                                                                                                                                                          |

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
app's clustering data — see [data-endpoint.md](./data-endpoint.md#discovering-geocluster-values)
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
for that comparison type — absent otherwise, not `null`. Note `cluster.key` is lowercase (as
stored) while `cluster.label` is the same value upper-cased for display — don't assume they're
interchangeable if you're matching on `key` elsewhere.
