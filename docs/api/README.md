# Explore Local Statistics API (v1)

This is the reference documentation for the HTTP API behind the ONS "Explore Local
Statistics" service. It documents everything under `/api/v1/` as implemented in this repo
(`src/routes/(api)/api/v1/`), verified against the running app rather than transcribed from
memory — every example in these pages is a real request/response captured from a local dev
server on 2026-09-11. Counts, dates and `updated` fields in examples (e.g. indicator counts,
`dataModified`) are point-in-time and will drift; treat the **shapes**, not the exact values,
as the contract.

## Pages

- **[Conventions](#conventions-read-this-first)** (below) — base URL, request/response basics, parameter parsing rules, error format. Read this before anything else; almost every other page assumes it.
- [Requesting data](./data-endpoint.md) — `/api/v1/data.{format}`, the main observation-level data endpoint.
- [Data output formats](./data-formats.md) — what `csv`, `csvw`, `json`, `cols.json`, `rows.json` and `xlsx` actually look like, with full worked examples.
- [Geography: hierarchy & lookup](./geo-hierarchy.md) — `/api/v1/geo/list`, `/levels`, `/lookup/{code}`, `/related/{code}` and its `parents`/`children`/`siblings`/`similar` sub-routes.
- [Geography: search & coordinates](./geo-search.md) — `/api/v1/geo/search/{name}`, `/reverse`, `/postcodes/{code}` and its `autocomplete` sub-route.
- [Geography: boundaries](./geo-boundaries.md) — `/api/v1/geo/boundaries.{format}`, GeoJSON/TopoJSON polygons.
- [Metadata](./metadata-endpoint.md) — `/api/v1/metadata/indicators`, `/metadata/indicators/{indicator}`, `/metadata/indicators/{indicator}/dimensions/{dimension}`, `/metadata/taxonomy`.
- **[Gotchas for API consumers](./gotchas.md)** — every sharp edge found while writing this: response-shape asymmetries, per-endpoint default/sentinel differences, a known crash, and the exact error catalogue. If you're writing a generic client (including an MCP tool layer) against this API, read this page before you write code, not after something breaks.

## Scope

This covers `/api/v1/` only, as implemented in `src/routes/(api)/api/v1/`.

## Endpoint index

| Group    | Route                                                                | What it does                                                                                                         |
| -------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Data     | `GET /api/v1/data.{format}`                                          | Filtered observation-level data in six formats                                                                       |
| Geo      | `GET /api/v1/geo/list`                                               | Flat list of all known areas, filterable                                                                             |
| Geo      | `GET /api/v1/geo/levels`                                             | The geography levels/groups the app uses, optionally with member areas                                               |
| Geo      | `GET /api/v1/geo/lookup/{code}`                                      | Full metadata + boundary polygon + child areas for one GSS code                                                      |
| Geo      | `GET /api/v1/geo/related/{code}`                                     | Parents, children, siblings and similar areas in one call                                                            |
| Geo      | `GET /api/v1/geo/related/{code}/parents`                             | Just the parent areas                                                                                                |
| Geo      | `GET /api/v1/geo/related/{code}/children`                            | Just the child areas                                                                                                 |
| Geo      | `GET /api/v1/geo/related/{code}/siblings`                            | Areas sharing a parent                                                                                               |
| Geo      | `GET /api/v1/geo/related/{code}/similar`                             | Statistically similar areas (by indicator profile)                                                                   |
| Geo      | `GET /api/v1/geo/boundaries.{format}`                                | GeoJSON/TopoJSON boundary polygons for a geography level                                                             |
| Geo      | `GET /api/v1/geo/search/{name}`                                      | Search areas by name (optionally falling back to postcode search)                                                    |
| Geo      | `GET /api/v1/geo/reverse?lng=&lat=`                                  | Areas containing a coordinate                                                                                        |
| Geo      | `GET /api/v1/geo/postcodes/{code}`                                   | Full postcode → area lookup                                                                                          |
| Geo      | `GET /api/v1/geo/postcodes/{code}/autocomplete`                      | Partial postcode → candidate list                                                                                    |
| Metadata | `GET /api/v1/metadata/indicators`                                    | Metadata for all indicators, filterable                                                                              |
| Metadata | `GET /api/v1/metadata/indicators/{indicator}`                        | Metadata for one indicator                                                                                           |
| Metadata | `GET /api/v1/metadata/indicators/{indicator}/dimensions/{dimension}` | Every valid value of one dimension of one indicator — the way to discover `dimension_*` values for the data endpoint |
| Metadata | `GET /api/v1/metadata/taxonomy`                                      | The topic → sub-topic → indicator hierarchy                                                                          |

All routes are `GET`-only (confirmed: an `OPTIONS`/other-method request returns `405`, `Allow: GET, HEAD`).

## Conventions (read this first)

### Base URL

In production this is served under the app's own origin — e.g.
`https://www.ons.gov.uk/explore-local-statistics/api/v1/...` — with the base path controlled by
the `SVELTEKIT_BASE_PATH` env var (see the root `CLAUDE.md`). Examples in these pages use
`/api/v1/...` relative paths; prefix with whatever base URL applies to the environment you're
calling.

### Request format

Every parameter is a query-string parameter (`?key=value`) except where a route captures part of
the URL path itself (e.g. `{code}`, `{indicator}`, `{format}` in `data.{format}`). There is no
request body — every route is `GET`.

**Every value is parsed the same way** (`getParam` in `src/lib/api/utils.ts`), regardless of
which endpoint or parameter it is — there's no per-parameter type declaration, so the same
generic coercion applies everywhere:

| Raw value                       | Parsed as                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `true` / `false` (exact string) | boolean `true` / `false`                                                             |
| contains a `,`                  | split into an array of strings (each element is **not** further coerced — see below) |
| matches `^-?\d+(\.\d+)?$`       | a number                                                                             |
| anything else                   | left as a string                                                                     |

This has real consequences documented in full in [gotchas.md](./gotchas.md#getparam-coercion-surprises):
most importantly, a boolean parameter only turns "on" when the value is the literal string
`true` — `?excludeMultivariate=1` or `?excludeMultivariate=yes` silently parse to a _non-boolean_
value and are treated as falsy wherever the code checks `=== true`.

**Unknown or duplicate query parameters are rejected with `400`** — every route calls
`hasValidParams(url, <allow-list>)` before doing anything else, which rejects the whole request
if any query key isn't in that route's specific allow-list (an empty list for the handful of
routes that take no query parameters at all), or appears more than once (so `?geo=A&geo=B` is
invalid — comma-separate instead: `?geo=A,B`).

### Response format

JSON responses do not share one envelope — some are a bare array, some are `{ meta, data }`, some
are a bespoke shape specific to that route. Each page documents its own routes' exact shape. The
data endpoint additionally returns plain-text CSV or a binary XLSX stream depending on the
requested `{format}`.

Response bodies are always UTF-8. Numbers are native JSON numbers (JSON-Stat status/confidence
fields are numbers or `null`, never strings).

### Errors

Every error response is `{ "message": "<human-readable string>" }` with a matching non-2xx HTTP
status — there's no machine-readable error code field. See
[gotchas.md](./gotchas.md#error-catalogue) for the full table of conditions, statuses and exact
message text (including one verified `500` and a couple of message typos worth string-matching
carefully rather than fixing at read-time).

### CORS and caching

No explicit CORS headers (`Access-Control-Allow-Origin` etc.) are set anywhere in the app's own
code, and a cross-origin `OPTIONS` preflight against a live dev server returns no
`Access-Control-Allow-Origin` — so a browser-based cross-origin `fetch()` against this API will
fail the browser's own CORS check as things stand in this repo. Server-to-server calls (curl, a
backend, an MCP tool host) aren't subject to CORS at all, since CORS is a browser enforcement
mechanism. Whether anything in front of the app in production (e.g. a CDN layer) adds
cross-origin headers is outside this repo and not something these docs can verify.

No `Cache-Control` header is set anywhere in `src/routes/(api)/` either. The deployed app sits
behind Cloudflare, which covers server/edge-side caching, but that's opaque from the app's own
code — these docs make no claim about it. A client that wants its _own_ HTTP cache to work (a
browser, or any API consumer reusing a URL) needs to handle that itself; nothing here does it for
you.

### External-data endpoints (different failure mode)

Most routes read from data bundled into the app at build time (in-memory, fast, and their only
failure mode is "not found"/`404`/`400`). A few fetch from an external CDN **at request time**
and so have network-call failure modes too — a timeout or upstream error surfaces as a generic
`404 Not Found` with a message that reads like "not found" even when the real cause was a failed
fetch:

- `GET /api/v1/geo/lookup/{code}`
- `GET /api/v1/geo/postcodes/{code}` and `.../autocomplete`
- `GET /api/v1/geo/reverse`

Everything else is served from data already in server memory.
