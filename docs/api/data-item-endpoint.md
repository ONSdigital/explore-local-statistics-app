# Requesting data for a single indicator

```
GET /api/v1/data/{indicator}.{format}?{parameters}
```

Data for one specific indicator, named in the URL, filtered the same way as
[the multiple-indicators endpoint](./data-endpoint.md) — but **returns that indicator's data
directly**, without the per-indicator grouping the other endpoint always uses. See
[important-notes.md](./important-notes.md#the-two-data-endpoints-and-what-they-replaced) for why the API has two
separate endpoints for this rather than one that behaves differently depending on your request.
Read [Conventions](./README.md#conventions-read-this-first) and
[the multiple-indicators page](./data-endpoint.md) first if you haven't — this page only covers
what's different here.

## `{indicator}` and `{format}`

`{indicator}` is a single indicator slug — not a comma list; use
[the multiple-indicators endpoint](./data-endpoint.md) if you want more than one. `{format}`
accepts the same six values as the other data endpoint (see
[data-formats.md](./data-formats.md)) and the same `404` for an unrecognised one.

## Parameters

Everything [the multiple-indicators endpoint](./data-endpoint.md#parameters) has, **except**
`topic`, `indicator` and `excludeMultivariate` — all three are redundant once the indicator is
named in the URL (there's nothing to exclude, and nothing else to search by topic), so passing
any of them here is rejected with `400` (`Request contained invalid or duplicate parameters.`),
the same as any other unrecognised parameter:

```
GET /api/v1/data/employment-rate.json?indicator=claimant-count   → 400
GET /api/v1/data/employment-rate.json?topic=economy              → 400
```

Everything else — `geo`, `geoExtent`, `geoCluster`, `hasGeo`, `time`, `timeNearest`, `measure`,
`includeNames`, `includeStatus`, `dimension_{code}` — behaves identically to the
multiple-indicators endpoint; see [its page](./data-endpoint.md) for the full description of each.

## What you get back

The indicator's data directly — the same content the multiple-indicators endpoint groups by
indicator name, just without that grouping:

| Format      | What you get                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| `json`      | The indicator's full data directly, not wrapped in anything                                              |
| `cols.json` | The columns object directly (`{ areacd: [...], value: [...] }`)                                          |
| `rows.json` | A list of row objects directly                                                                           |
| `csv`       | No `indicator` column — redundant, it's already in the URL                                               |
| `csvw`      | Describes this one indicator's own details (title, description, source, etc.), not an `indicator` column |
| `xlsx`      | Cover + table-of-contents + notes (if any) + exactly one data sheet                                      |

```
GET /api/v1/data/employment-rate.json?geo=E07000148
```

```json
{
	"version": "2.0",
	"class": "dataset",
	"label": "Employment rate (Great Britain)",
	"id": ["areacd", "period", "measure"],
	"size": [1, 1, 3],
	"dimension": {
		"areacd": {
			"label": "Area code",
			"category": { "index": { "E07000148": 0 }, "label": { "E07000148": "Norwich" } }
		},
		"period": { "label": "Time period", "category": { "index": { "2023-01-01/P1Y": 0 } } },
		"measure": {
			"label": "Measure",
			"category": { "index": { "value": 0, "lci_95": 1, "uci_95": 2 } }
		}
	},
	"status": {},
	"value": [82.7, 75, 90.4]
}
```

## Unknown or excluded indicator: `404`

```
GET /api/v1/data/not-a-real-indicator.json   → 404, "Indicator "not-a-real-indicator" not found."
```

Deliberately **not distinguished** from a real slug that `hasGeo` excludes entirely — both give
the same generic `404`, matching the existing behaviour of
[`/metadata/indicators/{indicator}`](./metadata-endpoint.md#get-apiv1metadataindicatorsindicator)
(which already treats "unknown slug" and "excluded by `hasGeo`/`hasYear`" identically). This
check happens before any filtering on `geo`/`time`/etc. — it's about whether the _indicator
itself_ resolves, not whether it has data for your specific `geo`/`time`.

## Empty results

A valid indicator whose `geo`/`time`/`dimension_*` filters leave no observations is a `200`, with
the same structure as a populated response but empty-valued (`value: []`, empty dimension
categories where they were filtered away) — not an error:

```
GET /api/v1/data/employment-rate-ni.json?geo=E07000148
```

```json
{
	"version": "2.0",
	"class": "dataset",
	"label": "Employment rate (Northern Ireland)",
	"id": ["areacd", "period", "measure"],
	"size": [0, 1, 3],
	"dimension": {
		"areacd": { "label": "Area code", "category": { "index": {}, "label": {} } },
		"period": { "label": "Time period", "category": { "index": { "2023-01-01/P1Y": 0 } } },
		"measure": {
			"label": "Measure",
			"category": { "index": { "value": 0, "lci_95": 1, "uci_95": 2 } }
		}
	},
	"status": {},
	"value": []
}
```

(`employment-rate-ni` is a real indicator, genuinely doesn't cover England — `size[0]` is `0`
because `areacd` filtered away entirely, `size[1]`/`size[2]` are unaffected.) `cols.json` for the
same request gives every column as an empty list; `csv` gives a genuinely empty response body (no
header row — there's no fixed column set to infer with zero rows to draw one from).

**One narrower case is still a `400`, not an empty `200`**: a `measure=` value that doesn't match
anything on this indicator leaves nothing to build even an empty response around (there'd be no
`value`-like column at all) —

```
GET /api/v1/data/employment-rate.json?geo=E07000148&measure=not-a-real-measure   → 400, "No data available for the selected filters."
```

— this is the one place that message still appears on this endpoint. Every other empty-result
case (bad/narrow `geo`, `time`, `dimension_*`, or a `hasGeo` that excludes the _time period_
rather than the indicator outright) is the `200` empty response above, not this.

## No "too much data" check

[The multiple-indicators endpoint's size check](./data-endpoint.md#requests-that-get-rejected-as-too-large)
is never applied here at all. It rejects a request only when time, indicator _and_ geo are all
broad at once — and the indicator axis can never be broad on this endpoint (exactly one real
slug, never `all`), so the check could never apply regardless of how broad `time`/`geo` are.
`time=all&geo=ltla` (the broadest shape on the other two axes) is always allowed here, unlike on
the multiple-indicators endpoint, where the same combination plus a broad indicator selection
would be rejected.
