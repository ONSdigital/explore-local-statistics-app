import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { csvParse } from 'd3-dsv';
import { DATA_DIR, skipDatasets } from './util/config';
import { stripBom, autoTypeWithoutDates } from './util/io';
import { itlsMap } from '../src/lib/config/geoLevels.ts';

const CONFIG_DIR = `scripts/config`;
const MANIFEST = `${CONFIG_DIR}/manifest_metadata.csv`;
const metadataJsonStatPath = './src/lib/data/json-stat-metadata.json';

// define incoming datasets
const newDatasets = readdirSync(DATA_DIR)
	.filter((item) => !item.includes('.') && !skipDatasets.includes(item))
	.filter(
		(item) =>
			existsSync(`${DATA_DIR}/${item}/${item}.csv`) &&
			existsSync(`${DATA_DIR}/${item}/${item}.csv-metadata.json`)
	);

// read in existing big metadata
if (!existsSync(metadataJsonStatPath))
	throw new Error('Existing JSON-stat metadata file not found. Cannot compare incoming data.');

const existingMeta = JSON.parse(readFileSync(metadataJsonStatPath));

// read in existing manifest_metadata (manually updated)
const manifest_metadata = csvParse(
	stripBom(readFileSync(MANIFEST, { encoding: 'utf-8' })),
	autoTypeWithoutDates
);

const existingDatasets = [...new Set(existingMeta.link.item.map((d) => d.extension.dataset))];

console.log(
	'Comparing',
	existingDatasets.length,
	'existing datasets to',
	newDatasets.length,
	'incoming datasets...'
);

// loop through all new datasets and compare to existing metadata
const missingDatasets = [];
const editsData = [];
const editsMetadata = [];
const missingIndicators = [];
const newPeriods = [];
const editsGeographies = [];

for (const ds of newDatasets) {
	// Dataset-level comparison

	// note datasets that are present in new but not in old (new datasets)
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

		// read in new metadata json
		const metaPath = `${DATA_DIR}/${ds}/${ds}.csv-metadata.json`;
		const newMeta = JSON.parse(readFileSync(metaPath, { encoding: 'utf-8' }));

		// compare geography codes:
		const newGeographyCodes = newMeta.metadata.geographyCodes;
		const existingGeographyCodes = Object.keys(existingDataset[0].dimension.areacd.category.index);
		const geographiesMatch =
			existingGeographyCodes.length === newGeographyCodes.length &&
			existingGeographyCodes.every((d) => newGeographyCodes.includes(d));

		if (!geographiesMatch) {
			const newCodes = newGeographyCodes.filter((d) => !existingGeographyCodes.includes(d));

			// don't count it as a change if all the "new" codes are just ITL ones that have been replaced in generate-data
			const geographiesMatchFinal = newCodes.every((d) => Object.keys(itlsMap).includes(d));

			if (!geographiesMatchFinal) {
				editsGeographies.push(ds);
			}
		}

		// Indicator-level comparison
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
					newPeriods.push(ind);
				}
			} else {
				// 	if not, add it to a log array
				missingIndicators.push(ind);
			}
		}
	}
}

// Filter missing indicators based on manifest_metadata
const excludedIndicators = [
	...new Set(manifest_metadata.filter((f) => !f.include).map((d) => d.code))
];
const missingIndicatorsFiltered = missingIndicators.filter((d) => !excludedIndicators.includes(d));

// should also consider search for completely excluded datasets and filtering missingDatasets to exclude these

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
		out += `${item}\n`;
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
	newPeriods,
	editsGeographies
) {
	let log = '';
	log += '----- Data update - inferred changes ------\n\n';
	log += `${new Date().toISOString()}\n\n`;
	log += section(
		'1. The below datasets are not already present in the app:',
		missingDatasets,
		'Add relevant information for each indicator therein to scripts/config/manifest_metadata.csv.'
	);
	log += section(
		'2. The below indicators are from existing datasets but are not present in the manifest:',
		missingIndicators,
		'Add relevant information on missing indicators to scripts/config/manifest_metadata.csv.'
	);
	log += section(
		'3. The data .csv for the below datasets has been edited:',
		editsData,
		'Validate.'
	);
	log += section(
		'4. The metadata .json for the below datasets has been edited:',
		editsMetadata,
		'Validate.'
	);
	log += section(
		'5. The periodDomain for the below indicators has changed:',
		newPeriods,
		'Validate.'
	);
	log += section(
		'5. The geography codes for the below indicators has changed:',
		editsGeographies,
		'Validate.'
	);
	log += '----------------------------------------\n';
	log += 'Fin.\n';
	log += '----------------------------------------\n';
	writeFileSync('./scripts/data-update-changelog.txt', log, 'utf-8');
}

writeUpdateLog(
	missingDatasets,
	missingIndicatorsFiltered,
	editsData,
	editsMetadata,
	newPeriods,
	editsGeographies
);
console.log('Log file written to ./scripts/data-update-changelog.txt');
