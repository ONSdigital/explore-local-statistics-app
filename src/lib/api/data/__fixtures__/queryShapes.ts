// Representative request shapes for benchmarking the /api/v1/data.[format] and
// /api/v1/data/[indicator].[format] pipelines (see `getFilteredData.bench.ts` and
// `filterIndicators.bench.ts`).
//
// These are modelled on how the app itself builds requests, not synthetic worst cases —
// keep them in sync with reality if the call sites below change. `makeDataUrl` (`$lib/utils`)
// routes a plain-string `indicator` to the item route and an array to the collection route
// (see docs/api/) - `singleIndicator: true` on a fixture below mirrors what the item route's
// `+server.ts` always sets, matching every call site that now hits it:
//   - IndicatorChart.svelte / ChartDataLoader.svelte: charts always request `cols.json`,
//     for a single indicator, defaulting to the `ltla` geo group (see `makeDataUrl` in
//     `$lib/utils` and `getGeoLevel` fallback in IndicatorChart.svelte). This is the most
//     frequently hit shape in the app.
//   - BigNumber.svelte: same, but for a single selected area.
//   - IndicatorsCard.svelte: the one call site that passes an array (two indicators) and so
//     stays on the collection route - see `multiIndicatorSingleArea` below.
//   - indicators/[code]/+page.svelte "Download data" links: `/api/v1/data/{indicator}.xlsx`
//     and `.csv`/`.csvw` for one indicator with `time=all` and the default `geo=all` (i.e.
//     every geography level at once) — the broadest real request shape, and not rejected by
//     `isOversizedRequest` since the item route never calls it at all (see gotchas.md).

const indicator = 'population-count';

const defaults: parsedParams = {
	format: 'json',
	topic: 'all',
	indicator: 'all',
	excludeMultivariate: false,
	geo: 'all',
	geoExtent: 'all',
	geoCluster: 'all',
	hasGeo: 'any',
	time: 'latest',
	timeNearest: 'none',
	measure: 'all',
	includeNames: true,
	includeStatus: false,
	dimFilters: [],
	href: 'https://www.ons.gov.uk/explore-local-statistics/api/v1/data'
};

function makeParams(overrides: Partial<parsedParams>): parsedParams {
	return { ...defaults, ...overrides } as parsedParams;
}

// A line/table chart's full time series for a broad geography group - the single most
// common shape hit by the app. Item route (see file header).
export const chartTimeSeriesBroadGeo = makeParams({
	format: 'cols.json',
	indicator,
	singleIndicator: true,
	geo: 'ltla',
	time: 'all'
});

// A map/bar chart for the latest period only. Item route.
export const chartLatestBroadGeo = makeParams({
	format: 'cols.json',
	indicator,
	singleIndicator: true,
	geo: 'ltla',
	time: 'latest'
});

// A single value for a single area - BigNumber.svelte. Item route.
export const singleValueSingleArea = makeParams({
	format: 'cols.json',
	indicator,
	singleIndicator: true,
	geo: 'E09000001', // City of London
	time: 'latest'
});

// IndicatorsCard.svelte: two named indicators, one area, `topic: 'all'` - takes
// `filterIndicators.ts`'s fast path (direct lookup per slug) same as the single-indicator
// shapes above, but stays on the collection route since `indicator` is an array.
export const multiIndicatorSingleArea = makeParams({
	format: 'cols.json',
	indicator: ['population-count', 'median-age'],
	geo: 'E09000001', // City of London
	time: 'latest'
});

// The "download data" links on an indicator page: one indicator, every geography level,
// full time series. Includes `includeStatus`/`includeNames` defaults matching the real
// endpoint (see `+server.ts`). Item route.
export const downloadAllDataXLSX = makeParams({
	format: 'xlsx',
	indicator,
	singleIndicator: true,
	time: 'all',
	includeStatus: true
});

export const downloadAllDataCSV = makeParams({
	...downloadAllDataXLSX,
	format: 'csv'
});
