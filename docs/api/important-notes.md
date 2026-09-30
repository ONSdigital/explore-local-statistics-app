# Important notes for API consumers

Everything on this page was found by testing against the live API on 2026-09-11 — nothing here
is speculative. If you're writing a generic client against this API (including generating one,
e.g. an MCP tool layer from the endpoint list), this is the page most likely to save you from a
mistake that only shows up on some parameter combinations.

## The two data endpoints, and what they replaced

[`/api/v1/data.{format}`](./data-endpoint.md) (data for multiple indicators) and
[`/api/v1/data/{indicator}.{format}`](./data-item-endpoint.md) (data for a single indicator) used
to be one endpoint, with the response structure decided at request time by a narrow, easy-to-get-
wrong rule (roughly: "no topic filter, and the indicator filter happens to match exactly one
indicator"). That meant a topic-filtered request that happened to match one indicator got a
different response structure than the same result reached by naming that one indicator directly —
a real source of confusion for a generic client, since the structure depended on how many
indicators happened to match rather than anything visible in the request itself. The two endpoints
now make that a fixed, predictable property instead: `/api/v1/data.{format}` always groups its
response by indicator, no matter how many match (zero, one, or many), and
`/api/v1/data/{indicator}.{format}` always returns one named indicator's data directly, with no
grouping. If you're migrating a client built against the old single endpoint: a request that used
to rely on "exactly one indicator matched" now needs to name that indicator in the URL instead —
continuing to request a single indicator via `/api/v1/data.{format}?indicator=...` now always
returns the grouped response (a one-item group) instead.

## `geoLevel` means a different set of values depending on the route

There is no single canonical list of "geography levels" across this API — three different,
**non-overlapping** sets of valid values exist, and which one a given `geoLevel`/`geo`/`hasGeo`/
`parentLevel` parameter accepts depends entirely on which route you're calling. This is a real,
deliberate distinction rather than an oversight: a small set of five levels (country, region,
combined authority, upper-tier authority, lower-tier authority) is the **statistical geography**
the service aggregates indicator data by (the data endpoints, `/geo/list`, and `/geo/related`'s
`children`/`siblings`) — it stops at lower-tier authority because that's the finest level any
indicator is actually published at. A much wider set (14 levels, going down to electoral ward,
middle- and lower-layer super output area, and output area) instead serves **area-to-area
navigation and lookup** — finding what a postcode or coordinate resolves to, or searching by
name — which has no reason to stop at lower-tier authority and legitimately needs that finer
granularity, which no indicator data uses. Unifying the two would mean either losing that
navigation-level granularity or pretending indicator data exists where it doesn't, so they're kept
genuinely separate.

| Set                             | Levels                                                                                                                                                               | Used by                                                                                                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The 5-level statistical set     | country, region, combined authority, upper-tier authority, lower-tier authority (`ctry`, `rgn`, `cauth`, `utla`, `ltla`)                                             | `geo` and `hasGeo` on the data endpoints; `geo` on `/geo/list`; `geoLevel` on `/geo/related/{code}/children`; `parentLevel` on `/geo/related/{code}/siblings` |
| The 14-level navigation set     | the five above plus county, ward, parliamentary constituency, Senedd region/constituency, parish, MSOA, LSOA, output area (has county, **not** upper-tier authority) | `geoLevel` on `/geo/search/{name}`, `/geo/reverse`, `/geo/postcodes/{code}`                                                                                   |
| The boundary map's own 8 levels | country, region, county, combined authority, upper- and lower-tier authority, metropolitan county, UK                                                                | `geoLevel` on `/geo/boundaries.{format}` — resolved directly against the boundary map data, independent of the other two sets                                 |

Concretely: a county-level `geoLevel` is valid on `/geo/search` but not on
`/geo/related/{code}/children`; the metropolitan-county and UK-wide levels are valid **only** on
`/geo/boundaries`, matching neither of the other two sets; and ward/MSOA/LSOA/output-area levels
— all valid `geoLevel` values elsewhere — have no boundary map data at all (`/geo/boundaries`
only goes down to lower-tier authority).

**Invalid-value behaviour also differs by route**, which is easy to miss because none of them
give you the same signal:

| Route                                                  | Invalid `geoLevel`/level param                        |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `/geo/related/{code}/children`                         | Silently ignored — returns _all_ children, unfiltered |
| `/geo/related/{code}/siblings` (`parentLevel`)         | `404`                                                 |
| `/geo/search`, `/geo/reverse`, `/geo/postcodes/{code}` | No match → empty result set, not an error             |
| `/geo/boundaries.{format}`                             | `400`                                                 |

`geoLevel=all` on `/geo/boundaries` is valid in exactly one exact combination —
`format=topojson&year=all&country=all&geoLevel=all` (a short-circuit that returns every layer
unfiltered) — and `400`s in every other combination that includes it.

## Top-level response shapes vary route to route

There's no single response shape across the API — check each route's actual response rather than
assuming `{ data: [...] }` or a plain list everywhere:

| Route                                                                             | Shape                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/geo/search/{name}`, `/geo/reverse`, `/geo/postcodes/{code}`, `.../autocomplete` | `{ meta: {...}, data: [...] }`                                                                                                                                                                                                                                        |
| `/geo/list`, `/geo/levels`, `/geo/related/{code}/parents`, `.../similar`          | Plain list                                                                                                                                                                                                                                                            |
| `/geo/related/{code}/children`                                                    | Plain list only (no `groupByLevel` option on this route); empty for any area below lower-tier authority in the five-level statistical hierarchy, not an error — see [geo-hierarchy.md](./geo-hierarchy.md#the-related-areas-family-only-covers-five-geography-levels) |
| `/geo/related/{code}`                                                             | `{ parents, children, siblings, similar }` — each sub-value in the shape its own dedicated endpoint returns                                                                                                                                                           |
| `/geo/related/{code}/siblings`                                                    | `{ parent: {...}, siblings: [...] }` — **or a bare empty object `{}`** if the area has no parent at that level (e.g. `/geo/related/K02000001/siblings`, the UK itself). Code doing `res.siblings.map(...)` will throw on that input; check for the key first.         |
| `/metadata/taxonomy`                                                              | `{ meta: {...}, data: [...] }` (nested by topic unless `flat=true`)                                                                                                                                                                                                   |
| `/metadata/indicators` (list)                                                     | Plain list, or `{ [slug]: {...} }` if `asLookup=true`                                                                                                                                                                                                                 |
| `/metadata/indicators/{indicator}` (single)                                       | A single object                                                                                                                                                                                                                                                       |
| `/api/v1/data.{format}` (multiple indicators)                                     | Always grouped by indicator — see [its "what you get back" table](./data-endpoint.md#what-you-get-back)                                                                                                                                                               |
| `/api/v1/data/{indicator}.{format}` (single indicator)                            | Always returned directly, no grouping — see [its "what you get back" table](./data-item-endpoint.md#what-you-get-back)                                                                                                                                                |

## Value parsing surprises

Every query parameter is parsed the same way, regardless of which endpoint or parameter it is —
there's no per-parameter type declaration, so these apply uniformly:

- **Boolean settings only turn on for the exact word `true`.** `?excludeMultivariate=1` parses to
  the _number_ `1`, and code checking for `true` treats anything else as "off". Verified:
  `?excludeMultivariate=true&topic=population` on `/metadata/indicators` returns 7 indicators
  (the multivariate one excluded); `?excludeMultivariate=1` with the same `topic` returns 8 (it's
  still there). Always send the literal word `true`, never `1`, `yes`, or a bare presence flag.
- **A one-item comma list and a single value are handled the same way** by this API's filters, but
  if you're inspecting your own request parameters before sending them, don't assume a single
  value always arrives as a plain string rather than a one-item list.
- **Number-looking text becomes a number.** A GSS code never looks like this, but a
  `dimension_{code}=2024` filter value would be treated as the number `2024`, not the text
  `"2024"` — usually harmless since matching against it still works either way, but worth knowing
  if you're constructing the raw query string yourself.

## `fullDims` asymmetry between the two dimension-metadata routes

`GET /metadata/indicators/{indicator}` omits each dimension's `category` (its full value list)
unless you pass `fullDims=true` — it's expensive to include (every dimension, every value) for a
route that's often called just for descriptive metadata.

`GET /metadata/indicators/{indicator}/dimensions/{dimension}` **always** includes `category`
(that's the entire point of the route) — there's no `fullDims` parameter on it at all, and it
takes no query parameters whatsoever (`?fullDims=true` there is a `400`, same as any other
unrecognised parameter). If you need the valid values of one specific dimension (e.g. to build a
`dimension_{code}` filter for the data endpoints), this route — not `fullDims=true` on the
indicator route — is the cheap, targeted way to get them:

```
GET /api/v1/metadata/indicators/employment-rate/dimensions/period
```

```json
{
	"id": "period",
	"label": "Time period",
	"category": { "index": { "2004-01-01/P1Y": 0, "...": "..." } }
}
```

## `files/{file}` is not a v1 endpoint

CSVW responses' `url` field, and some pre-generated download links, point at `/files/{file}`
(e.g. `/files/all-datasets.csv`) — a separate, non-versioned route for downloading whole
pre-built files, not part of `/api/v1/`. It isn't parameterised or filterable the way the rest of
this API is. It's out of scope for this documentation set, but worth knowing it exists if you're
following links out of a CSVW response.

## Error catalogue

Every error body is `{ "message": "<string>" }` with no additional machine-readable field — match
on status code and, if needed, on the message text below (verbatim, typos included, since a
client matching on these needs the exact text):

| Status | Message                                                                                                                                                                           | Where                                                                                                                                                                                                                                                                                                                                                                         |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | `Request contained invalid or duplicate parameters.`                                                                                                                              | Any route — an unrecognised query key, or a key repeated more than once                                                                                                                                                                                                                                                                                                       |
| `400`  | `Request contained invalid time period.`                                                                                                                                          | Data endpoints, checked first — a `time` value isn't `earliest`/`latest`/`all` and its leading 4 characters aren't a year within the service's known data range. This check only looks at the leading 4 characters, so a value like `2020extra` passes it — see the next row.                                                                                                 |
| `400`  | `No data available for the selected filters.`                                                                                                                                     | The single-indicator endpoint only, and only for a `measure=` value that matches nothing on that indicator (see [its empty-results section](./data-item-endpoint.md#empty-results)) — every other "filters matched nothing" case on either endpoint is a `200` empty result, not this                                                                                         |
| `400`  | `Too much data requested. Try narrowing your parameters.`                                                                                                                         | The multiple-indicators endpoint only — see [Requests that get rejected as too large](./data-endpoint.md#requests-that-get-rejected-as-too-large); the single-indicator endpoint never applies this check at all                                                                                                                                                              |
| `400`  | `Invalid time period requested.`                                                                                                                                                  | Data endpoints, checked second — validates the whole value once time filtering actually runs: shape (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`, or `earliest`/`latest`) _and_ real calendar validity (`2020-02-30`, `2020-13` etc. look right-shaped but aren't real calendar dates, and are rejected here too), catching everything the leading-4-characters check above lets through. |
| `400`  | `Invalid 'hasGeo' parameter. Must be a valid GSS code or geography level.`                                                                                                        | Data and metadata endpoints — `hasGeo` value isn't a GSS code, level, or (data endpoints only) type code                                                                                                                                                                                                                                                                      |
| `400`  | `Invalid 'hasYear' parameter. Must be YYYY or 'all'.`                                                                                                                             | Metadata endpoints                                                                                                                                                                                                                                                                                                                                                            |
| `400`  | `<code> is not a valid partial postcode.`                                                                                                                                         | `/geo/postcodes/{code}/autocomplete`                                                                                                                                                                                                                                                                                                                                          |
| `400`  | `No postcodes found for <code>.`                                                                                                                                                  | `/geo/postcodes/{code}/autocomplete` — upstream postcode lookup failed                                                                                                                                                                                                                                                                                                        |
| `400`  | `No search string provided`                                                                                                                                                       | `/geo/search/{name}` with no name segment                                                                                                                                                                                                                                                                                                                                     |
| `400`  | `No areas found. Requested coordinates out of range.`                                                                                                                             | `/geo/reverse` — upstream lookup failed                                                                                                                                                                                                                                                                                                                                       |
| `400`  | `Invalid lng/lat coordinates.`                                                                                                                                                    | `/geo/reverse` — `lng`/`lat` out of `±180`/`±90` range                                                                                                                                                                                                                                                                                                                        |
| `404`  | `Requested data format "<x>" not found. Only json, xlsx, csv, csvw, cols.json, rows.json available.`                                                                              | Data endpoints — bad `{format}`                                                                                                                                                                                                                                                                                                                                               |
| `404`  | `Requested data format "<x>" not found. Only geojson, topojson available.`                                                                                                        | `/geo/boundaries.{format}` — bad `{format}`                                                                                                                                                                                                                                                                                                                                   |
| `400`  | `Geography level "<x>" not available.`                                                                                                                                            | `/geo/boundaries.{format}` — `geoLevel` not a valid layer                                                                                                                                                                                                                                                                                                                     |
| `404`  | `Area not found. "<x>" is not a valid GSS code.`                                                                                                                                  | Any `/geo/*` route taking a `{code}` — the code doesn't look like a GSS code (letter followed by 8 digits)                                                                                                                                                                                                                                                                    |
| `404`  | `Area not found. Could not retreive metadata for "<x>".` _(sic — "retreive" is a real typo in the underlying message, not a transcription error)_                                 | `/geo/lookup/{code}` — well-formed code, lookup failed or not recognised                                                                                                                                                                                                                                                                                                      |
| `404`  | `Children not found for "<x>".` / `Parents not found for "<x>".` / `Siblings not found for "<x>".` / `Related areas not found for "<x>".`                                         | `/geo/related/{code}` and sub-routes — well-formed code not recognised                                                                                                                                                                                                                                                                                                        |
| `404`  | `"Postcode not found. <x>" is not a valid postcode.` _(sic — the quote marks are placed exactly as shown; it's an artefact of the underlying message, not a transcription error)_ | `/geo/postcodes/{code}` — `{code}` doesn't look like a postcode                                                                                                                                                                                                                                                                                                               |
| `404`  | `Postcode "<x>" not found.`                                                                                                                                                       | `/geo/postcodes/{code}` — well-formed postcode, not recognised                                                                                                                                                                                                                                                                                                                |
| `404`  | `Indicator "<x>" not found.`                                                                                                                                                      | `/metadata/indicators/{indicator}` and the single-indicator data endpoint `/api/v1/data/{indicator}.{format}` — both also give this for a real slug `hasGeo`/`hasYear` excludes entirely, not just a genuinely unknown one                                                                                                                                                    |
| `404`  | `Dimension code "<x>" not found.`                                                                                                                                                 | `/metadata/indicators/{indicator}/dimensions/{dimension}`                                                                                                                                                                                                                                                                                                                     |

## Point-in-time facts, not a contract

Anything that looks like live data in these docs' examples — indicator counts, `updated`/
`dataModified` timestamps, specific observation values, the exact list of `dimension_*` codes
(`sex`, `age` as of this writing) — reflects the state of the service's data on 2026-09-11 and will
drift as the underlying data is updated. Rely on the **structure and parameter behaviour**
documented here, not the specific values in examples.
