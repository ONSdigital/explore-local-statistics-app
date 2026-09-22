# Geography: search & coordinates

Finding an area by name, by coordinate, or by postcode. See
[Conventions](./README.md#conventions-read-this-first) first.

All three of these routes look up data from an external source at request time (postcode/
coordinate lookups need data that isn't loaded into the service ahead of time) — see
[Conventions](./README.md#external-data-endpoints-different-failure-mode) for what that means for
failure modes. Name search (`/geo/search/{name}`) is the exception — it answers immediately, with
an optional fallback to postcode search (which _does_ look up externally) if nothing matches by
name.

All three share the same response shape: `{ meta: {...}, data: [...] }`. On the three routes
that accept `groupByLevel` (`/geo/search`, `/geo/reverse`, `/geo/postcodes/{code}`), setting it to
`true` changes what `data` contains — from a flat list of area objects to a list of
`{ key, label, areas: [...] }` groups, one per level represented in the results (`meta` is
unaffected either way).

## `GET /api/v1/geo/search/{name}`

Search areas by name (word-boundary match, so `norwich` matches "Norwich" but also "Norwich
North"/"Norwich South").

| Parameter         | Default  | Description                                                                                                                                                                                        |
| ----------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `year`            | `latest` | Only match areas valid in this year, or `all`                                                                                                                                                      |
| `limit`           | `10`     | Max results                                                                                                                                                                                        |
| `offset`          | `0`      | Pagination offset                                                                                                                                                                                  |
| `searchPostcodes` | `false`  | If the name search returns zero results, fall back to postcode search using the same string                                                                                                        |
| `groupByLevel`    | `false`  | Group results as `[{ key, label, areas: [...] }]` instead of a flat list                                                                                                                           |
| `geoLevel`        | `all`    | Restrict to one geography level — a wider set of levels than most other routes use; see [important-notes.md](./important-notes.md#geolevel-means-a-different-set-of-values-depending-on-the-route) |

```
GET /api/v1/geo/search/norwich
```

```json
{
	"meta": { "query": "norwich", "count": 3, "total": 3, "limit": 10, "offset": 0 },
	"data": [
		{ "areacd": "E07000148", "areanm": "Norwich", "type": "Lower tier/unitary authority" },
		{ "areacd": "E14001408", "areanm": "Norwich North", "type": "Parliamentary constituency" },
		{ "areacd": "E14001409", "areanm": "Norwich South", "type": "Parliamentary constituency" }
	]
}
```

A query string containing digits skips name matching entirely (returns zero name matches — this
is deliberate, since a digit-containing query is assumed to be a postcode-shaped one), which is
exactly the case `searchPostcodes=true` exists to handle: send a query that might be a name _or_
a postcode, and let this route fall back automatically instead of trying both yourself.

## `GET /api/v1/geo/reverse`

Every area (at every level) containing a given coordinate. Results **are** explicitly sorted,
largest to smallest — this is a deliberate ordering, not an incidental artefact of the underlying
map data.

| Parameter      | Default      | Description                                                  |
| -------------- | ------------ | ------------------------------------------------------------ |
| `lng`          | _(required)_ | Longitude, `-180` to `180`                                   |
| `lat`          | _(required)_ | Latitude, `-90` to `90`                                      |
| `year`         | `latest`     | Filter to areas valid in this year, or `all`                 |
| `geoLevel`     | `all`        | Restrict to one geography level (same wider set noted above) |
| `groupByLevel` | `false`      | Group results as `[{ key, label, areas: [...] }]`            |

```
GET /api/v1/geo/reverse?lng=1.29384&lat=52.62813
```

```json
{
	"meta": { "lng": 1.29384, "lat": 52.62813, "count": 9, "total": 9 },
	"data": [
		{ "areacd": "E92000001", "areanm": "England", "type": "Country" },
		{ "areacd": "E12000006", "areanm": "East of England", "type": "Region" },
		{ "areacd": "E10000020", "areanm": "Norfolk", "type": "County" },
		{ "areacd": "E07000148", "areanm": "Norwich", "type": "Lower tier/unitary authority" },
		{ "areacd": "E14001409", "areanm": "Norwich South", "type": "Parliamentary constituency" },
		{ "areacd": "E05012906", "areanm": "Mancroft", "type": "Electoral ward", "parent": "Norwich" },
		{
			"areacd": "E02007053",
			"areanm": "Norwich 017",
			"type": "Middle-layer super output area",
			"parent": "Norwich"
		},
		{
			"areacd": "E01026823",
			"areanm": "Norwich 017A",
			"type": "Lower-layer super output area",
			"parent": "Norwich"
		},
		{ "areacd": "...", "type": "Output area", "parent": "Norwich" }
	]
}
```

Small-area entries (ward, MSOA, LSOA, OA) get a `parent` field (the containing local authority's
name); larger areas don't. Coordinates out of range are `400`
(`Invalid lng/lat coordinates.`); coordinates that don't resolve to any known area (e.g. out in
the sea, or the lookup failing) come back as `400`
(`No areas found. Requested coordinates out of range.`) — the same message whether the point is
genuinely out of range or the lookup failed, so don't rely on this message to distinguish
the two causes.

## `GET /api/v1/geo/postcodes/{code}`

Full postcode → area lookup (every area, at every level, containing that postcode's location —
same underlying mechanism as `/geo/reverse`, plus postcode-specific metadata). `{code}` can be
given with or without the internal space (`NR21AA` and `NR2 1AA` both work).

| Parameter      | Default  | Description                                                  |
| -------------- | -------- | ------------------------------------------------------------ |
| `year`         | `latest` | Filter areas by year, or `all`                               |
| `geoLevel`     | `all`    | Restrict to one geography level (same wider set noted above) |
| `groupByLevel` | `false`  | Group results as `[{ key, label, areas: [...] }]`            |

```
GET /api/v1/geo/postcodes/NR21AA
```

```json
{
	"meta": {
		"query": "NR21AA",
		"areacd": "NR2 1AA",
		"lng": 1.293569,
		"lat": 52.627547,
		"count": 9,
		"total": 9
	},
	"data": [{ "areacd": "E92000001", "areanm": "England", "type": "Country" }, "..."]
}
```

`meta` carries the resolved, canonically-spaced postcode (`areacd`) and its coordinates alongside
the usual `count`/`total`. A malformed postcode is `404`
(`"Postcode not found. <x>" is not a valid postcode."` — note the unusual quote placement, a
real artefact of the underlying error message, not a formatting error in this doc); a
well-formed one that isn't recognised is also `404` but with `Postcode "<x>" not found.` instead.

## `GET /api/v1/geo/postcodes/{code}/autocomplete`

Partial-postcode matching for a type-ahead search box — `{code}` can be as short as an
outward-code prefix (e.g. `NR2`).

| Parameter | Default | Description       |
| --------- | ------- | ----------------- |
| `limit`   | `10`    | Max results       |
| `offset`  | `0`     | Pagination offset |

```
GET /api/v1/geo/postcodes/NR2/autocomplete
```

```json
{
	"meta": { "query": "NR2", "count": 10, "total": null, "limit": 10, "offset": 0 },
	"data": [
		{ "areacd": "NR2 1AA", "type": "postcode", "lng": 1.293569, "lat": 52.627547 },
		{ "areacd": "NR2 1AB", "type": "postcode", "lng": 1.285996, "lat": 52.629448 }
	]
}
```

`meta.total` is deliberately `null` (not omitted, not `0`) for a short query — 3 characters or
fewer once non-letters/digits are stripped (e.g. `NR2`, an outward-code-only query) — likely
because a 3-character prefix can match many hundreds of postcodes and the count isn't considered
meaningful for a type-ahead search box at that width. Don't treat `null` as zero or as an error —
`data` and `meta.count` (the count of items actually returned, always accurate) are unaffected. A
query too short/malformed to be even a partial postcode is `400`.
