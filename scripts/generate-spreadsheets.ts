import { readFileSync, writeFileSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import generateXLSX from '$lib/api/data/helpers/generateXLSX';
import generateCSV from '$lib/api/data/helpers/generateCSV';
import filterIndicators from '$lib/api/data/filterIndicators';
import filterDatasets from '$lib/api/data/filterDatasets';
import { geoCodesViz } from '$lib/config/geoLevels';

const execFileAsync = promisify(execFile);

const base_url = 'https://www.ons.gov.uk/explore-local-statistics';
const data_dir = './src/lib/data';
const cube_path = `${data_dir}/json-stat.json`;
const codes = [null, ...[...geoCodesViz].filter((cd) => cd[0] !== 'K')];

console.log(`Generating ${codes.length} XLSX spreadsheets and one CSV/W. May take a while...`);
console.log(`Reading ${cube_path}`);
const cube = JSON.parse(readFileSync(cube_path, { encoding: 'utf8' }));

for (const code of codes) {
	const path = `${data_dir}/all-datasets${code ? `-${code}` : ''}.xlsx`;
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

	const datasets = filterIndicators(cube.link.item, params);
	if (datasets.error) throw Error(datasets);

	// Apply filters to the data within the datasets and generate the selected output format
	const xlsx_data = filterDatasets(datasets, params);
	const xlsx = await generateXLSX(xlsx_data);
	writeFileSync(path, xlsx);
	console.log(`Wrote ${path}`);

	if (!code) {
		const csv_path = `${data_dir}/all-datasets.csv`;
		const csv_data = filterDatasets(datasets, { ...params, format: 'csv' });
		const csv = generateCSV(csv_data);
		writeFileSync(csv_path, csv);
		await execFileAsync('gzip', ['-f', csv_path]);
		console.log(`Wrote and gzipped ${csv_path}`);

		const csvw_path = `${data_dir}/all-datasets.csv-metadata.json`;
		const href = `${base_url}/files/all-datasets.csv`;
		const csvw = filterDatasets(datasets, { ...params, format: 'csvw', href });
		writeFileSync(csvw_path, JSON.stringify(csvw));
		console.log(`Wrote ${csvw_path}`);
	}
}
