import { filterTime, filterTimeForGeo, makeFilter, makeGeoFilter } from './helpers/dataFilters';
import { toJSONStat, toRows, toCols } from './helpers/dataFormatters';
import { getSpreadsheetMetadata } from './helpers/generateXLSX';
import generateCSVW from './helpers/generateCSVW';
import { isValidDate } from '$lib/util/validationHelpers';
import summaryData from '$lib/data/json-stat-summary.json';

// Filter and format a single JSON-Stat dataset based on selected filters/parameters
export function filterJSONStat(
	cube: jsonStatDataset,
	filters: dimensionFilters,
	params: parsedParams,
	format: dataFormat,
	singleIndicator: boolean
) {
	const dims: filteredDimension[] = [];

	// Filter on each dimension in sequence
	for (let i = 0; i < cube.id.length; i++) {
		const key = cube.id[i];
		const dimension = cube.dimension[key];
		const dim = {
			key: key,
			count: cube.size[i],
			values: Object.entries(dimension.category.index)
		};
		const filter = filters[key];
		if (filter && cube.role.time.includes(dim.key)) {
			if (filters.hasGeo)
				// If "hasGeo" param is applied. Only years with the requested geography are included
				dim.values = filterTimeForGeo(cube, dim.values, filters.hasGeo);

			// Time filtering depends on the time period format and range for the specific indicator
			dim.values = filterTime(dim.values, {
				time: filter,
				nearest: params.timeNearest
			});
		} else if (filter) {
			// Non-time dimension filters can be applied the same way to any indicator
			dim.values = dim.values.filter(filter);
		}
		dims.push(dim);
	}

	// Calculate the number of values/observations in the filtered dataset
	const length = dims.map((dim) => dim.values.length).reduce((a, b) => a * b, 1);
	if (length === 0) return null;

	// Generate the filtered dataset in the requested format
	if (format === 'xlsx') {
		const data = toCols(
			cube,
			dims,
			params.includeNames,
			params.includeStatus && Object.keys(cube.status).length > 0,
			false,
			false
		);
		return data ? { data, meta: getSpreadsheetMetadata(cube, dims) } : null;
	}
	if (format === 'csv')
		return toRows(cube, dims, !singleIndicator, params.includeNames, params.includeStatus);
	if (format.slice(0, 4) === 'cols')
		return toCols(cube, dims, params.includeNames, params.includeStatus, params.groupByArea);
	if (format.slice(0, 4) === 'rows')
		return toRows(cube, dims, false, params.includeNames, params.includeStatus, params.groupByArea);
	return toJSONStat(cube, dims, params.includeNames, params.includeStatus);
}

// Filter and format the data within an array of JSON-Stat datasets
export default function filterDatasets(datasets: jsonStatDataset[], params: parsedParams) {
	// Check if request is for a single indicator
	const singleIndicator =
		params.topic === 'all' && params.indicator !== 'all' && [params.indicator].flat().length === 1;

	const format: dataFormat = params.format || 'json';

	// Return only CSVW metadata, if requested
	if (format === 'csvw') {
		return generateCSVW(
			datasets,
			params.measure,
			params.href,
			singleIndicator,
			params.includeNames,
			params.includeStatus
		);
	}

	// Create filters
	const filters: dimensionFilters = {};

	// Create filters for each dimensions
	for (const filter of [
		{ key: 'areacd', values: params.geo },
		{ key: 'period', values: params.time },
		{ key: 'measure', values: params.measure },
		...params.dimFilters
	]) {
		if (
			summaryData.geoDims.includes(filter.key) &&
			(filter.values !== 'all' || params.geoCluster !== 'all')
		)
			// Create geo filter
			filters[filter.key] = makeGeoFilter(filter.values, params.geoExtent, params.geoCluster);
		else if (summaryData.timeDims.includes(filter.key) && filter.values !== 'all') {
			// Create time filter
			if (
				[filter.values]
					.flat()
					.map((t) => isValidDate(t))
					.includes(false)
			)
				return { error: 400, message: 'Invalid time period requested.' };
			filters[filter.key] = params.time;
		} else if (filter.values !== 'all') {
			// Create filter for any standard dimension
			filters[filter.key] = makeFilter(filter.values);
		}
	}

	const filtered = [];
	for (const cube of datasets) {
		const data = filterJSONStat(cube, filters, params, format, singleIndicator);
		if (data) filtered.push(data);
	}

	if (!filtered?.length)
		return { error: 200, message: 'No data available for the selected filters.' };
	if (format === 'csv') return filtered.map((f) => f[1]);
	if (format === 'xlsx') return filtered;

	if (['rows', 'cols'].includes(format.slice(0, 4)))
		return singleIndicator && filtered.length === 1 ? filtered[0][1] : Object.fromEntries(filtered);
	return singleIndicator
		? filtered[0]
		: {
				version: '2.0',
				class: 'collection',
				label: 'ONS Explore Local Statistics API response',
				// updated: cube.updated,
				link: { item: filtered }
			};
}
