# Gotchas for API consumers

Everything on this page was found by reading the actual source under `src/lib/api/` and
`src/routes/(api)/api/v1/` and verifying it against a running dev server on 2026-09-11 — nothing
here is speculative. If you're writing a generic client against this API (including generating
one, e.g. an MCP tool layer from the endpoint list), this is the page most likely to save you
from a bug that only shows up on some parameter combinations.

## `geoLevel` means a different set of keys depending on the route

There is no single canonical list of "geography levels" — three different, **non-nested** key
sets exist in the codebase, and which one a given `geoLevel`/`geo`/`hasGeo`/`parentLevel`
parameter resolves against depends entirely on which route you're calling. This is a real,
load-bearing distinction rather than an oversight, so it's documented here rather than treated as
something to fix: the 5-key `geoLevels` set is the **statistical geography** the app aggregates
indicator data by (the data endpoint, `/geo/list`, and `/geo/related`'s `children`/`siblings`,
which mirror that same data-oriented hierarchy) — it stops at `ltla` because that's the finest
level any indicator is actually published at. `geoLevelsAll` (and `topo.json`'s own boundary
layers, separately) instead serve **area-to-area navigation and lookup** — finding what a
postcode or coordinate resolves to, or searching by name — which has no reason to stop at `ltla`
and legitimately needs ward/MSOA/LSOA/OA granularity that no indicator data uses. Unifying the two
would mean either losing that navigation-level granularity or pretending indicator data exists
where it doesn't, so the sets are kept genuinely separate rather than reconciled.

| Set                                    | Keys                                                                                                                                     | Used by                                                                                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `geoLevels` (5 keys)                   | `ctry`, `rgn`, `cauth`, `utla`, `ltla`                                                                                                   | `geo` and `hasGeo` on the data endpoint; `geo` on `/geo/list`; `geoLevel` on `/geo/related/{code}/children`; `parentLevel` on `/geo/related/{code}/siblings` |
| `geoLevelsAll` (14 keys)               | `uk`, `ctry`, `rgn`, `cauth`, `cty`, `ltla`, `wpc`, `sener`, `senc`, `wd`, `par`, `msoa`, `lsoa`, `oa` — note: has `cty`, **not** `utla` | `geoLevel` on `/geo/search/{name}`, `/geo/reverse`, `/geo/postcodes/{code}`                                                                                  |
| `geoLevelsNav` (13 keys)               | `ctry`, `rgn`, `cauth`, `utla`, `ltla`, `wpc`, `wd`, `par`, `sener`, `senc`, `msoa`, `lsoa`, `oa` — has `utla`, **not** `cty`/`uk`       | Internal only (area-page navigation grouping); not selectable by any `geoLevel` query parameter                                                              |
| `topo.json`'s own object keys (8 keys) | `cauth`, `ctry`, `cty`, `ltla`, `mcty`, `rgn`, `uk`, `utla`                                                                              | `geoLevel` on `/geo/boundaries.{format}` — resolved directly against the boundary data file, independent of any of the three sets above                      |

Concretely: `geoLevel=cty` is valid on `/geo/search` but not on `/geo/related/{code}/children`;
`geoLevel=mcty` and `geoLevel=uk` are valid **only** on `/geo/boundaries`, matching neither of the
other three sets; and `wd`/`msoa`/`lsoa`/`oa` — all valid `geoLevel` values elsewhere — have no
boundary data at all (`/geo/boundaries` only goes down to `ltla`).

**Invalid-value behaviour also differs by route**, which is easy to miss because none of them
give you the same signal:

| Route                                                  | Invalid `geoLevel`/level param                        |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `/geo/related/{code}/children`                         | Silently ignored — returns _all_ children, unfiltered |
| `/geo/related/{code}/siblings` (`parentLevel`)         | `404`                                                 |
| `/geo/search`, `/geo/reverse`, `/geo/postcodes/{code}` | No match → empty result set, not an error             |
| `/geo/boundaries.{format}`                             | `400`                                                 |

`geoLevel=all` on `/geo/boundaries` is valid in exactly one exact combination —
`format=topojson&year=all&country=all&geoLevel=all` (a short-circuit that returns the whole
bundled TopoJSON file unfiltered) — and `400`s in every other combination that includes it.

## Top-level response envelopes vary route to route

There's no single response envelope across the API — check each route's actual shape rather than
assuming `{ data: [...] }` or a bare array everywhere:

| Route                                                                             | Shape                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/geo/search/{name}`, `/geo/reverse`, `/geo/postcodes/{code}`, `.../autocomplete` | `{ meta: {...}, data: [...] }`                                                                                                                                                                                                                                                          |
| `/geo/list`, `/geo/levels`, `/geo/related/{code}/parents`, `.../similar`          | Bare array                                                                                                                                                                                                                                                                              |
| `/geo/related/{code}/children`                                                    | Bare array only (no `groupByLevel` option on this route); empty for any area below `ltla` in the app's 5-level statistical hierarchy, not an error — see [geo-hierarchy.md](./geo-hierarchy.md#the-relatedparentschildrensiblings-family-only-covers-the-5-level-statistical-hierarchy) |
| `/geo/related/{code}`                                                             | `{ parents, children, siblings, similar }` — each sub-value in the shape its own dedicated endpoint returns                                                                                                                                                                             |
| `/geo/related/{code}/siblings`                                                    | `{ parent: {...}, siblings: [...] }` — **or a bare empty object `{}`** if the area has no parent at that level (e.g. `/geo/related/K02000001/siblings`, the UK itself). Code doing `res.siblings.map(...)` will throw on that input; check for the key first.                           |
| `/metadata/taxonomy`                                                              | `{ meta: {...}, data: [...] }` (nested by topic unless `flat=true`)                                                                                                                                                                                                                     |
| `/metadata/indicators` (list)                                                     | Bare array, or `{ [slug]: {...} }` if `asLookup=true`                                                                                                                                                                                                                                   |
| `/metadata/indicators/{indicator}` (single)                                       | Bare object                                                                                                                                                                                                                                                                             |
| Data endpoint                                                                     | See [the single-vs-collection table in data-endpoint.md](./data-endpoint.md#response-shape-single-indicator-vs-collection) — the most consequential asymmetry in the API                                                                                                                |

## `getParam` coercion surprises

Every query parameter goes through the same generic parser (`getParam`,
[documented in Conventions](./README.md#request-format)) — there's no per-parameter schema, so
these apply uniformly:

- **Booleans only turn on for the exact string `true`.** `?excludeMultivariate=1` parses to the
  _number_ `1`, and the code checks `=== true`, so it's silently treated as `false`. Verified:
  `?excludeMultivariate=true&topic=population` on `/metadata/indicators` returns 7 indicators
  (the multivariate one excluded); `?excludeMultivariate=1` with the same `topic` returns 8 (it's
  still there). Always send the literal string `true`, never `1`, `yes`, or a bare presence flag.
- **A one-element comma list and a scalar are different JS types** by the time your filter code
  sees them (array of one string, vs. a string) — most of this codebase's filter-building
  handles both via `[value].flat()`, but if you're inspecting raw query values yourself, don't
  assume a single value always arrives as a scalar.
- **Numeric-looking strings become numbers.** A GSS code never matches this pattern, but a
  `dimension_{code}=2024` filter value would parse as the number `2024`, not the string `"2024"` —
  usually harmless since category index lookups are string-keyed and JS coerces on lookup, but
  worth knowing if you're constructing the raw query string yourself outside a browser's own
  `URLSearchParams`.

## `excludeMultivariate` means two different things depending on the endpoint

- **Data endpoint**: keeps a multivariate indicator if it's _explicitly named_ in `indicator`,
  even with `excludeMultivariate=true` — the exclusion only applies to indicators pulled in via
  `topic`/`all`.
- **Metadata endpoints** (`/metadata/indicators`, `/metadata/taxonomy`): drops every multivariate
  indicator unconditionally when `excludeMultivariate=true`, regardless of `indicator`/`topic`.

Same parameter name and default (`false`), different semantics.

## `fullDims` asymmetry between the two dimension-metadata routes

`GET /metadata/indicators/{indicator}` omits each dimension's `category` (its full value list)
unless you pass `fullDims=true` — it's expensive to include (every dimension, every value) for a
route that's often called just for descriptive metadata.

`GET /metadata/indicators/{indicator}/dimensions/{dimension}` **always** includes `category`
(that's the entire point of the route) — there's no `fullDims` parameter on it at all, and
passing one is silently ignored (see below). If you need the valid values of one specific
dimension (e.g. to build a `dimension_{code}` filter for the data endpoint), this route — not
`fullDims=true` on the indicator route — is the cheap, targeted way to get them:

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

## Routes with no parameter validation

Most routes reject unknown/duplicate query parameters with `400` (see
[Conventions](./README.md#request-format)). Two routes skip that check entirely, so an unknown
parameter (a typo, or a parameter that only exists on a _different_ route) is silently ignored
rather than flagged:

- `GET /api/v1/geo/lookup/{code}`
- `GET /api/v1/metadata/indicators/{indicator}/dimensions/{dimension}`

If a request to either of these isn't behaving as expected, don't assume a `200` means your
parameters were understood — check the response content itself.

## `files/{file}` is not a v1 endpoint

CSVW responses' `url` field, and some pre-generated download links, point at
`/files/{file}` (e.g. `/files/all-datasets.csv`) — a separate, non-versioned static-asset route
(`src/routes/(api)/files/[file]/+server.ts`), not part of `/api/v1/`. It serves pre-generated
files bundled under `src/lib/data/` (gzip-encoded for `.csv`) and isn't parameterised or
filterable the way the rest of this API is. It's out of scope for this documentation set, but
worth knowing it exists if you're following links out of a CSVW response.

## Error catalogue

Every error body is `{ "message": "<string>" }` with no additional machine-readable field — match
on status code and, if needed, on the message text below (verbatim, typos included, since a
client string-matching on these needs the exact text):

| Status | Message                                                                                                                                                                      | Where                                                                                                                                                                                                                                                                                                                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | `Request contained invalid or duplicate parameters.`                                                                                                                         | Any route with `hasValidParams` — unknown query key, or a key repeated more than once                                                                                                                                                                                                                                                                                                           |
| `400`  | `Request contained invalid time period.`                                                                                                                                     | Data endpoint, checked first (`+server.ts`) — a `time` value isn't `earliest`/`latest`/`all` and its leading 4 characters aren't a year within the dataset's known range. This check only looks at the leading 4 characters, so a value like `2020extra` passes it — see the next row.                                                                                                          |
| `400`  | `No data available for the selected filters.`                                                                                                                                | Data endpoint — filters were all valid but matched nothing                                                                                                                                                                                                                                                                                                                                      |
| `400`  | `Too much data requested. Try narrowing your parameters.`                                                                                                                    | Data endpoint — see [isOversizedRequest](./data-endpoint.md#requests-that-get-rejected-as-too-large)                                                                                                                                                                                                                                                                                            |
| `400`  | `Invalid time period requested.`                                                                                                                                             | Data endpoint, checked second (`filterDatasets.ts`) — validates the whole value once time filtering actually runs: string shape (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`, or `earliest`/`latest`) _and_ real calendar validity (`2020-02-30`, `2020-13` etc. are shape-matched but calendar-invalid, and are rejected here too), catching everything the leading-4-characters check above lets through. |
| `400`  | `Invalid 'hasGeo' parameter. Must be a valid GSS code or geography level.`                                                                                                   | Data and metadata endpoints — `hasGeo` value isn't a GSS code, level key, or (data endpoint only) type code                                                                                                                                                                                                                                                                                     |
| `400`  | `Invalid 'hasYear' parameter. Must be YYYY or 'all'.`                                                                                                                        | Metadata endpoints                                                                                                                                                                                                                                                                                                                                                                              |
| `400`  | `<code> is not a valid partial postcode.`                                                                                                                                    | `/geo/postcodes/{code}/autocomplete`                                                                                                                                                                                                                                                                                                                                                            |
| `400`  | `No postcodes found for <code>.`                                                                                                                                             | `/geo/postcodes/{code}/autocomplete` — upstream postcode-tile fetch failed                                                                                                                                                                                                                                                                                                                      |
| `400`  | `No search string provided`                                                                                                                                                  | `/geo/search/{name}` with no name segment                                                                                                                                                                                                                                                                                                                                                       |
| `400`  | `No areas found. Requested coordinates out of range.`                                                                                                                        | `/geo/reverse` — upstream tile fetch failed                                                                                                                                                                                                                                                                                                                                                     |
| `400`  | `Invalid lng/lat coordinates.`                                                                                                                                               | `/geo/reverse` — `lng`/`lat` out of `±180`/`±90` range                                                                                                                                                                                                                                                                                                                                          |
| `404`  | `Requested data format "<x>" not found. Only json, xlsx, csv, csvw, cols.json, rows.json available.`                                                                         | Data endpoint — bad `{format}`                                                                                                                                                                                                                                                                                                                                                                  |
| `404`  | `Requested data format "<x>" not found. Only geojson, topojson available.`                                                                                                   | `/geo/boundaries.{format}` — bad `{format}`                                                                                                                                                                                                                                                                                                                                                     |
| `400`  | `Geography level "<x>" not available.`                                                                                                                                       | `/geo/boundaries.{format}` — `geoLevel` not a key in the boundary file                                                                                                                                                                                                                                                                                                                          |
| `404`  | `Area not found. "<x>" is not a valid GSS code.`                                                                                                                             | Any `/geo/*` route taking a `{code}` — fails the `^[EKNSW]\d{8}$` shape check                                                                                                                                                                                                                                                                                                                   |
| `404`  | `Area not found. Could not retreive metadata for "<x>".` _(sic — "retreive" is a real typo in the source, not a transcription error)_                                        | `/geo/lookup/{code}` — well-formed code, upstream fetch failed or 404'd                                                                                                                                                                                                                                                                                                                         |
| `404`  | `Children not found for "<x>".` / `Parents not found for "<x>".` / `Siblings not found for "<x>".` / `Related areas not found for "<x>".`                                    | `/geo/related/{code}` and sub-routes — well-formed code not present in geo metadata                                                                                                                                                                                                                                                                                                             |
| `404`  | `"Postcode not found. <x>" is not a valid postcode.` _(sic — the quote marks are placed exactly as shown; it's a source string-literal artefact, not a transcription error)_ | `/geo/postcodes/{code}` — `{code}` doesn't match postcode shape (`^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$`)                                                                                                                                                                                                                                                                                         |
| `404`  | `Postcode "<x>" not found.`                                                                                                                                                  | `/geo/postcodes/{code}` — well-formed postcode, not found in the upstream lookup data                                                                                                                                                                                                                                                                                                           |
| `404`  | `Indicator "<x>" not found.`                                                                                                                                                 | `/metadata/indicators/{indicator}`                                                                                                                                                                                                                                                                                                                                                              |
| `404`  | `Dimension code "<x>" not found.`                                                                                                                                            | `/metadata/indicators/{indicator}/dimensions/{dimension}`                                                                                                                                                                                                                                                                                                                                       |

## Point-in-time facts, not a contract

Anything that looks like live data in these docs' examples — indicator counts, `updated`/
`dataModified` timestamps, specific observation values, the exact list of `dimension_*` codes
(`sex`, `age` as of this writing) — reflects the state of the bundled data on 2026-09-11 and will
drift as the data pipeline re-runs. Rely on the **shapes and parameter behaviour** documented
here, not the specific values in examples.
