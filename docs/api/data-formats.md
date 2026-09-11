# Data output formats

The six `{format}` values available on [the data endpoint](./data-endpoint.md), with full
worked examples. All examples below are for the same request family — indicator
`employment-rate`, area `E07000148` (Norwich) — so you can compare the same underlying data
across formats. See [data-endpoint.md](./data-endpoint.md#response-shape-single-indicator-vs-collection)
for how these shapes change for a multi-indicator request.

## `json` — JSON-Stat

```
GET /api/v1/data.json?indicator=employment-rate&geo=E07000148
```
```json
{
  "version": "2.0",
  "class": "dataset",
  "label": "Employment rate (Great Britain)",
  "note": ["Calculation of employment rate: ..."],
  "source": "Office for National Statistics",
  "updated": "2024-04-16",
  "extension": { "topic": "economy", "subTopic": "employment", "...": "full indicator metadata, same shape as /metadata/indicators/{indicator}" },
  "id": ["areacd", "period", "measure"],
  "size": [1, 1, 3],
  "role": { "geo": ["areacd"], "time": ["period"] },
  "dimension": {
    "areacd": { "label": "Area code", "category": { "index": { "E07000148": 0 }, "label": { "E07000148": "Norwich" } } },
    "period": { "label": "Time period", "category": { "index": { "2023-01-01/P1Y": 0 } } },
    "measure": { "label": "Measure", "category": { "index": { "value": 0, "lci_95": 1, "uci_95": 2 }, "label": { "value": "Observation value", "lci_95": "Lower confidence interval (95%)", "uci_95": "Upper confidence interval (95%)" } } }
  },
  "status": {},
  "value": [82.7, 75, 90.4]
}
```

The [JSON-Stat 2.0](https://json-stat.org/) cube format: `size` gives each dimension's cardinality
(in `id` order), `dimension.<key>.category.index` maps each category value to its position, and
`value` is a flat array in row-major order over all dimensions — so `value[i]` for a given
`measure` position is found by `areacd_index * (period_count * measure_count) + period_index *
measure_count + measure_index`. This is the richest format (full dimension metadata, indicator
`extension` metadata inline) and the most space-efficient one for genuinely multi-dimensional
data, but the least convenient to consume directly — most consumers want `cols.json`/`rows.json`
instead unless they specifically need dimension metadata alongside the data.

## `cols.json` — column-oriented JSON

```
GET /api/v1/data.cols.json?indicator=employment-rate&geo=E07000148&time=all
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
One array per field, all the same length, index-aligned — `areacd[i]`/`period[i]`/`value[i]` all
describe the same observation. This is the format every chart in the app itself actually requests
(see the root `CLAUDE.md`'s performance notes) — it's compact (no repeated keys per row) and
trivial to feed straight into a charting library that wants columnar series data.

## `rows.json` — row-oriented JSON

```
GET /api/v1/data.rows.json?indicator=employment-rate&geo=E07000148
```
```json
[
  { "areacd": "E07000148", "areanm": "Norwich", "period": "2023-01-01/P1Y", "value": 82.7, "lci_95": 75, "uci_95": 90.4 }
]
```
Each observation as its own object — the most conventional shape for feeding into a dataframe
library or a generic JSON→table tool, at the cost of repeating every key on every row. For a
single-indicator request this is exactly `cols.json`'s data "transposed" row by row (same
fields, same values, same order).

## `csv` — plain-text CSV

```
GET /api/v1/data.csv?indicator=employment-rate&geo=E07000148&time=2020,2023
```
```csv
areacd,areanm,period,value,lci_95,uci_95
E07000148,Norwich,2020-01-01/P1Y,79,71.6,86.4
E07000148,Norwich,2021-01-01/P1Y,84.3,78.3,90.3
E07000148,Norwich,2022-01-01/P1Y,81.5,74.5,88.5
E07000148,Norwich,2023-01-01/P1Y,82.7,75,90.4
```
Standard comma-separated, header row included, `"`-quoted only where a value actually contains a
`"`, comma or line break. Column order is `areacd`, `areanm` (if `includeNames`), then remaining
non-`value`/`status` dimension columns, then `value`, then any other measures, then `status` (if
`includeStatus`) last. For a multi-indicator request, an `indicator` column is prepended (see
[data-endpoint.md](./data-endpoint.md#response-shape-single-indicator-vs-collection)) and the
column set becomes the **union** across all included indicators — an indicator missing a
particular measure gets empty cells for it, not a dropped column.

## `csvw` — CSV on the Web metadata

```
GET /api/v1/data.csvw?indicator=employment-rate
```
```json
{
  "@context": ["http://www.w3.org/ns/csvw", { "@language": "en" }],
  "url": "https://<host>/api/v1/data.csv?indicator=employment-rate",
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
(same query parameters, `.csv` in place of `.csvw`) — `url` is built directly from the request
that produced it, so it always points back at the exact filtered CSV that matches. Not affected
by `time`/`geo`/etc. beyond what's needed to build `url` and (for a single indicator) the Dublin
Core description fields — `tableSchema.columns` describes the CSV's structure, not its data.
Exempt from [the oversized-request check](./data-endpoint.md#requests-that-get-rejected-as-too-large)
since it never touches observation data. For a multi-indicator request, the Dublin Core fields
(`dc:title` etc.) are omitted and an `indicator` column is described instead, with an `aboutUrl`
pointing at `/metadata/indicators` filtered to match the request.

## `xlsx` — accessible spreadsheet

```
GET /api/v1/data.xlsx?indicator=employment-rate&geo=E07000148
```
Returns `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and a
binary XLSX workbook body — streamed, not buffered (see the root `CLAUDE.md`'s performance notes
for the streaming implementation details, which don't affect the format or content, only how the
bytes are delivered). One sheet per indicator in the request, plus a table-of-contents sheet and
a notes sheet, each marked up as a native Excel Table (not just styled cells) with named heading
styles — built to satisfy
[GOV.UK's accessible-spreadsheets guidance](https://analysisfunction.civilservice.gov.uk/policy-store/making-spreadsheets-accessible-a-brief-checklist-of-the-basics/).
Column content and layout mirror the `cols.json`/CSV data for the same request. This is the
format used by the "download data" links on indicator pages in the app itself.
