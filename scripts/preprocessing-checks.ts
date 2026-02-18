import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { DATA_DIR, skipDatasets } from './util/config';

// define incoming datasets
const newDatasets = readdirSync(DATA_DIR)
	.filter((item) => !item.includes('.') && !skipDatasets.includes(item))
	.filter(
		(item) =>
			existsSync(`${DATA_DIR}/${item}/${item}.csv`) &&
			existsSync(`${DATA_DIR}/${item}/${item}.csv-metadata.json`)
	);

// read in existing big metadata
// can add error here if this file is missing?
const existingMeta = JSON.parse(readFileSync('./src/lib/data/json-stat-metadata.json'));

const existingDatasets = [...new Set(existingMeta.link.item.map((d) => d.extension.dataset))];
const existingIndicators = [...new Set(existingMeta.link.item.map((d) => d.extension.code))];

if (existingDatasets.length !== newDatasets.length) {
	// don't think this needs to be an error
	// console log, or written to a logfile
	console.log('Number of incoming datasets does not match existing number of datasets');
}

console.log(
	'Comparing existing',
	existingDatasets.length,
	'datasets to',
	newDatasets.length,
	'new datasets...'
);

// loop through all new datasets and compare to existing metadata
const missingDatasets = [];
const editsData = [];
const editsMetadata = [];
const missingIndicators = [];
const newPeriods = [];

for (const ds of newDatasets) {
	// Dataset-level comparison

	// note datasets that are present in new but not in old (new datasets)
	//// do we care about existing datasets that aren't in the newly added???
	const existingDataset = existingMeta.link.item.filter((d) => d.extension.dataset === ds);
	if (!existingDataset.length) {
		missingDatasets.push(ds);
	} else {
		// read in timestamps for newly downloaded datasets:
		const timestampPath = `${DATA_DIR}/${ds}/timestamps.json`;
		const newTimestamps = JSON.parse(readFileSync(timestampPath, { encoding: 'utf-8' }));

		// compare timestamp paths for csvs
		if (newTimestamps.csvModified != existingDataset[0].extension.dataModified) {
			editsData.push(ds);
		}
		// compare timestamp paths for jsons
		if (newTimestamps.jsonModified != existingDataset[0].extension.metadataModified)
			editsMetadata.push(ds);

		// Indicator-level comparison
		const metaPath = `${DATA_DIR}/${ds}/${ds}.csv-metadata.json`;
		const newMeta = JSON.parse(readFileSync(metaPath, { encoding: 'utf-8' }));

		const newIndicators = [...new Set(newMeta.metadata.indicators.map((d) => d.code))];

		const existingIndicators = [...new Set(existingDataset.map((d) => d.extension.code))];

		for (const ind of newIndicators) {
			// check each new indicator exists in existingIndicators
			if (existingIndicators.includes(ind)) {
				// if so, filter existingDataset to the new indicator
				const existingIndicatorMetadata = existingDataset.filter((d) => d.extension.code === ind);
				const newIndicatorMetadata = newMeta.metadata.indicators.filter((d) => d.code === ind);
				// check min and max date values of incoming data - compare to existing timeDomain from metadata
				const existingIndicatorDomain = existingIndicatorMetadata[0].extension.periodDomain;
				const newIndicatorDomain = newIndicatorMetadata[0].periodDomain;

				if (
					existingIndicatorDomain[0] !== newIndicatorDomain[0] ||
					existingIndicatorDomain[1] !== newIndicatorDomain[1]
				) {
					console.log(
						'Incoming and existing period domains do not match for',
						ind,
						'. Run period generation script (npm run data:periods).'
					);
					newPeriods.push(ind);
				}
			} else {
				// 	if not, add it to a log array
				missingIndicators.push(ind);
			}
		}
	}
}

function section(title, items, message) {
	let out = '';
	out += '----------------------------------------\n';
	out += `${title}\n`;
	out += '----------------------------------------\n';
	if (items.length === 0) {
		out += '(none)\n\n';
		return out;
	}
	for (const item of items) {
		out += `- ${item}\n`;
	}
	out += `\nAction: ${message}\n`;

	out += '\n';
	return out;
}
export function writeUpdateLog(
	missingDatasets,
	missingIndicators,
	editsData,
	editsMetadata,
	newPeriods
) {
	let log = '';
	log += '----- Data update - inferred changes ------\n\n';
	log += `${new Date().toISOString()}\n\n`;
	log += section(
		'1. The below datasets are not already preset in the app:',
		missingDatasets,
		'Add relevant information to manifest_metadata.csv.'
	);
	log += section(
		'2. The below indicators are not already present in the app:',
		missingIndicators,
		'Add relevant information to manifest_metadata.csv.'
	);
	log += section('3. The data for the below indicators has been edited:', editsData, 'Validate.');
	log += section(
		'4. The metadata for the below indicators has been edited:',
		editsMetadata,
		'Validate.'
	);
	log += section(
		'5. The periodDomain for the below indicators has changed:',
		newPeriods,
		'Run period generation script: `npm run data:periods`'
	);
	log += '----------------------------------------\n';
	log += 'Fin.\n';
	log += '----------------------------------------\n';
	writeFileSync('./scripts/data-update-changelog.txt', log, 'utf-8');
}

writeUpdateLog(missingDatasets, missingIndicators, editsData, editsMetadata, newPeriods);
