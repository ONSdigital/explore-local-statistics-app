import fs from 'fs';
import { median, mad } from './stats.ts';
import aq from 'arquero';
import ColumnTable from 'arquero/dist/types/table/column-table';
import { loadCsvWithoutBom, loadIndicatorCsvWithoutBom, readJsonSync } from './io.ts';
import { abortIfMissingMetadata } from './data-processing-warnings.ts';
import {
	abortIfNewIndicatorCodesExist,
	abortIfNewPeriodsExist,
	abortIfMultiplePeriodGroupsForOneIndicator
} from './data-processing-warnings.ts';
import { abortIfNewFilesExist } from './data-processing-warnings.ts';
import CONFIG from './config.ts';

export default async function main() {
	const previous_file_paths = await loadCsvWithoutBom(CONFIG.FILE_NAMES_LOG);
	const areas_geog_level = await loadCsvWithoutBom(CONFIG.AREAS_GEOG_LEVEL_FILENAME);
	const excludedIndicators = readJsonSync(CONFIG.EXCLUDED_INDICATORS_PATH);

	await abortIfNewFilesExist(previous_file_paths, CONFIG.CSV_PREPROCESS_DIR);

	const file_paths = previous_file_paths.filter((f) => f.include === 'Y');

	let [combined_data, combined_metadata] = await processFiles(file_paths, excludedIndicators);

	const previous_indicators = await loadCsvWithoutBom(CONFIG.PREVIOUS_INDICATORS_FILENAME);
	const previous_periods = await loadCsvWithoutBom(CONFIG.PREVIOUS_PERIODS_FILENAME);

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

	fs.writeFileSync(`${CONFIG.TMP_CSV_DIR}/combined-data.csv`, combined_data.toCSV());
	fs.writeFileSync(`${CONFIG.TMP_CSV_DIR}/indicators-lookup.csv`, indicators.toCSV());
	fs.writeFileSync(
		`${CONFIG.TMP_CSV_DIR}/indicators-calculations.csv`,
		indicators_calculations.toCSV()
	);
	// write.csv(combined_data, "./csv/combined-data.csv", row.names = FALSE)
	// write.csv(indicators, "./config-data/indicators/indicators-lookup.csv", row.names = FALSE)
	// write.csv(indicators_calculations, "./config-data/indicators/indicators-calculations.csv", row.names = FALSE)

	const indicators_metadata_for_js = await loadCsvWithoutBom(CONFIG.INDICATORS_METADATA_CSV);
	abortIfMissingMetadata(indicators_calculations, indicators_metadata_for_js);
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

				if (filteredIndicatorDataSinglePeriod.numRows() > 1) {
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

async function processFiles(file_paths, excludedIndicators: string[]) {
	const areas = await loadCsvWithoutBom(CONFIG.AREAS_CSV);
	const areaCodes = areas.array('areacd');

	let combined_data = aq.table(
		Object.fromEntries(CONFIG.COMBINED_DATA_COLUMN_NAMES.map((d) => [d, []]))
	);
	let combined_metadata = aq.table({});

	console.log(`About to process ${file_paths.numRows()} files...`);

	for (const f of file_paths.objects()) {
		console.log(`Processing ${f.filePath}`);

		f.valueField ||= CONFIG.DEFAULT_VALUE_FIELD_NAME;

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
	fs.writeFileSync(`${CONFIG.TMP_CSV_DIR}/combined-data-js.csv`, combined_data.toCSV());
	fs.writeFileSync(`${CONFIG.TMP_CSV_DIR}/combined-metadata-js.csv`, combined_metadata.toCSV());

	return [combined_data, combined_metadata];
}

async function processFile(f, code, areaCodes, combined_data, combined_metadata) {
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
		...CONFIG.COMBINED_DATA_COLUMN_NAMES.filter((n) => indicator_data.columnNames().includes(n))
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
	const mapAreaCode = (areacd) =>
		areacd in CONFIG.AREA_CODE_MAP ? CONFIG.AREA_CODE_MAP[areacd] : areacd;
	indicator_data = indicator_data.derive({ areacd: aq.escape((d) => mapAreaCode(d.areacd)) });

	// only include areas that are in areas$areacd
	return indicator_data.filter(aq.escape((d) => aq.op.includes(areaCodes, d.areacd)));
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
