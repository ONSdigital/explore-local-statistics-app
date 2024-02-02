import { readdir } from 'node:fs/promises';
import fs from 'fs';
import { median, mad } from './stats.ts';

import aq from 'arquero';
import ColumnTable from 'arquero/dist/types/table/column-table';
const { op } = aq;

const CSV_PREPROCESS_DIR = 'scripts/insights/raw/family-ess-main';
const FILE_NAMES_LOG = 'scripts/insights/raw/config-data/file-names-log.csv';
const AREAS_CSV = 'scripts/insights/raw/config-data/geography/areas.csv';
const PREVIOUS_INDICATORS_FILENAME =
	'scripts/insights/raw/config-data/indicators/indicators-lookup.csv';
const PREVIOUS_PERIODS_FILENAME =
	'scripts/insights/raw/config-data/periods/unique-periods-lookup.csv';
const AREAS_GEOG_LEVEL_FILENAME = 'scripts/insights/raw/config-data/geography/areas-geog-level.csv';
const INDICATORS_METADATA_CSV_FILENAME =
	'scripts/insights/raw/config-data/indicators/indicators-metadata.csv';
const TMP_CSV_DIR = 'scripts/insights/tmp-csv';
const EXCLUDED_INDICATORS_PATH = 'scripts/insights/raw/config-data/excluded-indicators.json';

const DEFAULT_VALUE_FIELD_NAME = 'value';

const COMBINED_DATA_COLUMN_NAMES = ['areacd', 'period', 'value', 'code', 'lci', 'uci'];

// TODO: check if it's okay to be missing ITL2 codes like TLM5
const AREA_CODE_MAP = {
	TLB: 'E92000001',
	TLC: 'E12000001',
	TLD: 'E12000002',
	TLE: 'E12000003',
	TLF: 'E12000004',
	TLG: 'E12000005',
	TLH: 'E12000006',
	TLI: 'E12000007',
	TLJ: 'E12000008',
	TLK: 'E12000009',
	TLL: 'W92000004',
	TLM: 'S92000003',
	TLN: 'N92000002'
};

const NEW_FILES_WARNING =
	`The script has been aborted because the list of file paths read in from ` +
	`the ${CSV_PREPROCESS_DIR} folder includes files which were not present when ` +
	`this script was last run. These file paths can be viewed in the ` +
	`previous-file-paths data frame. Please add these file paths to the ` +
	`file-names-log.csv file in the config-data folder and re-run.`;

const INDICATORS_LOOKUP_WARNING = `TODO: indicators-lookup warning.`;
const UNIQUE_PERIODS_LOOKUP_WARNING = `TODO: unique-periods-lookup warning.`;
const MULTIPLE_PERIODS_WARNING = `TODO: warning: multiple periods for one indicator.`;
const MISSING_METADATA_WARNING =
	'This script finished executing, but noted that one or more of the indicators does not currently have associated metadata. This means that the app will error when looking for direction on how to plot data for this indicator. The data frame indicators_without_metadata contains the list of these indicators. Please add the corresponding metadata to the indicators-metadata.csv file in the config-data/indicators folder.';

export default async function main() {
	const previous_file_paths = await loadCsvWithoutBom(FILE_NAMES_LOG);
	const areas_geog_level = await loadCsvWithoutBom(AREAS_GEOG_LEVEL_FILENAME);
	const excludedIndicators = JSON.parse(fs.readFileSync(EXCLUDED_INDICATORS_PATH).toString());

	const newFiles = await getListOfNewFiles(previous_file_paths);
	if (newFiles.length > 0) {
		console.log('New files:');
		console.log(newFiles);
		throw new Error(NEW_FILES_WARNING);
	}

	const file_paths = previous_file_paths.filter((f) => f.include === 'Y');

	let [combined_data, combined_metadata] = await processFiles(file_paths, excludedIndicators);

	const previous_indicators = await loadCsvWithoutBom(PREVIOUS_INDICATORS_FILENAME);
	const previous_periods = await loadCsvWithoutBom(PREVIOUS_PERIODS_FILENAME);

	abortIfNewIndicatorCodesExist(previous_indicators, combined_metadata);
	abortIfNewPeriodsExist(previous_periods, combined_data);

	const indicators = previous_indicators;
	const periods = previous_periods;

	abortIfMultiplePeriodGroupsForOneIndicator(combined_data, periods);

	combined_data = combined_data
		.join_left(periods.select('period', 'xDomainNumb'), ['period'])
		.select(aq.not('period'));

	const indicators_calculations = getIndicatorsCalculations(
		indicators,
		combined_data,
		areas_geog_level
	);

	combined_data = indicators
		.select('id', 'code')
		.join_left(combined_data, ['code'])
		.select(aq.not('code'));

	fs.writeFileSync(`${TMP_CSV_DIR}/combined-data.csv`, combined_data.toCSV());
	fs.writeFileSync(`${TMP_CSV_DIR}/indicators-lookup.csv`, indicators.toCSV());
	fs.writeFileSync(`${TMP_CSV_DIR}/indicators-calculations.csv`, indicators_calculations.toCSV());
	// write.csv(combined_data, "./csv/combined-data.csv", row.names = FALSE)
	// write.csv(indicators, "./config-data/indicators/indicators-lookup.csv", row.names = FALSE)
	// write.csv(indicators_calculations, "./config-data/indicators/indicators-calculations.csv", row.names = FALSE)

	await abortIfMissingMetadata(indicators_calculations);
}

function getIndicatorsCalculations(indicators: ColumnTable, combined_data, areas_geog_level) {
	const combined_data_with_geog_level = combined_data
		.join_left(areas_geog_level, ['areacd'])
		.select(aq.not('period'))
		.filter((d) => d.value !== null);

	const geog_levels = uniqueValuesInColumn(areas_geog_level, 'level').filter((d) => d !== 'other');

	const indicators_calculations: object[] = [];

	for (const indicator of indicators.objects()) {
		const indicator_data = combined_data_with_geog_level.filter(
			aq.escape((d) => d.code === indicator.code)
		);

		const indicatorPeriods = uniqueValuesInColumn(indicator_data, 'xDomainNumb');

		indicator.minXDomainNumb < -Math.min(...indicatorPeriods);
		indicator.maxXDomainNumb < -Math.max(...indicatorPeriods);

		for (const geogLevel of geog_levels) {
			const filteredIndicatorData = indicator_data.filter(aq.escape((d) => d.level === geogLevel));
			for (const period of indicatorPeriods) {
				const filteredIndicatorDataSinglePeriod = filteredIndicatorData.filter(
					aq.escape((d) => d.xDomainNumb === period)
				);

				const nRows = filteredIndicatorDataSinglePeriod.numRows();
				if (nRows > 1) {
					indicators_calculations.push({
						code: indicator.code,
						geog_level: geogLevel,
						period,
						med: median(filteredIndicatorDataSinglePeriod.array('value')),
						mad: mad(filteredIndicatorDataSinglePeriod.array('value'))
					});
				}
			}
		}
	}
	return aq.from(indicators_calculations);
}

function uniqueValuesInColumn(table: ColumnTable, columnName: string): any[] {
	return table.select(columnName).dedupe().array(columnName);
}

async function abortIfMissingMetadata(indicators_calculations) {
	const indicators_metadata_for_js = await loadCsvWithoutBom(INDICATORS_METADATA_CSV_FILENAME);

	const indicators_metadata_for_js_codes = indicators_metadata_for_js.array('code');
	for (const code of indicators_calculations.array('code')) {
		if (!indicators_metadata_for_js_codes.includes(code)) {
			throw new Error(MISSING_METADATA_WARNING);
		}
	}
}

function abortIfNewIndicatorCodesExist(previous_indicators, combined_metadata) {
	const prevIndicatorCodes = previous_indicators.array('code');
	const newIndicatorCodes = combined_metadata
		.array('code')
		.filter((code) => !prevIndicatorCodes.includes(code));
	if (newIndicatorCodes.length > 0) {
		console.log(newIndicatorCodes);
		throw new Error(INDICATORS_LOOKUP_WARNING);
	}
}

function abortIfNewPeriodsExist(previous_periods, combined_data) {
	const prevPeriods = previous_periods.array('period');
	const periods = combined_data.select('period').dedupe().array('period');
	const newPeriods = periods.filter((p) => !prevPeriods.includes(p));
	if (newPeriods.length > 0) {
		console.log(newPeriods);
		throw new Error(UNIQUE_PERIODS_LOOKUP_WARNING);
	}
}

function abortIfMultiplePeriodGroupsForOneIndicator(combined_data, periods) {
	// `periodToGroup` is an object with periods as keys and their corresponding group numbers as values
	const periodToGroup = Object.fromEntries(
		periods.objects().map(({ period, periodGroup }) => [period, periodGroup])
	);

	// For each indicator with code `code`, indicatorToPeriodGroup[code] will contain the periodGroup used
	// by that indicator. If an indicator uses multiple period groups, something isn't right and an error
	// will be thrown.
	const indicatorToPeriodGroup = {};
	for (const row of combined_data.objects()) {
		if (!(row.code in indicatorToPeriodGroup)) {
			indicatorToPeriodGroup[row.code] = periodToGroup[row.period];
		} else if (indicatorToPeriodGroup[row.code] !== periodToGroup[row.period]) {
			console.log(row);
			throw new Error(MULTIPLE_PERIODS_WARNING);
		}
	}
}

async function getListOfNewFiles(previous_file_paths) {
	let filenames = await readdir(CSV_PREPROCESS_DIR, { recursive: true });
	filenames = filenames.filter(
		(f) => f.endsWith('.csv') && !f.startsWith('out/') && !f.includes('_IDS')
	);

	const previous_filenames = previous_file_paths.array('filePath');

	const newFiles = [];
	for (const f of filenames) {
		if (!previous_filenames.includes(`${CSV_PREPROCESS_DIR}/${f}`)) {
			newFiles.push(f);
		}
	}

	return newFiles;
}

async function processFiles(file_paths, excludedIndicators: string[]) {
	const areas = await loadCsvWithoutBom(AREAS_CSV);
	const areaCodes = areas.array('areacd');

	let combined_data = aq.table(Object.fromEntries(COMBINED_DATA_COLUMN_NAMES.map((d) => [d, []])));
	let combined_metadata = aq.table({});

	console.log(`About to process ${file_paths.numRows()} files...`);

	for (const f of file_paths.objects()) {
		console.log(`Processing ${f.filePath}`);

		f.valueField ||= DEFAULT_VALUE_FIELD_NAME;

		const code = f.filePath.replace(/^.*[/]/, '').replace(/.csv$/, '');

		if (excludedIndicators.includes(code)) {
			console.log(`Skipping ${code}.`);
			continue;
		}

		[combined_data, combined_metadata] = await processFile(
			f,
			code,
			areaCodes,
			combined_data,
			combined_metadata
		);
	}
	fs.writeFileSync(`${TMP_CSV_DIR}/combined-data-js.csv`, combined_data.toCSV());
	fs.writeFileSync(`${TMP_CSV_DIR}/combined-metadata-js.csv`, combined_metadata.toCSV());

	return [combined_data, combined_metadata];
}

async function processFile(f, code, areaCodes, combined_data, combined_metadata) {
	// TODO: read period as string?
	let indicator_data = await loadIndicatorCsvWithoutBom(f.filePath);

	indicator_data = renameColumns(indicator_data, [
		{ old: 'lower confidence interval (95%)', new: 'lci' },
		{ old: 'upper confidence interval (95%)', new: 'uci' }
	]);
	indicator_data = indicator_data.rename({ [f.valueField]: 'value' });
	indicator_data = tidyAreaCodes(indicator_data, areaCodes);

	const metadata_columns = getMetadataColNames(indicator_data, f.multiIndicatorCategory);

	indicator_data = tmpFixForMissingVarName(indicator_data, code);

	// var fullCode = f.multiIndicatorCategory ? `${code}-${f.multiIndicatorCategory}` : code;
	indicator_data.params({ code, multiIndicatorCategory: f.multiIndicatorCategory });

	indicator_data = indicator_data.derive({
		code: aq.escape((d) =>
			f.multiIndicatorCategory ? `${code}-${d[f.multiIndicatorCategory]}` : code
		)
	});

	let indicator_metadata = indicator_data
		.select(...metadata_columns)
		.select(aq.not('areacd'))
		.derive({
			code: aq.escape((d) =>
				f.multiIndicatorCategory ? `${code}-${d[f.multiIndicatorCategory]}` : code
			)
		});

	if (f.multiIndicatorCategory) {
		indicator_metadata = indicator_metadata.select(aq.not(f.multiIndicatorCategory));
	}

	indicator_metadata = indicator_metadata.dedupe();

	indicator_data = indicator_data.select(
		...COMBINED_DATA_COLUMN_NAMES.filter((n) => indicator_data.columnNames().includes(n))
	);
	combined_data = combined_data.concat(indicator_data);

	for (const c of indicator_metadata.columnNames()) {
		if (!combined_metadata.columnNames().includes(c)) {
			combined_metadata = combined_metadata.derive({ [c]: (d) => null });
		}
	}
	combined_metadata = combined_metadata.concat(indicator_metadata);

	return [combined_data, combined_metadata];
}

function renameColumns(table, nameChanges) {
	const names = table.columnNames();
	const renameMap = {};
	for (const nc of nameChanges) {
		if (names.includes(nc.old)) {
			renameMap[nc.old] = nc.new;
		}
	}
	return table.rename(renameMap);
}

function tidyAreaCodes(indicator_data, areaCodes) {
	// convert codes like "TLB" to GSS codes
	const mapAreaCode = (areacd) => (areacd in AREA_CODE_MAP ? AREA_CODE_MAP[areacd] : areacd);
	indicator_data = indicator_data.derive({ areacd: aq.escape((d) => mapAreaCode(d.areacd)) });

	// only include areas that are in areas$areacd
	return indicator_data.filter(aq.escape((d) => op.includes(areaCodes, d.areacd)));
}

function getMetadataColNames(indicator_data, multiIndicatorCategory) {
	const metadata_columns = ['areacd', 'unit', 'polarity', 'variable name', 'indicator'];
	if (multiIndicatorCategory && !metadata_columns.includes(multiIndicatorCategory)) {
		metadata_columns.push(multiIndicatorCategory);
	}
	return metadata_columns.filter((c) => indicator_data.columnNames().includes(c));
}

function tmpFixForMissingVarName(indicator_data, code) {
	// bespoke code because some of the Northern Ireland areas accidentally have the variable name
	// left blank - hopefully will be able to remove for a future release
	if (code === 'gross-median-weekly-pay') {
		return indicator_data.derive({
			'variable name': (d) => d['variable name'] || 'Gross median weekly pay'
		});
	}

	return indicator_data;
}

async function loadCsvWithoutBom(filename: string) {
	const table = await aq.loadCSV(filename, {});
	return table.rename(Object.fromEntries(table.columnNames().map((n) => [n, stripBom(n)])));
}

async function loadIndicatorCsvWithoutBom(filename: string) {
	let rawJson = fs.readFileSync(filename).toString();

	// Make column names lowercase. It would be nicer to do this after parsing the CSV, but
	// in order to ask Arquero to parse the `period` column as strings I think we need
	// to do the renaming before parsing.
	const rows = rawJson.split('\n');
	rows[0] = stripBom(rows[0].toLowerCase());
	rawJson = rows.join('\n');

	return aq.fromCSV(rawJson, { parse: { period: String } });
}

function stripBom(string: string): string {
	// Based on:
	// https://github.com/sindresorhus/strip-bom/blob/main/index.js
	// (MIT Licence)

	// Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
	// conversion translates it to FEFF (UTF-16 BOM).
	if (string.charCodeAt(0) === 0xfeff) {
		return string.slice(1);
	}

	return string;
}
