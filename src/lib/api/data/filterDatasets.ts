import { filterTime, filterTimeForGeo, makeFilter } from './helpers/dataFilters';
import makeGeoFilter from './helpers/makeGeoFilter';
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
			if (params.hasGeo !== 'any')
				// If "hasGeo" param is applied. Only years with the requested geography are included
				dim.values = filterTimeForGeo(cube, dim.values, params.hasGeo);

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

	// A genuinely empty `measure` dimension (always the last dim - see `toCols`/`toRows`/
	// `toJSONStat`, which all assume this) means there's no `value` column left to emit at
	// all - nothing sensible to format, so this dataset is excluded entirely. Any other dim
	// (geo, time, ...) filtering to zero values is a normal "filters matched no
	// observations" result, not a reason to exclude the dataset - `toJSONStat`/`dimsToCols`
	// already degrade to a correctly-empty (not wrong) output for that case.
	if (dims[dims.length - 1].values.length === 0) return null;

	// Generate the filtered dataset in the requested format
	if (format === 'xlsx') {
		const data = toCols(
			cube,
			dims,
			params.includeNames,
			params.includeStatus && Object.keys(cube.status).length > 0,
			false
		);
		return data ? { data, meta: getSpreadsheetMetadata(cube, dims) } : null;
	}
	if (format === 'csv')
		return toRows(cube, dims, !singleIndicator, params.includeNames, params.includeStatus);
	if (format.slice(0, 4) === 'cols')
		return toCols(cube, dims, params.includeNames, params.includeStatus);
	if (format.slice(0, 4) === 'rows')
		return toRows(cube, dims, false, params.includeNames, params.includeStatus);
	return toJSONStat(cube, dims, params.includeNames, params.includeStatus);
}

// Filter and format the data within an array of JSON-Stat datasets. `params.singleIndicator`
// is an explicit flag set by the caller (the item route `/api/v1/data/{indicator}.{format}`
// sets it `true`; the collection route `/api/v1/data.{format}` never sets it, so it's always
// `false` there) - it's no longer inferred from whether `indicator`/`topic` happen to resolve
// to exactly one indicator, so the collection route is unconditionally collection-shaped
// regardless of how many indicators actually match.
export default function filterDatasets(datasets: jsonStatDataset[], params: parsedParams) {
	const singleIndicator = params.singleIndicator === true;

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
			(filter.values !== 'all' || params.geoCluster !== 'all' || params.geoExtent !== 'all')
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

	// An empty result on the collection route is a valid empty collection, not an error -
	// `filtered` just flows through to the collection shape below. On the item route,
	// `getFilteredData.ts` already 404s before this function runs if the indicator itself
	// couldn't be resolved, so the only way to still land here with nothing is a filter that
	// leaves no measure to report at all (e.g. an unrecognised `measure=` value) - there's no
	// sensible empty shape to build for that (no `value` column exists to be empty), so it's
	// still a `400` rather than a fabricated empty item.
	if (!filtered.length && singleIndicator)
		return { error: 400, message: 'No data available for the selected filters.' };
	if (format === 'csv') return filtered.map((f) => f[1]);
	if (format === 'xlsx') return filtered;

	if (['rows', 'cols'].includes(format.slice(0, 4)))
		return singleIndicator ? filtered[0][1] : Object.fromEntries(filtered);
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
