# Explore Local Statistics API (v1)

> **IMPORTANT NOTE: This API is not intended for use by non-ONS web applications. Its structure may change without notice, and it has a CORS policy that prevents cross-origin HTTP requests in web browsers.**

This is the reference documentation for the HTTP API behind the ONS "Explore Local Statistics"
service. It documents everything under `/api/v1/`, verified against the running service rather
than transcribed from memory — every example in these pages is a real request/response captured
on 2026-09-11. Counts, dates and `updated` fields in examples (e.g. indicator counts,
`dataModified`) are point-in-time and will drift; treat the **structure** of the examples, not the
exact values, as the contract.

## Pages

- **[Conventions](#conventions-read-this-first)** (below) — base URL, request/response basics, parameter parsing rules, error format. Read this before anything else; almost every other page assumes it.
- [Requesting data for multiple indicators](./data-endpoint.md) — `/api/v1/data.{format}`, the main data endpoint.
- [Requesting data for a single indicator](./data-item-endpoint.md) — `/api/v1/data/{indicator}.{format}`, the single-indicator counterpart to the one above.
- [Data output formats](./data-formats.md) — what `csv`, `csvw`, `json`, `cols.json`, `rows.json` and `xlsx` actually look like, with full worked examples.
- [Geography: hierarchy & lookup](./geo-hierarchy.md) — `/api/v1/geo/list`, `/levels`, `/lookup/{code}`, `/related/{code}` and its `parents`/`children`/`siblings`/`similar` sub-routes.
- [Geography: search & coordinates](./geo-search.md) — `/api/v1/geo/search/{name}`, `/reverse`, `/postcodes/{code}` and its `autocomplete` sub-route.
- [Geography: boundaries](./geo-boundaries.md) — `/api/v1/geo/boundaries.{format}`, GeoJSON/TopoJSON polygons.
- [Metadata](./metadata-endpoint.md) — `/api/v1/metadata/indicators`, `/metadata/indicators/{indicator}`, `/metadata/indicators/{indicator}/dimensions/{dimension}`, `/metadata/taxonomy`.
- **[Important notes for API consumers](./important-notes.md)** — non-obvious behaviour worth knowing before you build: response differences between endpoints, per-endpoint default/setting differences, and the exact error catalogue. If you're writing a generic client (including an MCP tool layer) against this API, read this page before you write code, not after something breaks.

## Scope

This covers `/api/v1/` only.

## Endpoint index

| Group    | Route                                                                | What it does                                                                                                          |
| -------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Data     | `GET /api/v1/data.{format}`                                          | Data for multiple indicators at once, in six formats                                                                  |
| Data     | `GET /api/v1/data/{indicator}.{format}`                              | Data for one named indicator, in six formats                                                                          |
| Geo      | `GET /api/v1/geo/list`                                               | Flat list of all known areas, filterable                                                                              |
| Geo      | `GET /api/v1/geo/levels`                                             | The geography levels/groups the service uses, optionally with member areas                                            |
| Geo      | `GET /api/v1/geo/lookup/{code}`                                      | Full metadata + boundary polygon + child areas for one GSS code                                                       |
| Geo      | `GET /api/v1/geo/related/{code}`                                     | Parents, children, siblings and similar areas in one call                                                             |
| Geo      | `GET /api/v1/geo/related/{code}/parents`                             | Just the parent areas                                                                                                 |
| Geo      | `GET /api/v1/geo/related/{code}/children`                            | Just the child areas                                                                                                  |
| Geo      | `GET /api/v1/geo/related/{code}/siblings`                            | Areas sharing a parent                                                                                                |
| Geo      | `GET /api/v1/geo/related/{code}/similar`                             | Statistically similar areas (by indicator profile)                                                                    |
| Geo      | `GET /api/v1/geo/boundaries.{format}`                                | GeoJSON/TopoJSON boundary polygons for a geography level                                                              |
| Geo      | `GET /api/v1/geo/search/{name}`                                      | Search areas by name (optionally falling back to postcode search)                                                     |
| Geo      | `GET /api/v1/geo/reverse?lng=&lat=`                                  | Areas containing a coordinate                                                                                         |
| Geo      | `GET /api/v1/geo/postcodes/{code}`                                   | Full postcode → area lookup                                                                                           |
| Geo      | `GET /api/v1/geo/postcodes/{code}/autocomplete`                      | Partial postcode → candidate list                                                                                     |
| Metadata | `GET /api/v1/metadata/indicators`                                    | Metadata for all indicators, filterable                                                                               |
| Metadata | `GET /api/v1/metadata/indicators/{indicator}`                        | Metadata for one indicator                                                                                            |
| Metadata | `GET /api/v1/metadata/indicators/{indicator}/dimensions/{dimension}` | Every valid value of one dimension of one indicator — the way to discover `dimension_*` values for the data endpoints |
| Metadata | `GET /api/v1/metadata/taxonomy`                                      | The topic → sub-topic → indicator hierarchy                                                                           |

All routes are `GET`-only (confirmed: an `OPTIONS`/other-method request returns `405`, `Allow: GET, HEAD`).

## Conventions (read this first)

### Base URL

In production this is served under the service's own origin — e.g.
`https://www.ons.gov.uk/explore-local-statistics/api/v1/...`. Examples in these pages use
`/api/v1/...` relative paths; prefix with whatever base URL applies to the environment you're
calling.

### Request format

Every parameter is a query-string parameter (`?key=value`) except where a route captures part of
the URL path itself (e.g. `{code}`, `{indicator}`, `{format}` in `data.{format}`). There is no
request body — every route is `GET`.

**Every value is parsed the same way**, regardless of which endpoint or parameter it is — there's
no per-parameter type declaration, so the same generic rules apply everywhere:

| Raw value                            | Parsed as                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `true` / `false` (exact string)      | boolean `true` / `false`                                                            |
| contains a `,`                       | split into a list of values (each element is **not** further converted — see below) |
| looks like a whole or decimal number | a number                                                                            |
| anything else                        | left as text                                                                        |

This has real consequences documented in full in [important-notes.md](./important-notes.md#value-parsing-surprises):
most importantly, a setting only turns "on" when the value is the exact word `true` —
`?excludeMultivariate=1` or `?excludeMultivariate=yes` silently parse to something other than a
boolean and are treated as "off" wherever that setting is checked.

**Unknown or duplicate query parameters are rejected with `400`** — every route checks the query
string against its own list of accepted parameters before doing anything else, and rejects the
whole request if any query key isn't recognised (an empty list for the handful of routes that take
no query parameters at all), or appears more than once (so `?geo=A&geo=B` is invalid —
comma-separate instead: `?geo=A,B`).

### Response format

JSON responses do not share one envelope — some are a bare array, some are `{ meta, data }`, some
are a shape specific to that route. Each page documents its own routes' exact response. The data
endpoints additionally return plain-text CSV or a binary XLSX file depending on the requested
`{format}`.

Response bodies are always UTF-8. Numbers are native JSON numbers.

### Errors

Every error response is `{ "message": "<human-readable string>" }` with a matching non-2xx HTTP
status — there's no machine-readable error code field. See
[important-notes.md](./important-notes.md#error-catalogue) for the full table of conditions, statuses and exact
message text (including a couple of message typos worth matching on carefully rather than
"fixing" when you transcribe them).

### CORS and caching

No cross-origin access is enabled for browser-based requests — a browser calling this API directly
from another site's JavaScript will be blocked by the browser's own CORS check, per the notice at
the top of this page. Server-to-server calls (curl, a backend, an MCP tool host) aren't subject to
CORS at all, since CORS is a browser enforcement mechanism.

No `Cache-Control` header is set on any response, so a client that wants its _own_ HTTP cache to
work (a browser, or any API consumer reusing a URL) needs to handle that itself; nothing here does
it for you. The service does have caching in front of it in production, but that's outside what
these docs can verify from the outside, and isn't something a client should rely on for its own
caching behaviour.

### External-data endpoints (different failure mode)

Most routes answer entirely from data already loaded into the service (fast, and their only
failure mode is "not found"/`404`/`400`). A few instead look up data from an external source **at
request time**, and so have network-call failure modes too — a timeout or upstream error surfaces
as a generic `404 Not Found` with a message that reads like "not found" even when the real cause
was a failed lookup:

- `GET /api/v1/geo/lookup/{code}`
- `GET /api/v1/geo/postcodes/{code}` and `.../autocomplete`
- `GET /api/v1/geo/reverse`

Everything else answers immediately with no external lookup.
