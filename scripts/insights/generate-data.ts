import { writeFileSync } from 'fs';
import arqueroProcessing from './arquero-processing.js';
import { readCsvAutoType } from './io.ts';

const RAW_DIR = 'scripts/insights/raw';
const COOKED_DIR = 'scripts/insights/cooked';
const CONFIG_DIR = `${RAW_DIR}/config-data`;
const CSV_DIR = `${COOKED_DIR}/csv`;

const DATA_OUTPUT_PATH = `static/insights/data.json`;
const COLUMN_ORIENTED_DATA_OUTPUT_PATH = `static/insights/column-oriented-data.json`;
const CONFIG_OUTPUT_PATH = `static/insights/config.json`;

await arqueroProcessing();

main();

function main() {
	const data = readDataFromCsvs();
	const config = readConfigFromCsvs();

	const outData = generateOutData(data, config.indicators);
	writeFileSync(
		DATA_OUTPUT_PATH,
		JSON.stringify({
			combinedDataObject: outData.combinedDataObject,
			beeswarmKeyData: outData.beeswarmKeyData
		})
	);
	console.log(`Insights data JSON file has been generated at: ${DATA_OUTPUT_PATH}`);
	writeFileSync(
		COLUMN_ORIENTED_DATA_OUTPUT_PATH,
		JSON.stringify({
			combinedDataObjectColumnOriented: outData.combinedDataObjectColumnOriented,
			beeswarmKeyData: outData.beeswarmKeyData
		})
	);
	console.log(
		`Insights data JSON file in experimental column-oriented format has been generated at: ${COLUMN_ORIENTED_DATA_OUTPUT_PATH}`
	);

	const outConfig = generateOutConfig(config);
	writeFileSync(CONFIG_OUTPUT_PATH, JSON.stringify(outConfig));
	console.log(`Insights config JSON file has been generated at: ${CONFIG_OUTPUT_PATH}`);
}

function generateOutData(data, indicatorsArray) {
	const combinedDataArray = [...data.combinedData].sort((a, b) => b.xDomainNumb - a.xDomainNumb);

	const combinedDataObject = {};
	for (const indicator of indicatorsArray) {
		combinedDataObject[indicator.code] = combinedDataArray.filter((e) => e.id === indicator.id);
	}

	// combinedDataObjectColumnOriented is an experimental version that stores
	// an array for each column to save space.
	const combinedDataObjectColumnOriented = createCombinedDataObjectColumnOriented(
		indicatorsArray,
		combinedDataArray
	);

	return {
		combinedDataObject,
		combinedDataObjectColumnOriented,
		beeswarmKeyData: data.beeswarmKeyData
	};
}

function createCombinedDataObjectColumnOriented(indicatorsArray: any, combinedDataArray: any[]) {
	const combinedDataObjectColumnOriented = {};
	for (const indicator of indicatorsArray) {
		const rows = combinedDataArray.filter((e) => e.id === indicator.id);
		if (rows.length === 0) {
			throw new Error('Unexpectedly empty `rows` array.');
		}
		const dataByColumn = {};
		for (const columnName in rows[0]) {
			if (Object.getOwnPropertyDescriptor(rows[0], columnName)) {
				dataByColumn[columnName] = rows.map((row) => row[columnName]);
			}
		}
		combinedDataObjectColumnOriented[indicator.code] = dataByColumn;
	}
	return combinedDataObjectColumnOriented;
}

function generateOutConfig(config) {
	// TODO: check why the values in similarAreasLookupObject all look equal to each other
	const similarAreasLookupObject = toLookup(config.similarAreasLookup, 'areacd', 'similarlist');

	const areasGeogInfoObject = toLookup(config.areasGeogInfo, 'areacd');

	const areasGeogLevelObject = makeAreasGeogLevelObject(config.areasGeogLevel);

	const areasArray = makeAreasArray(config);
	const areasObject = toLookup(areasArray, 'areacd');

	//////////////

	config.indicatorsMetadata.forEach((e) => {
		e.prefix = e.prefix == null ? '' : e.prefix.replace('GBPSign', '£');
		e.suffix = e.suffix == null ? '' : e.suffix;
	});

	const indicatorsMetadataObject = toLookup(config.indicatorsMetadata, 'code');

	const indicatorsArray = config.indicators;
	indicatorsArray.forEach((el) => {
		el.metadata = indicatorsMetadataObject[el.code];
	});

	const indicatorsObject = toLookup(indicatorsArray, 'code');

	const indicatorsCodeLabelArray = indicatorsArray.map((el) => ({
		code: el.code,
		label: el.metadata.label
	}));

	//////////////

	const topicsArray = [...new Set(indicatorsArray.map((e) => e.topic))]
		.map((e) => {
			const listOfIndicators = indicatorsArray.filter((el) => el.topic === e);
			const subTopics = [...new Set(listOfIndicators.map((el) => el.subTopic))];

			return {
				name: e,
				subTopics: subTopics.map((el) => ({
					name: el,
					indicators: indicatorsArray.filter((elm) => elm.subTopic === el)
				}))
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name));

	//////////////

	const periodsLookupArray = config.periodsLookup.sort((a, b) => b.xDomainNumb - a.xDomainNumb);
	const periodsLookupObject = [...new Set(indicatorsArray.map((e) => e.periodGroup))].reduce(
		(obj, el) => {
			obj[el] = periodsLookupArray.filter((elm) => elm.periodGroup === el);
			return obj;
		},
		{}
	);

	const globalXDomainExtent = findGlobalXDomainExtent(indicatorsArray);

	return {
		similarAreasLookupObject,
		areasGeogInfoObject,
		areasGeogLevelObject,
		areasArray,
		areasObject,
		indicatorsCodeLabelArray,
		indicatorsObject,
		indicatorsCalculationsArray: config.indicatorsCalculations,
		topicsArray,
		periodsLookupArray,
		periodsLookupObject,
		globalXDomainExtent
	};
}

function makeAreasArray(config) {
	const areasParentsLookupObject = toLookup(config.areasParentsLookup, 'areacd');

	const areasArray = [...config.areas].sort((a, b) =>
		a.areanm > b.areanm ? 1 : b.areanm > a.areanm ? -1 : 0
	);
	areasArray.forEach((el) => {
		const areaParentObject = areasParentsLookupObject[el.areacd];

		el.parentcd = areaParentObject.parentcd;
		el.parentnm = areaParentObject.parentnm;
		el.countrycd = areaParentObject.countrycd;
		el.countrynm = areaParentObject.countrynm;

		const areaGeogLevel = config.areasGeogLevel
			.filter((elm) => elm.areacd === el.areacd)
			.map((elm) => elm.level);

		el.geogLevel =
			areaGeogLevel.length === 1
				? areaGeogLevel[0]
				: areaGeogLevel.includes('lower')
					? 'lower'
					: 'country';
	});
	return areasArray;
}

function makeAreasGeogLevelObject(areasGeogLevel) {
	const result = {};
	for (const place of areasGeogLevel) {
		result[place.level] = [];
	}
	for (const place of areasGeogLevel) {
		result[place.level].push(place.areacd);
	}
	return result;
}

function findGlobalXDomainExtent(indicatorsArray) {
	const xDomainNumbers = indicatorsArray.map((e) => parseInt(e.minXDomainNumb));
	return [Math.min(...xDomainNumbers), Math.max(...xDomainNumbers)];
}

function readDataFromCsvs() {
	const combinedData = readCsvAutoType(`${CSV_DIR}/combined-data.csv`);
	const beeswarmKeyData = readCsvAutoType(`${CSV_DIR}/beeswarm-key-data.csv`);

	return {
		combinedData,
		beeswarmKeyData
	};
}

function readConfigFromCsvs() {
	const similarAreasLookup = readCsvAutoType(`${CONFIG_DIR}/clusters/similar-areas-lookup.csv`);
	const areasGeogInfo = readCsvAutoType(`${CONFIG_DIR}/geography/areas-geog-info.csv`);
	const areasGeogLevel = readCsvAutoType(`${CONFIG_DIR}/geography/areas-geog-level.csv`);
	const areasParentsLookup = readCsvAutoType(`${CONFIG_DIR}/geography/areas-parents-lookup.csv`);
	const areas = readCsvAutoType(`${CONFIG_DIR}/geography/areas.csv`);
	const indicatorsCalculations = readCsvAutoType(
		`${CONFIG_DIR}/indicators/indicators-calculations.csv`
	);
	const indicators = readCsvAutoType(`${CONFIG_DIR}/indicators/indicators-lookup.csv`);
	const indicatorsMetadata = readCsvAutoType(`${CONFIG_DIR}/indicators/indicators-metadata.csv`);
	const periodsLookup = readCsvAutoType(`${CONFIG_DIR}/periods/unique-periods-lookup.csv`);

	return {
		similarAreasLookup,
		areasGeogInfo,
		areasGeogLevel,
		areasParentsLookup,
		areas,
		indicatorsCalculations,
		indicators,
		indicatorsMetadata,
		periodsLookup
	};
}

function toLookup(data, keyName: string, valueName: string | null = null) {
	const lookup = {};

	for (const item of data) {
		if (valueName == null) {
			lookup[item[keyName]] = item;
		} else {
			lookup[item[keyName]] = item[valueName];
		}
	}
	return lookup;
}
