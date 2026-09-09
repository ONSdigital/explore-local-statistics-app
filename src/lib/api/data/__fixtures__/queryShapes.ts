// Representative request shapes for benchmarking the /api/v1/data.[format] pipeline
// (see `getFilteredData.bench.ts` and `filterIndicators.bench.ts`).
//
// These are modelled on how the app itself builds requests, not synthetic worst cases —
// keep them in sync with reality if the call sites below change:
//   - IndicatorChart.svelte / ChartDataLoader.svelte: charts always request `cols.json`,
//     for a single indicator, defaulting to the `ltla` geo group (see `makeDataUrl` in
//     `$lib/utils` and `getGeoLevel` fallback in IndicatorChart.svelte). This is the most
//     frequently hit shape in the app.
//   - BigNumber.svelte / IndicatorsCard.svelte: same, but for a single selected area.
//   - indicators/[code]/+page.svelte "Download data" links: `/api/v1/data.xlsx` and
//     `.csv`/`.csvw` for a single indicator with `time=all` and the default `geo=all`
//     (i.e. every geography level at once) — the broadest real request shape, and not
//     rejected by `isOversizedRequest` since it only has one "large" dimension (time).

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
// common shape hit by the app.
export const chartTimeSeriesBroadGeo = makeParams({
	format: 'cols.json',
	indicator,
	geo: 'ltla',
	time: 'all'
});

// A map/bar chart for the latest period only.
export const chartLatestBroadGeo = makeParams({
	format: 'cols.json',
	indicator,
	geo: 'ltla',
	time: 'latest'
});

// A single value for a single area - BigNumber.svelte / IndicatorsCard.svelte.
export const singleValueSingleArea = makeParams({
	format: 'cols.json',
	indicator,
	geo: 'E09000001', // City of London
	time: 'latest'
});

// The "download data" links on an indicator page: one indicator, every geography level,
// full time series. Includes `includeStatus`/`includeNames` defaults matching the real
// endpoint (see `+server.ts`).
export const downloadAllDataXLSX = makeParams({
	format: 'xlsx',
	indicator,
	time: 'all',
	includeStatus: true
});

export const downloadAllDataCSV = makeParams({
	...downloadAllDataXLSX,
	format: 'csv'
});
