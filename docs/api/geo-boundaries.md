# Geography: boundaries

```
GET /api/v1/geo/boundaries.{format}?{parameters}
```

Generalised (simplified) boundary polygons for a geography level, in GeoJSON or TopoJSON.
Implementation: `getBoundaries.ts`, reading a single bundled `topo.json` file at startup — this
route never touches the network.

## `{format}`

| Value | Output |
|---|---|
| `geojson` | A `FeatureCollection`, coordinates rounded to 4 decimal places (~11m precision) |
| `topojson` | The equivalent TopoJSON topology for just the requested `geoLevel`'s layer |

Any other value is `404` (`Requested data format "<x>" not found. Only geojson, topojson
available.`).

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `year` | `latest` | Only include areas valid in this year, or `all` |
| `country` | `all` | Restrict to one or more single-letter country codes (`E`, `N`, `S`, `W`) |
| `geoLevel` | `ltla` | Which layer to return |

`geoLevel` is resolved directly against the bundled boundary file's own layers, **not** against
any of the three `geoLevels`/`geoLevelsAll`/`geoLevelsNav` sets used elsewhere in the API — see
[gotchas.md](./gotchas.md#geolevel-means-a-different-set-of-keys-depending-on-the-route) for the
full comparison. The valid values here are:

```
cauth, ctry, cty, ltla, mcty, rgn, uk, utla
```

Note `mcty` (metropolitan county) and `uk` are valid **only** here — they don't appear in any
other route's level set. Conversely, boundaries are **not** available below `ltla` — `wd`,
`msoa`, `lsoa`, `oa`, `wpc`, `sener`, `senc` (all valid `geoLevel` values on the search/reverse/
postcode routes) have no boundary data and return `400` here
(`Geography level "<x>" not available.`).

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
filtering entirely and streams the bundled `topo.json` file back unmodified (every layer, every
year, every country, as originally built). This is the only place `geoLevel=all` is accepted; any
other combination that includes `geoLevel=all` (e.g. `format=geojson&geoLevel=all`, or adding a
`country` filter) is `400`, since `all` isn't a real layer name in the boundary file.
