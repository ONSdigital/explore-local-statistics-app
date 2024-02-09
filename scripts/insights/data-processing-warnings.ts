import CONFIG from './config.ts';

import { readdir } from 'fs/promises';

const INDICATORS_LOOKUP_WARNING = `TODO: indicators-lookup warning.`;
const UNIQUE_PERIODS_LOOKUP_WARNING = `TODO: unique-periods-lookup warning.`;
const MULTIPLE_PERIODS_WARNING = `TODO: warning: multiple periods for one indicator.`;
const MISSING_METADATA_WARNING =
	'This script finished executing, but noted that one or more of the indicators does not currently have associated metadata. This means that the app will error when looking for direction on how to plot data for this indicator. The data frame indicators_without_metadata contains the list of these indicators. Please add the corresponding metadata to the indicators-metadata.csv file in the config-data/indicators folder.';

export function abortIfMissingMetadata(indicators_calculations, indicators_metadata_for_js) {
	const indicators_metadata_for_js_codes = indicators_metadata_for_js.array('code');
	for (const code of indicators_calculations.array('code')) {
		if (!indicators_metadata_for_js_codes.includes(code)) {
			throw new Error(MISSING_METADATA_WARNING);
		}
	}
}
export function abortIfNewIndicatorCodesExist(previous_indicators, combined_metadata) {
	const prevIndicatorCodes = previous_indicators.array('code');
	const newIndicatorCodes = combined_metadata
		.array('code')
		.filter((code) => !prevIndicatorCodes.includes(code));
	if (newIndicatorCodes.length > 0) {
		console.log(newIndicatorCodes);
		throw new Error(INDICATORS_LOOKUP_WARNING);
	}
}
export function abortIfNewPeriodsExist(previous_periods, combined_data) {
	const prevPeriods = previous_periods.array('period');
	const periods = combined_data.select('period').dedupe().array('period');
	const newPeriods = periods.filter((p) => !prevPeriods.includes(p));
	if (newPeriods.length > 0) {
		console.log(newPeriods);
		throw new Error(UNIQUE_PERIODS_LOOKUP_WARNING);
	}
}
export function abortIfMultiplePeriodGroupsForOneIndicator(combined_data, periods) {
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
export async function abortIfNewFilesExist(previous_file_paths, csv_preprocess_dir) {
	let filenames = await readdir(csv_preprocess_dir, { recursive: true });
	filenames = filenames.filter(
		(f) => f.endsWith('.csv') && !f.startsWith('out/') && !f.includes('_IDS')
	);

	const previous_filenames = previous_file_paths.array('filePath');

	const newFiles = [];
	for (const f of filenames) {
		if (!previous_filenames.includes(`${csv_preprocess_dir}/${f}`)) {
			newFiles.push(f);
		}
	}

	if (newFiles.length > 0) {
		console.log('New files:');
		console.log(newFiles);
		throw new Error(CONFIG.NEW_FILES_WARNING);
	}
}
