import * as aq from 'arquero';
import fs, { readFileSync, writeFileSync } from 'fs';
import { descending } from 'd3-array';
import { loadCsvWithoutBom, readJsonSync, readCsvAutoType } from './io.ts';
import {
	abortIfMissingMetadata,
	abortIfNewIndicatorCodesExist,
	abortIfNewPeriodsExist,
	abortIfMultiplePeriodGroupsForOneIndicator,
	abortIfNewFilesExist
} from './data-processing-warnings.ts';
import { table } from 'console';
import { parse } from 'path';

// config.ts
const RAW_DATA_DIR = 'scripts/raw-data';
const CONFIG_DIR = `scripts/config`;
const MANIFEST = `${CONFIG_DIR}/manifest_metadata.csv`; // equivalent to FILE_NAMES_LOG

export default async function main() {
	// ensure correct version of node
	const nodeVersion = process.version
		.slice(1)
		.split('.')
		.map((d) => +d);
	if (nodeVersion[0] < 20 || (nodeVersion[0] === 20 && nodeVersion[1] < 1)) {
		throw new Error('A more recent node version is needed for recursive directory readdir.');
	}
}

function getIndex(row, id, size, dimension, reverseLookup) {
	const coords = [];
	for (const key of id) {
		if (reverseLookup[key])
			coords.push(dimension[key].category.index[reverseLookup[key][row[key]]]);
		else coords.push(dimension[key].category.index[row[key]]);
	}
	let index = 0;
	for (let i = 0; i < coords.length; i++) {
		index = index * size[i] + coords[i];
	}
	return index;
}
function getDimRole(datasets, key: string) {
	const dims = new Set();
	for (const ds of datasets) {
		const vals = ds?.role?.[key] || [];
		for (const val of vals) dims.add(val);
	}
	return Array.from(dims);
}
function processColumns(k, metaLookup, columnValues, id, size, role, dimension) {
	const row = metaLookup.filter(aq.escape((d) => d.name === k)).objects()[0];
	const values = columnValues[k];
	id.push(k);
	size.push(values.length);

	dimension[k] = { label: k === 'measure' ? 'Measure' : row.titles[row.titles.length - 1] };

	// add slugified labels for age and sex
	if (['age', 'sex'].includes(k)) {
		const keys = values.map((d) => d.toLowerCase().replace(/(?<=\d)\sto\s(?=\d)/g, '-'));

		dimension[k].category = {
			index: Object.fromEntries(keys.map((d, i) => [d, i])),
			label: Object.fromEntries(values.map((d, i) => [keys[i], d]))
		};
	} else {
		const entries = values.map((d, i) => [d, i]);
		dimension[k].category = { index: Object.fromEntries(entries) };
	}

	// if it is 'measure' get the names for measure from the metadata
	if (k === 'measure') {
		const lookup = new Map(
			metaLookup.objects().map((d) => [d.name, d.titles[d.titles.length - 1]])
		);
		dimension[k].category.label = Object.fromEntries(values.map((d) => [d, lookup.get(d)]));
	}
	// if role metadata exists (currently just areacd and period), add it
	// row doesn't always exist for measure, as it isn't always in the tableSchema
	if (row && row.role) {
		if (!role[row.role]) role[row.role] = [];
		role[row.role].push(k);
	}
	return { id, size, role, dimension };
}
function indicatorToCube(indicator, t, meta_data, tableSchema, dataset_name) {
	console.log('Processing', indicator, '........');
	console.log({ dataset_name });
	// filter file-level metadata to be indicator level
	const meta_indicator = meta_data.metadata.indicators.find((d) => d.code === indicator);
	const manifest_metadata_indicator = manifest_metadata
		.filter(aq.escape((d) => d.dataset === dataset_name && d.code === indicator))
		.objects();
	if (!manifest_metadata_indicator[0]) {
		console.log(
			`Skipping indicator ${indicator} in dataset ${dataset_name}. No metadata in manifest.`
		);
		return null;
	}

	// deconstruct meta_indicator (and remove slug as using slug from csv):
	const { label, caveats, longDescription, slug, ...restOfMetadata } = meta_indicator;

	const dataset = {
		version: '2.0',
		class: 'dataset',
		label: label,
		note: [caveats].filter((n) => n),
		source: meta_data['dc:publisher'],
		updated: meta_data['dc:issued'],
		extension: {
			topic: manifest_metadata_indicator[0].topic,
			subTopic: manifest_metadata_indicator[0].subTopic,
			description: longDescription,
			source: meta_data.metadata.source,
			slug: manifest_metadata_indicator[0].slug,
			...restOfMetadata,
			experimentalStatistic: meta_data.metadata.experimentalStatistic,
			geography: meta_data.metadata.geography
		}
	};

	let indicatorTable = t
		// drop indicator because we don't need it as a column:
		.select(aq.not('indicator'));

	// identify columns of type measure using metadata:
	let measures = tableSchema.filter((d) => d.type === 'measure').map((d) => d.name);

	// identify empty measures to remove (e.g. if lci and uci columns are present but all empty):
	let emptyMeasures = measures.filter((d) =>
		indicatorTable.array(d).every((v) => v == null || Number.isNaN(v))
	);

	// Identify non-standard dimension columns
	let dimensions = tableSchema
		.filter((d) => d.type === 'dimension' && !['areacd', 'period'].includes(d.name))
		.map((d) => d.name);

	// identify dimensions that only have a single value (and can therefore be skipped):
	let uniDimensions = dimensions.filter((d) => indicatorTable.dedupe(d).numRows() === 1);

	indicatorTable = indicatorTable.select(aq.not(uniDimensions));

	let indicatorTableLong = indicatorTable
		.select(aq.not(emptyMeasures))
		// pivot longer - measures to single column, values etc. to values - retain status:
		.fold(
			measures.filter((d) => !emptyMeasures.includes(d)),
			{ as: ['measure', 'value-temp'] }
		)
		.rename({ 'value-temp': 'value' });

	// identify columns of type dimension using tableschema metadata
	// and exclude areacd and period as we want to ensure those are specified first
	let otherDimensions = tableSchema
		.filter((d) => d.type === 'dimension')
		.map((d) => d.name)
		.filter((d) => !['areacd', 'period'].includes(d) && indicatorTable.columnNames().includes(d));

	// sort by each dimension (including the newly made measure, which is a dimension)
	// age is numbers as strings, so needs sorting properly

	indicatorTableLong = indicatorTableLong.orderby(
		...['areacd', 'period', ...otherDimensions, 'measure'].map((col) =>
			aq.collate(col, 'en-GB', { numeric: true })
		)
	);

	// get unique values of all columns in order they appear
	const columnValues = Object.fromEntries(
		indicatorTableLong.columnNames().map((c) => [c, [...new Set(indicatorTableLong.array(c))]])
	);

	// use to construct id, size, role + dimension
	const id = [];
	const size = [];
	const role = {};
	const dimension = {};

	const metaLookup = aq.from(tableSchema);

	const keys = Object.keys(columnValues).filter((k) => k !== 'value' && k !== 'status');
	for (const k of keys) {
		processColumns(k, metaLookup, columnValues, id, size, role, dimension);
	}

	// Lookup for dimensions where their cell values are different to their keys
	const dimensionReverseLookups = {};
	for (const key of Object.keys(dimension).filter(
		(key) => key !== 'measure' && dimension[key].category.label
	)) {
		dimensionReverseLookups[key] = Object.fromEntries(
			Object.entries(dimension[key].category.label).map((l) => l.reverse())
		);
	}

	const valuesLength = size.reduce((a, b) => a * b, 1);
	const value = new Array(valuesLength).fill(null);
	const status = {};

	for (const row of indicatorTableLong) {
		const i = getIndex(row, id, size, dimension, dimensionReverseLookups);
		value[i] = row.value;
		if (row.status) {
			status[i] = row.status;
		}
	}

	return { ...dataset, id, size, role, dimension, value, status };
}
function processFile(file) {
	const data_file = file.replace(`${RAW_DATA_DIR}`, '');
	if (!fs.existsSync(`${RAW_DATA_DIR}${data_file}`))
		console.log(`Cannot find data file ${data_file}`);
	let indicator_data = loadCsvWithoutBom(`${RAW_DATA_DIR}${data_file}`);
	const meta_data = JSON.parse(
		fs.readFileSync(`${RAW_DATA_DIR}${data_file.replace('.csv', '.csv-metadata.json')}`)
	);
	const tableSchema = meta_data.tableSchema.columns;
	const dataset_name = data_file.split('/')[1];

	// get unique areas and their names
	const areaColsMap = Object.fromEntries(
		['AREACD', 'AREANM']
			.filter((col) => indicator_data.columnNames().includes(col))
			.map((col) => [col, col.toLocaleLowerCase()])
	);
	const uniqueAreas = indicator_data
		.rename(areaColsMap)
		.select(['areacd', 'areanm'])
		.dedupe('areacd');

	// get the column titles of those columns we want to suppress
	const suppressedCols = tableSchema.filter((d) => d.suppressOutput).map((d) => d.titles[0]);

	//  rename the columns in data using the information in tableschema
	// (name is the target title, the first value of titles is the existing column name in the csv)
	const varNames = Object.fromEntries(
		tableSchema
			.filter((d) => !suppressedCols.includes(d.titles[0])) // remove columns we are deselecting from this
			.map((d) => [d.titles[0], d.name])
	);

	indicator_data = indicator_data
		// drop unused columns using metadata suppressOutput:
		.select(aq.not(suppressedCols))
		.rename(varNames);

	// split table into one table per indicator
	let indicatorTables = [...new Set(indicator_data.array('indicator'))].map((ind) => ({
		key: ind,
		data: indicator_data.filter(aq.escape((d) => d.indicator === ind))
	}));
	const indicatorsList = indicatorTables.map((ind) => ind.key);
	console.log(
		'There are ',
		indicatorsList.length,
		'indicator(s) present in data file: ',
		indicatorsList
	);

	// Filter out indicators that are not present in the manifest
	const includedIndicators = manifest_metadata
		.filter(aq.escape((d) => d.dataset === dataset_name))
		.array('code');
	if (indicatorsList.length !== includedIndicators.length) {
		const skippedIndicators = indicatorsList.filter((key) => !includedIndicators.includes(key));
		console.log(
			'Skipping ',
			skippedIndicators.length,
			'indicator(s) not present in manifest: ',
			skippedIndicators
		);
		indicatorTables = indicatorTables.filter((table) => includedIndicators.includes(table.key));
	}

	// define new array for formatted datasets
	const indicatorDatasets = [];
	// loop through each indicator (when more than one)
	for (const table of indicatorTables) {
		const cube = indicatorToCube(table.key, table.data, meta_data, tableSchema, dataset_name);
		if (cube) indicatorDatasets.push(cube);
	}

	return { indicatorDatasets, uniqueAreas };
}

const manifest_metadata = loadCsvWithoutBom(MANIFEST);
const indicator_slugs = manifest_metadata
	// .filter((f) => f.include)
	.array('slug');

// Throw error if new indicator files have been downloaded and need to be added to the manifest
// await abortIfNewFilesExist(manifest_metadata, CSV_PREPROCESS_DIR)

// remove indicators based on boolean in manifest
// extract distinct filepaths
var file_paths = [
	...new Set(
		manifest_metadata
			// .filter((f) => f.include)
			.array('dataset')
	)
].map((code) => `${RAW_DATA_DIR}/${code}/${code}.csv`);

const cube = {
	version: '2.0',
	class: 'collection',
	label: 'ELS datasets',
	link: {}
};

const indicators = [];
const areas = [];
for (const file of file_paths) {
	const { indicatorDatasets, uniqueAreas } = processFile(file);
	indicators.push(...indicatorDatasets);
	areas.push(uniqueAreas);
}
cube.updated = indicators.map((ind) => ind.updated).sort(descending)[0];

// Sort indicators to match order in manifest (ie. taxonomy order)
cube.link = {
	item: indicator_slugs.map((slug) => indicators.find((ind) => ind.extension.slug === slug))
};

const output = './src/lib/data/json-stat.json';
writeFileSync(output, JSON.stringify(cube));
console.log(`Wrote ${output}.`);

const metadataOutput = './src/lib/data/json-stat-metadata.json';
cube.link.item = cube.link.item.map((item) => {
	item.value = [];
	delete item.status;
	return item;
});
writeFileSync(metadataOutput, JSON.stringify(cube));
console.log(`Wrote ${metadataOutput}.`);

// Create name lookup for areas that exist in the data
const areasInData = areas[0].concat(areas.slice(1)).dedupe('areacd').orderby('areacd').objects();
// Import primary area metadata lookup as source of truth for areas that exist in both places
const geoMetadataInput = './src/lib/data/geo-metadata.json';
const geoMetadata = JSON.parse(readFileSync(geoMetadataInput));
// Create the code -> name lookup and write it to disk
const areasInDataLookup = {};
for (const area of areasInData)
	areasInDataLookup[area.areacd] = geoMetadata?.[area.areacd]?.areanm || area.areanm;
const areasInDataOutput = './src/lib/data/areas-in-data.json';
writeFileSync(areasInDataOutput, JSON.stringify(areasInDataLookup));
console.log(`Wrote ${areasInDataOutput}.`);

// Generate JSON file with summary stats/data
const summaryData = {
	lastUpdate: cube.updated,
	datasetCount: cube.link.item.length,
	univariateCount: cube.link.item.filter((ds) => !ds.extension.isMultivariate).length,
	topics: Array.from(new Set(cube.link.item.map((ds) => ds.extension.topic))).map((t) => ({
		slug: t.replaceAll(' ', '-'),
		label: t[0].toUpperCase() + t.slice(1)
	})),
	years: Array.from(
		new Set(
			cube.link.item
				.map((ds) => Object.keys(ds.dimension.period.category.index).map((val) => +val.slice(0, 4)))
				.flat()
		)
	).sort((a, b) => a - b),
	geoYears: Array.from(new Set(cube.link.item.map((ds) => ds.extension.geography.year))).sort(
		(a, b) => a - b
	),
	geoDims: getDimRole(cube.link.item, 'geo'),
	timeDims: getDimRole(cube.link.item, 'time')
};

const summaryOutput = './src/lib/data/json-stat-summary.json';
writeFileSync(summaryOutput, JSON.stringify(summaryData));
console.log(`Wrote ${summaryOutput}.`);
