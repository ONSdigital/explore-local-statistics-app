import filterDatasets from './filterDatasets';
import filterIndicators from './filterIndicators';
import generateCSV from './helpers/generateCSV';
import generateXLSX from './helpers/generateXLSX';
import readData from '$lib/data';
import { dataFormats } from '../config';
import { isValidDataFormat } from '$lib/util/validationHelpers';

const cube = await readData('json-stat');

// This is the parent function for the /api/v1/data endpoint
export default async function getFilteredData(params = {}) {
	if (!isValidDataFormat(params.format))
		return {
			error: 404,
			message: `Requested data format "${params.format}" not found. Only ${dataFormats.join(', ')} available.`
		};

	// Filter datasets by indicator, topic and included geographies
	let datasets = filterIndicators(cube.link.item, params);
	if (datasets.error) return datasets;

	// `params.singleIndicator` is only set by the item route (`/api/v1/data/{indicator}.
	// {format}`) - it names one specific resource, so an indicator that doesn't resolve to
	// any dataset here (unknown slug, or excluded entirely by `hasGeo`) is a 404, the same
	// way `/metadata/indicators/{indicator}` already treats both cases identically. The
	// collection route never sets this flag, so an empty match there just becomes an empty
	// collection further down, not an error.
	if (params.singleIndicator === true && datasets.length === 0)
		return { error: 404, message: `Indicator "${params.indicator}" not found.` };

	// Apply filters to the data within the datasets and generate the selected output format
	datasets = filterDatasets(datasets, params);
	if (datasets.error) return datasets;

	return params.format === 'csv'
		? { format: 'text', data: generateCSV(datasets) }
		: params.format === 'xlsx'
			? { format: 'xlsx', data: await generateXLSX(datasets) }
			: { format: 'json', data: datasets }; // For JSON-Stat, CSVW or other JSON formats
}
