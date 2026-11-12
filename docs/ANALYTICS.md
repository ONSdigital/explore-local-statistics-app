# Analytics events

Every analytics event is sent through `analyticsEvent()` from `@onsvisual/svelte-components`, which
pushes it to the Google Tag Manager data layer. The tag manager container (`GTM-MBCBVQS`) is loaded,
with the cookie banner, by `<AnalyticsBanner>` in `src/routes/(app)/+layout.svelte`, with the
library's automatic page views turned off (`pageViewEnabled={false}`) so the app can send its own.

Events are sent from:

- `src/routes/(app)/+layout.svelte`: page views.
- `src/lib/utils.ts`: the shared wrappers `downloadEvent()` and `areaSelectEvent()`.
- Components that call `analyticsEvent()` directly: `ChartActions.svelte`, `Modal.svelte`,
  `OptionsModal.svelte`, `AreasModal.svelte`, `areas/[code]/indicators/+page.svelte` and
  `src/routes/+error.svelte`.

Where an event carries `areaType`, it is the label of the area's geography type, looked up from the
first three characters of its code in `geoLevelsAllLookup` (`src/lib/config/geoLevels.ts`), for
example `"Lower tier/unitary authority"`. A postcode sends `"postcode"`.

The values below are examples. Known inconsistencies are listed [at the end](#known-quirks).

## `pageView`

**Page view.** Sent after every navigation, including the first page load, from `afterNavigate` in
`(app)/+layout.svelte`. Pages under `/indicators/[code]/embed` use the root layout only, so embedded
charts send no page views.

```js
{
	event: "pageView",
	pageUrl: "https://www.ons.gov.uk/explore-local-statistics/areas/E07000178-oxford",
	product: "explore-local-statistics",
	contentTitle: "Oxford (E07000178) - ONS",
	contentType: "explore-local-statistics",
	contentSubType: "areas",
	// Area pages only:
	areaCode: "E07000178",
	areaName: "Oxford",
	areaType: "Lower tier/unitary authority"
}
```

`contentTitle` and `contentSubType` come from the `title` and `pageType` that each page's `load`
function returns. The possible `contentSubType` values are:

| `contentSubType` | Pages                                          |
| ---------------- | ---------------------------------------------- |
| `els-home`       | `/`                                            |
| `els-search`     | `/areas/search`                                |
| `areas`          | `/areas/[code]` and `/areas/[code]/indicators` |
| `indicators`     | `/indicators` and `/indicators/[code]`         |

On `areas` pages the event also carries `areaCode`, `areaName` and `areaType`. On a single
indicator's page (`/indicators/[code]`) it carries the indicator instead:

```js
{
	// ...as above, plus:
	outputSeries: "population-count", // indicator slug
	contentGroup: "population",       // topic
	contentSubgroup: "population"     // sub-topic
}
```

## `interaction`

### `search-select`

**Area search selection.** The user picks an area or postcode from an area search box.

On the home page and area pages (via `areaSelectEvent()`):

```js
{
	event: "interaction",
	interactionType: "search-select",
	interactionValue: "area search select",
	areaCode: "E07000178",
	areaName: "Oxford",
	areaType: "Lower tier/unitary authority"
}
```

On `/areas/[code]/indicators` (sent directly), `"area search select"` is sent as
`interactionLabel` instead of `interactionValue`.

### `map-click-select`

**Area map selection.** The user clicks an area on the navigation map on an area page (via
`areaSelectEvent()`).

```js
{
	event: "interaction",
	interactionType: "map-click-select",
	interactionValue: "area map select",
	areaCode: "E07000178",
	areaName: "Oxford",
	areaType: "Lower tier/unitary authority"
}
```

### `modal-toggle`

**Modal opened or closed.** Sent by `Modal.svelte` for both modals ("Change areas" and "Chart
options").

```js
{
	event: "interaction",
	interactionType: "modal-toggle",
	interactionLabel: "Chart options", // the modal's button label
	interactionValue: "open"           // "open", "confirm" or "cancel"
}
```

### `modal-select`

**Choice in the "Change areas" modal** (`AreasModal.svelte`). Sent when an area is added:

```js
{
	event: "interaction",
	interactionType: "modal-select",
	interactionLabel: "area modal select",
	areaCode: "E07000178",
	areaName: "Oxford",
	areaType: "Lower tier/unitary authority"
}
```

And when the geography type or group is changed:

```js
{
	event: "interaction",
	interactionType: "modal-select",
	interactionLabel: "area type modal select",
	interactionValue: "Lower tier/unitary authorities", // the option's label
	areaType: "ltla"                                    // the option's id
}
```

### `range-slider`

**Time range changed** in the "Chart options" modal (`OptionsModal.svelte`).

```js
{
	event: "interaction",
	interactionType: "range-slider",
	interactionLabel: "select time period",
	interactionValue: "2015 to 2024"
}
```

### `checkbox`

**Confidence intervals switched on or off** in the "Chart options" modal.

```js
{
	event: "interaction",
	interactionType: "checkbox",
	interactionLabel: "show confidence intervals",
	interactionValue: "enable" // or "disable"
}
```

## `fileDownload`

**File download.** Sent by `downloadEvent()` when a download link is clicked, or after a chart is
saved as PNG.

```js
{
	event: "fileDownload",
	fileExtension: "csv",
	filename: "population-count.csv",
	linkText: "Download data as CSV",
	linkDomain: "www.ons.gov.uk",
	linkURL: "/api/v1/data/population-count.csv?time=all", // not sent for PNG
	// Chart downloads only:
	chartType: "line",
	chartTitle: "Total population"
}
```

`filename` is `{indicator slug}.{format}`, or `all-datasets.{format}` for the "download all"
links. `fileExtension` is one of `xlsx`, `csv`, `csvw`, `json` or `png`.

| Where                                      | Downloads                                                                         | Chart fields |
| ------------------------------------------ | --------------------------------------------------------------------------------- | ------------ |
| Home page                                  | All datasets: XLSX, CSV, CSVW, JSON-Stat                                          | no           |
| `/areas/[code]/indicators`                 | All datasets for this area type (XLSX); all datasets (XLSX, CSV, CSVW, JSON-Stat) | no           |
| `/areas/[code]/indicators`, each indicator | That chart's data: CSV, CSVW, XLSX                                                | yes          |
| `/indicators/[code]`                       | This indicator (XLSX, CSV, CSVW), all datasets (XLSX, JSON-Stat)                  | no           |
| Any chart's "Use and share" panel          | That chart's data (CSV, CSVW, XLSX), and PNG                                      | yes          |

## `embed`

**Embed code copied** from a chart's "Use and share" panel (`ChartActions.svelte`).

```js
{
	event: "embed",
	pageUrl: "https://www.ons.gov.uk/explore-local-statistics/indicators/population-count/embed?type=line&...",
	chartTitle: "Total population",
	chartType: "line"
}
```

## Error page

`src/routes/+error.svelte` sends this when any error page is shown (not only 404s):

```js
{
	product: "explore-local-statistics",
	contentType: "404-pages",
	countentGroup: "404-pages"
}
```

## Known quirks

These are how the code behaves today. Fixing them would change the data analysts receive, so they
are listed in [ROADMAP.md](./ROADMAP.md) to agree with them first, not changed here.

- The error-page event has no `event` field, misspells `contentGroup` as `countentGroup`, and says
  `404-pages` for every kind of error.
- `"area search select"` is sent as `interactionValue` on most pages but as `interactionLabel` on
  `/areas/[code]/indicators`.
- In the geography-type `modal-select` event, `areaType` holds the option's id (`ltla`) rather than a
  label, unlike every other event.
- `interactionType` values mix naming styles: some describe the action (`search-select`,
  `modal-select`), others the widget (`range-slider`, `checkbox`).
- `linkURL` is sometimes the full path including the base path (`/explore-local-statistics/...`),
  and sometimes the path without it, depending on whether the link's `href` was passed through
  `resolve()` first.
- The area-type XLSX link (for example `all-datasets-E07.xlsx`) reports `filename` as
  `all-datasets.xlsx`. Downloads from a chart's "Use and share" panel report `{slug}.{format}`,
  while the file the browser saves is named `{slug}-{chartType}.{format}`.
