import { readFileSync, writeFileSync } from 'fs';
import generateXLSX from '$lib/api/data/helpers/generateXLSX';
import filterIndicators from '$lib/api/data/filterIndicators';
import filterDatasets from '$lib/api/data/filterDatasets';
import { geoCodesViz } from '$lib/config/geoLevels';

const cube_path = './src/lib/data/json-stat.json';
const codes = [null, ...[...geoCodesViz].filter((cd) => cd[0] !== 'K')];

console.log(`Generating ${codes.length} XLSX spreadsheets. May take a while...`);
console.log(`Reading ${cube_path}`);
const cube = JSON.parse(readFileSync(cube_path, { encoding: 'utf8' }));

for (const code of codes) {
	const path = `./src/lib/data/all-datasets${code ? `-${code}` : ''}.xlsx`;
	const params = {
		format: 'xlsx',
		topic: 'all',
		indicator: 'all',
		excludeMultivariate: false,
		geo: 'all',
		geoExtent: 'all',
		geoCluster: 'all',
		hasGeo: code || 'any',
		time: 'all',
		timeNearest: 'none',
		measure: 'all',
		includeNames: true,
		includeStatus: true,
		dimFilters: []
	};

	let datasets = filterIndicators(cube.link.item, params);

	// Apply filters to the data within the datasets and generate the selected output format
	datasets = filterDatasets(datasets, params);
	if (datasets.error) throw Error(datasets);

	const xlsx_data = await generateXLSX(datasets);
	writeFileSync(path, xlsx_data);
	console.log(`Wrote ${path}`);
}
