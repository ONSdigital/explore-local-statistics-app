# Geography: boundaries

```
GET /api/v1/geo/boundaries.{format}?{parameters}
```

Generalised (simplified) boundary polygons for a geography level, in GeoJSON or TopoJSON. Answers
immediately — this route doesn't look anything up externally.

## `{format}`

| Value      | Output                                                                          |
| ---------- | ------------------------------------------------------------------------------- |
| `geojson`  | A `FeatureCollection`, coordinates rounded to 4 decimal places (~11m precision) |
| `topojson` | The equivalent TopoJSON topology for just the requested `geoLevel`'s layer      |

Any other value is `404` (`Requested data format "<x>" not found. Only geojson, topojson
available.`).

## Parameters

| Parameter  | Default  | Description                                                              |
| ---------- | -------- | ------------------------------------------------------------------------ |
| `year`     | `latest` | Only include areas valid in this year, or `all`                          |
| `country`  | `all`    | Restrict to one or more single-letter country codes (`E`, `N`, `S`, `W`) |
| `geoLevel` | `ltla`   | Which layer to return                                                    |

`geoLevel`'s valid values here are specific to this route and don't match any other route's set
exactly — see [important-notes.md](./important-notes.md#geolevel-means-a-different-set-of-values-depending-on-the-route)
for the full comparison. The valid values here are:

```
cauth, ctry, cty, ltla, mcty, rgn, uk, utla
```

Note `mcty` (metropolitan county) and `uk` are valid **only** here — they don't appear in any
other route's set of geography levels. Conversely, boundaries are **not** available below `ltla`
— `wd`, `msoa`, `lsoa`, `oa`, `wpc`, `sener`, `senc` (all valid `geoLevel` values on the search/
reverse/postcode routes) have no boundary data and return `400` here (`Geography level "<x>" not
available.`).

## Examples

```
GET /api/v1/geo/boundaries.geojson?geoLevel=cauth
```

```json
{
	"type": "FeatureCollection",
	"features": [
		{
			"type": "Feature",
			"properties": { "areacd": "E47000006", "areanm": "Tees Valley" },
			"geometry": { "type": "MultiPolygon", "coordinates": ["..."] }
		}
	]
}
```

```
GET /api/v1/geo/boundaries.topojson?geoLevel=ltla&country=E
```

Returns a TopoJSON topology object (`{ type: "Topology", objects: { ltla: {...} }, arcs: [...] }`)
restricted to English areas only.

### The whole-file short-circuit

One exact parameter combination — `format=topojson&year=all&country=all&geoLevel=all` — bypasses
filtering entirely and returns every layer, year and country unfiltered in a single file. This is
the only place `geoLevel=all` is accepted; any other combination that includes `geoLevel=all`
(e.g. `format=geojson&geoLevel=all`, or adding a `country` filter) is `400`, since `all` isn't a
real layer name otherwise.
