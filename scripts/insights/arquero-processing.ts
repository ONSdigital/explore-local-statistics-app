import fs from 'fs';
import { median, mad } from './stats.ts';
import aq from 'arquero';
import ColumnTable from 'arquero/dist/types/table/column-table';
import { loadCsvWithoutBom, readJsonSync } from './io.ts';
import {
	abortIfMissingMetadata,
	abortIfNewIndicatorCodesExist,
	abortIfNewPeriodsExist,
	abortIfMultiplePeriodGroupsForOneIndicator,
	abortIfNewFilesExist
} from './data-processing-warnings.ts';
import { checkedJoin } from './table-utils.ts';
import CONFIG from './config.ts';
import { abortIfAnyAreaHasUnrecognisedPrefix } from './data-processing-warnings.ts';

export default async function main() {
	const nodeVersion = process.version
		.slice(1)
		.split('.')
		.map((d) => +d);
	if (nodeVersion[0] < 20 || (nodeVersion[0] === 20 && nodeVersion[1] < 1)) {
		throw new Error('A more recent node version is needed for recursive directory readdir.');
	}

	const previous_file_paths = loadCsvWithoutBom(CONFIG.FILE_NAMES_LOG);
	const areas_geog_level = loadCsvWithoutBom(CONFIG.AREAS_GEOG_LEVEL_FILENAME);
	const excludedIndicators = readJsonSync(CONFIG.EXCLUDED_INDICATORS_PATH);

	await abortIfNewFilesExist(previous_file_paths, CONFIG.CSV_PREPROCESS_DIR);

	const file_paths = previous_file_paths.filter((f) => f.include === 'Y');

	let [combined_data, combined_metadata] = processFiles(
		file_paths,
		excludedIndicators,
		areas_geog_level
	);

	const previousIndicators = loadCsvWithoutBom(CONFIG.PREVIOUS_INDICATORS_FILENAME);
	const periods = loadCsvWithoutBom(CONFIG.PREVIOUS_PERIODS_FILENAME);

	abortIfNewIndicatorCodesExist(previousIndicators, combined_metadata);
	abortIfNewPeriodsExist(periods, combined_data);
	abortIfMultiplePeriodGroupsForOneIndicator(combined_data, periods);

	combined_data = checkedJoin(combined_data, periods.select('period', 'xDomainNumb'), 'period', {
		expectAllOnLeft: false
	}).select(aq.not('period'));

	combined_data = combined_data.dedupe('xDomainNumb', 'code', 'areacd');

	const [indicators, indicators_calculations, _oldStyleIndicatorsCalculations] =
		getIndicatorsCalculations(previousIndicators, combined_data, areas_geog_level);

	combined_data = checkedJoin(indicators.select('id', 'code'), combined_data, 'code');

	fs.writeFileSync(`${CONFIG.CSV_DIR}/indicators-lookup.csv`, indicators.toCSV());

	const indicators_metadata_for_js = loadCsvWithoutBom(CONFIG.INDICATORS_METADATA_CSV);
	abortIfMissingMetadata(indicators_calculations, indicators_metadata_for_js);

	return [combined_data, indicators, indicators_calculations, _oldStyleIndicatorsCalculations];
}

function getIndicatorsCalculations(indicators: ColumnTable, combined_data, areas_geog_level) {
	const combined_data_with_geog_level = checkedJoin(
		combined_data.derive({
			areacd_prefix: (d) => aq.op.substring(d.areacd, 0, 3)
		}),
		areas_geog_level,
		'areacd_prefix'
	)
		.select(aq.not('areacd_prefix', 'period'))
		.filter((d) => d.value !== null);

	const geog_levels = uniqueValuesInColumn(areas_geog_level, 'level').filter((d) => d !== 'other');

	const indicatorsObjects: any[] = indicators.objects();
	const indicators_calculations: object[] = [];
	const _oldStyleIndicatorsCalculations: object[] = [];

	for (const indicator of indicatorsObjects) {
		const indicator_data = combined_data_with_geog_level.filter(
			aq.escape((d) => d.code === indicator.code)
		);

		const indicatorPeriods = uniqueValuesInColumn(indicator_data, 'xDomainNumb');

		indicator.minXDomainNumb = Math.min(...indicatorPeriods);
		indicator.maxXDomainNumb = Math.max(...indicatorPeriods);

		for (const period of indicatorPeriods) {
			const filteredIndicatorDataSinglePeriod = indicator_data.filter(
				aq.escape((d) => d.xDomainNumb === period)
			);

			const allCalcsForIndicatorAndPeriod: {
				code: string;
				period: number;
				calcsByGeogLevel: object;
			} = {
				code: indicator.code,
				period,
				calcsByGeogLevel: {}
			};

			for (const geogLevel of geog_levels) {
				const filteredIndicatorDataSingleGeog = filteredIndicatorDataSinglePeriod.filter(
					aq.escape((d) => d.level === geogLevel)
				);

				if (filteredIndicatorDataSingleGeog.numRows() > 1) {
					const values = filteredIndicatorDataSingleGeog.array('value');
					allCalcsForIndicatorAndPeriod.calcsByGeogLevel[geogLevel] = {
						med: median(values),
						mad: mad(values),
						min: Math.min(...values),
						max: Math.max(...values),
						count: values.length
					};
					_oldStyleIndicatorsCalculations.push({
						code: indicator.code,
						geog_level: geogLevel,
						period,
						med: median(values),
						mad: mad(values),
						min: Math.min(...values),
						max: Math.max(...values),
						count: values.length
					});
				}
			}

			indicators_calculations.push(allCalcsForIndicatorAndPeriod);
		}
	}
	return [aq.from(indicatorsObjects), indicators_calculations, _oldStyleIndicatorsCalculations];
}

function processFiles(file_paths, excludedIndicators: string[], areas_geog_level: ColumnTable) {
	const areas = loadCsvWithoutBom(CONFIG.AREAS_CSV);
	const areaCodes = new Set(areas.array('areacd'));
	abortIfAnyAreaHasUnrecognisedPrefix(areaCodes, areas_geog_level.array('areacd_prefix'));

	let combined_data = aq.table(
		Object.fromEntries(CONFIG.COMBINED_DATA_COLUMN_NAMES.map((d) => [d, []]))
	);
	let combined_metadata = aq.table({});

	// Keep track of area codes that appear in the data but that we don't have listed in the metadata.
	const unknownAreaCodes = new Set();

	for (const f of file_paths.objects()) {
		const code = f.filePath.replace(/^.*[/]/, '').replace(/.csv$/, '');

		if (!excludedIndicators.includes(code)) {
			[combined_data, combined_metadata] = processFile(
				f,
				code,
				areaCodes,
				areas_geog_level,
				combined_data,
				combined_metadata,
				unknownAreaCodes
			);
		}
	}

	if (unknownAreaCodes.size > 0) {
		console.warn(
			`Warning: there were ${unknownAreaCodes.size} unknown area codes: ${[...unknownAreaCodes].join(', ')}`
		);
	}

	return [combined_data, combined_metadata];
}

function processFile(
	f,
	code,
	areaCodes,
	areas_geog_level,
	combined_data,
	combined_metadata,
	unknownAreaCodes
) {
	let indicator_data = loadCsvWithoutBom(f.filePath);
	indicator_data = indicator_data.rename(
		Object.fromEntries(indicator_data.columnNames().map((n) => [n, n.toLowerCase()]))
	);

	indicator_data = renameColumns(indicator_data, [
		{ old: 'lower confidence interval (95%)', new: 'lci' },
		{ old: 'upper confidence interval (95%)', new: 'uci' },
		{ old: 'lower_confidence_interval_95', new: 'lci' },
		{ old: 'upper_confidence_interval_95', new: 'uci' }
	]);

	if (f.valueField) {
		indicator_data = indicator_data.rename({
			[f.valueField]: 'value'
		});
	} else if (indicator_data.columnNames().includes(CONFIG.DEFAULT_VALUE_FIELD_NAME)) {
		indicator_data = indicator_data.rename({
			[CONFIG.DEFAULT_VALUE_FIELD_NAME]: 'value'
		});
	} else if (!indicator_data.columnNames().includes('value')) {
		throw new Error(`"value" field is unexpectedly missing in data for code ${code}!`);
	}

	indicator_data = tidyAreaCodes(indicator_data, areaCodes, areas_geog_level, unknownAreaCodes);

	const metadata_columns = getMetadataColNames(indicator_data, f.multiIndicatorCategory);

	indicator_data = tmpFixForMissingVarName(indicator_data, code);

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

function uniqueValuesInColumn(table: ColumnTable, columnName: string): any[] {
	return table.select(columnName).dedupe().array(columnName);
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

function tidyAreaCodes(indicator_data, areaCodes, areas_geog_level, unknownAreaCodes) {
	// convert codes like "TLB" to GSS codes
	const mapAreaCode = (areacd) =>
		areacd in CONFIG.AREA_CODE_MAP ? CONFIG.AREA_CODE_MAP[areacd] : areacd;
	indicator_data = indicator_data.derive({ areacd: aq.escape((d) => mapAreaCode(d.areacd)) });

	// only include areas that are in areas$areacd
	indicator_data = indicator_data.derive({
		areacd_prefix: (d) => aq.op.substring(d.areacd, 0, 3)
	});

	const validAreacdPrefixes = new Set(areas_geog_level.array('areacd_prefix'));
	for (const row of indicator_data.objects()) {
		const areacd_prefix = row.areacd.substring(0, 3);
		if (!areaCodes.has(row.areacd) && validAreacdPrefixes.has(areacd_prefix)) {
			unknownAreaCodes.add(row.areacd);
		}
	}

	indicator_data = indicator_data
		.filter(aq.escape((d) => areaCodes.has(d.areacd)))
		.select(aq.not('areacd_prefix'));

	return indicator_data;
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
