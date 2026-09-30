# Data output formats

The six `{format}` values available on both the [multiple-indicators](./data-endpoint.md) and
[single-indicator](./data-item-endpoint.md) data endpoints, with full worked examples. All
examples below use the same request family — indicator `employment-rate`, area `E07000148`
(Norwich) — via [the single-indicator endpoint](./data-item-endpoint.md), so you can compare the
same underlying data across formats without the extra grouping in the way; each section notes
exactly what differs on [the multiple-indicators endpoint](./data-endpoint.md) instead.

## `json` — JSON-Stat

```
GET /api/v1/data/employment-rate.json?geo=E07000148
```

```json
{
	"version": "2.0",
	"class": "dataset",
	"label": "Employment rate (Great Britain)",
	"note": ["Calculation of employment rate: ..."],
	"source": "Office for National Statistics",
	"updated": "2024-04-16",
	"extension": {
		"topic": "economy",
		"subTopic": "employment",
		"...": "full indicator metadata, same shape as /metadata/indicators/{indicator}"
	},
	"id": ["areacd", "period", "measure"],
	"size": [1, 1, 3],
	"role": { "geo": ["areacd"], "time": ["period"] },
	"dimension": {
		"areacd": {
			"label": "Area code",
			"category": { "index": { "E07000148": 0 }, "label": { "E07000148": "Norwich" } }
		},
		"period": { "label": "Time period", "category": { "index": { "2023-01-01/P1Y": 0 } } },
		"measure": {
			"label": "Measure",
			"category": {
				"index": { "value": 0, "lci_95": 1, "uci_95": 2 },
				"label": {
					"value": "Observation value",
					"lci_95": "Lower confidence interval (95%)",
					"uci_95": "Upper confidence interval (95%)"
				}
			}
		}
	},
	"status": {},
	"value": [82.7, 75, 90.4]
}
```

The [JSON-Stat 2.0](https://json-stat.org/) format: `size` gives each dimension's cardinality
(in `id` order), `dimension.<key>.category.index` maps each category value to its position, and
`value` is a flat list in row-major order over all dimensions — so `value[i]` for a given
`measure` position is found by `areacd_index * (period_count * measure_count) + period_index *
measure_count + measure_index`. This is the richest format (full dimension metadata, indicator
description inline) and the most space-efficient one for genuinely multi-dimensional data, but
the least convenient to consume directly — most consumers want `cols.json`/`rows.json` instead
unless they specifically need dimension metadata alongside the data.

**On [the multiple-indicators endpoint](./data-endpoint.md)**
(`/api/v1/data.json?indicator=employment-rate`), this exact object appears grouped instead:
`{ version, class: "collection", label, link: { item: [<this object>] } }` — see
[its "what you get back" table](./data-endpoint.md#what-you-get-back).

## `cols.json` — column-oriented JSON

```
GET /api/v1/data/employment-rate.cols.json?geo=E07000148&time=all
```

```json
{
	"areacd": ["E07000148", "E07000148", "..."],
	"areanm": ["Norwich", "Norwich", "..."],
	"period": ["2004-01-01/P1Y", "2005-01-01/P1Y", "..."],
	"value": [70.6, 68.3, "..."],
	"lci_95": [67.2, 64.5, "..."],
	"uci_95": [74, 72.1, "..."]
}
```

One list per field, all the same length, index-aligned — `areacd[i]`/`period[i]`/`value[i]` all
describe the same observation. This is the format every chart on the site actually requests —
it's compact (no repeated keys per row) and trivial to feed straight into a charting library that
wants columnar series data.

**On the multiple-indicators endpoint**, this appears keyed by indicator slug instead:
`{ "employment-rate": <this object> }` — see
[the two-indicator example](./data-endpoint.md#what-you-get-back).

## `rows.json` — row-oriented JSON

```
GET /api/v1/data/employment-rate.rows.json?geo=E07000148
```

```json
[
	{
		"areacd": "E07000148",
		"areanm": "Norwich",
		"period": "2023-01-01/P1Y",
		"value": 82.7,
		"lci_95": 75,
		"uci_95": 90.4
	}
]
```

Each observation as its own object — the most conventional shape for feeding into a spreadsheet
or a generic JSON→table tool, at the cost of repeating every key on every row. On the
single-indicator endpoint this is exactly `cols.json`'s data "transposed" row by row (same
fields, same values, same order); on the multiple-indicators endpoint it's keyed by indicator
slug, same as `cols.json`.

## `csv` — plain-text CSV

```
GET /api/v1/data/employment-rate.csv?geo=E07000148&time=2020,2023
```

```csv
areacd,areanm,period,value,lci_95,uci_95
E07000148,Norwich,2020-01-01/P1Y,79,71.6,86.4
E07000148,Norwich,2021-01-01/P1Y,84.3,78.3,90.3
E07000148,Norwich,2022-01-01/P1Y,81.5,74.5,88.5
E07000148,Norwich,2023-01-01/P1Y,82.7,75,90.4
```

Standard comma-separated, header row included, values are quoted only where actually needed
(containing a comma, quote mark, or line break). Column order is `areacd`, `areanm` (if
`includeNames`), then remaining non-`value`/`status` dimension columns, then `value`, then any
other measures, then `status` (if `includeStatus`) last. **On the multiple-indicators endpoint**,
an `indicator` column is always included first (see
[its "what you get back" table](./data-endpoint.md#what-you-get-back)) and the column set becomes
the **union** across all included indicators — an indicator missing a particular measure gets
empty cells for it, not a dropped column. The single-indicator endpoint never has an `indicator`
column at all (redundant — it's the URL).

## `csvw` — CSV on the Web metadata

```
GET /api/v1/data/employment-rate.csvw
```

```json
{
	"@context": ["http://www.w3.org/ns/csvw", { "@language": "en" }],
	"url": "https://<host>/api/v1/data/employment-rate.csv",
	"notes": ["Metadata generated on <date> by the Explore Local Statistics service."],
	"dc:title": "Employment rate (Great Britain)",
	"dc:description": "This indicator shows the proportion of people aged between 16 and 64 years in paid work...",
	"dc:creator": "Office for National Statistics",
	"dc:publisher": "Office for National Statistics",
	"dc:issued": "2024-04-16",
	"tableSchema": {
		"columns": [
			{ "name": "areacd", "titles": "Area code", "datatype": "string" },
			{ "name": "areanm", "titles": "Area name", "datatype": "string" },
			{ "name": "period", "titles": "Time period", "datatype": "date" },
			{ "name": "value", "titles": "Observation value", "datatype": "number" },
			{ "name": "lci_95", "titles": "Lower confidence interval (95%)", "datatype": "number" },
			{ "name": "uci_95", "titles": "Upper confidence interval (95%)", "datatype": "number" }
		]
	}
}
```

[CSVW](https://csvw.org/)-compliant structural metadata describing the equivalent `.csv` request
(same query parameters, `.csv` in place of `.csvw`, same endpoint) — `url` is built directly from
the request that produced it, so it always points back at the exact filtered CSV that matches.
Not affected by `time`/`geo`/etc. beyond what's needed to build `url` — `tableSchema.columns`
describes the CSV's structure, not its data. Exempt from
[the "too much data" check](./data-endpoint.md#requests-that-get-rejected-as-too-large) since it
never touches observation data (the single-indicator endpoint has no such check to be exempt from
in the first place). **On the multiple-indicators endpoint**, the indicator-specific fields shown
above (`dc:title` etc.) are omitted entirely and an `indicator` column is described instead — the
single-indicator endpoint always has the indicator-specific fields and never the `indicator`
column.

## `xlsx` — accessible spreadsheet

```
GET /api/v1/data/employment-rate.xlsx?geo=E07000148
```

Returns a binary Excel workbook file. Cover sheet + table-of-contents sheet + notes sheet (if
any) + one data sheet per matched indicator (exactly one, on the single-indicator endpoint), each
marked up as a native Excel Table (not just styled cells) with named heading styles — built to
satisfy
[GOV.UK's accessible-spreadsheets guidance](https://analysisfunction.civilservice.gov.uk/policy-store/making-spreadsheets-accessible-a-brief-checklist-of-the-basics/).
Column content and layout mirror the `cols.json`/CSV data for the same request. This is the
format used by the "download data" links on indicator pages on the site itself.
