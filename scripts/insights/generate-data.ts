import { PathOrFileDescriptor, readFileSync, writeFileSync } from 'fs';
import { csvParse } from 'd3-dsv';

const RAW_DIR = 'scripts/insights/raw';
const COOKED_DIR = 'scripts/insights/cooked';
const CONFIG_DIR = `${RAW_DIR}/config-data`;
const CSV_DIR = `${COOKED_DIR}/csv`;

const DATA_OUTPUT_PATH = `static/insights/data.json`;
const COLUMN_ORIENTED_DATA_OUTPUT_PATH = `static/insights/column-oriented-data.json`;
const CONFIG_OUTPUT_PATH = `static/insights/config.json`;

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
	const combinedData = readCsv(`${CSV_DIR}/combined-data.csv`);
	const beeswarmKeyData = readCsv(`${CSV_DIR}/beeswarm-key-data.csv`);

	return {
		combinedData,
		beeswarmKeyData
	};
}

function readConfigFromCsvs() {
	const similarAreasLookup = readCsv(`${CONFIG_DIR}/clusters/similar-areas-lookup.csv`);
	const areasGeogInfo = readCsv(`${CONFIG_DIR}/geography/areas-geog-info.csv`);
	const areasGeogLevel = readCsv(`${CONFIG_DIR}/geography/areas-geog-level.csv`);
	const areasParentsLookup = readCsv(`${CONFIG_DIR}/geography/areas-parents-lookup.csv`);
	const areas = readCsv(`${CONFIG_DIR}/geography/areas.csv`);
	const indicatorsCalculations = readCsv(`${CONFIG_DIR}/indicators/indicators-calculations.csv`);
	const indicators = readCsv(`${CONFIG_DIR}/indicators/indicators-lookup.csv`);
	const indicatorsMetadata = readCsv(`${CONFIG_DIR}/indicators/indicators-metadata.csv`);
	const periodsLookup = readCsv(`${CONFIG_DIR}/periods/unique-periods-lookup.csv`);

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

function readCsv(filename: PathOrFileDescriptor) {
	const raw = readFileSync(filename);
	return csvParse(stripBom(raw.toString()));
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

//
//
/// an example:
//
//

// import * as aq from 'arquero';
// import * as fs from 'fs';
// import * as d3 from 'd3-dsv';
// import { promisify } from 'util';

// const readFileAsync = promisify(fs.readFile);

// // Helper function to read a CSV file and convert it to an Arquero table
// async function readCsv(filePath: string): Promise<aq.Table> {
//   const fileContent = await readFileAsync(filePath, { encoding: 'utf-8' });
//   const data = d3.csvParse(fileContent);
//   return aq.from(data);
// }

// (async () => {
//   // Define excluded indicators
//   const excludedIndicators = ["homicide-offences", "inward-foreign-direct-investment-fdi", "total-value-of-uk-exports"];

//   // Read areas and other configuration data
//   const areas = await readCsv("./config-data/geography/areas.csv");
//   const areasGeogLevel = await readCsv("./config-data/geography/areas-geog-level.csv");
//   const previousPeriods = await readCsv("config-data/periods/unique-periods-lookup.csv");
//   const previousIndicators = await readCsv("config-data/indicators/indicators-lookup.csv").select('id', 'topic', 'subTopic', 'code');

//   // Assume getFilePaths function exists to get file paths, needs to be implemented based on your environment
//   let filePaths = await getFilePaths("csv-preprocess", /\.csv$/, false);

//   filePaths = filePaths
//     .filter(filePath => !filePath.includes("/out/"))
//     .filter(filePath => !filePath.includes("_IDS"));

//   // Assume readPreviousFilePaths function exists to read the previous file paths log
//   const previousFilePaths = await readPreviousFilePaths("./config-data/file-names-log.csv");

//   const newFilePaths = filePaths.filter(filePath => !previousFilePaths.includes(filePath));

//   if (newFilePaths.length > 0) {
//     throw new Error("Script execution aborted - update file-names-log.");
//   }

//   // Filter file paths to include only those marked with "Y" in the log
//   // This filtering logic needs to be adjusted based on how you track inclusion in the log

//   // Combined data tables initialization
//   let combinedData = aq.table({}); // Initialize with an empty table structure
//   let combinedMetadata = aq.table({});

//   for (let filePath of filePaths) {
//     // Processing for each file, similar logic to the R script for filtering, mutating, and combining data
//     // Detailed implementation would follow the logic shown above, tailored to TypeScript and Arquero capabilities
//   }
// })();

// Note: This script assumes the existence of helper functions like getFilePaths and readPreviousFilePaths,
// which you would need to implement based on your specific environment (e.g., Node.js file system operations).

//
//
/// another example:
//
//

// import * as aq from 'arquero';
// import * as fs from 'fs';
// import * as d3 from 'd3-dsv';
// import { promisify } from 'util';

// const readFileAsync = promisify(fs.readFile);

// // Helper function to read a CSV file and convert it to an Arquero table
// async function readCsv(filePath: string): Promise<aq.Table> {
//   const fileContent = await readFileAsync(filePath, { encoding: 'utf-8' });
//   const data = d3.csvParse(fileContent);
//   return aq.from(data);
// }

// // Assuming filePaths is an array of file path strings to process
// let filePaths: string[] = []; // Populate this array as per your application's logic

// // Simulate reading previous file paths for filtering
// let previousFilePaths: string[] = []; // Populate this with actual data in your application

// // Areas table, assuming it's already been read and processed
// let areas: aq.Table = aq.table({}); // Replace with actual data

// // Main loop to process each file
// for (let filePath of filePaths) {
//   const indicatorCode = filePath.split('/').pop()?.replace("csv-preprocess/family-ess-main/", "").replace(".csv", "");

//   // Check if the indicator code is not excluded
//   if (!excludedIndicators.includes(indicatorCode!)) {
//     let indicatorData = await readCsv(filePath);

//     // Preprocess indicator data as needed
//     indicatorData = indicatorData
//       .mutate({
//         // Example of case_when logic in Arquero, adjust as per actual logic needed
//         areacd: (d: any) => d.areacd.replace("TLB", "E92000001"), // Simplified, expand for all cases
//         // Convert column names and values as needed
//       })
//       .select(['areacd', 'period', 'value', 'code', 'lci', 'uci']) // Select relevant columns
//       .filter((d: any) => areas.select('areacd').includes(d.areacd)); // Filter based on areas, adjust logic as needed

//     // Combine processed data with the main dataset
//     combinedData = combinedData.concat(indicatorData);

//     // Process and combine metadata, similar approach as for data
//     // Assuming indicator_metadata is processed similarly to indicator_data
//     let indicatorMetadata: aq.Table; // Initialize and process indicator metadata
//     combinedMetadata = combinedMetadata.concat(indicatorMetadata);
//   }
// }

// // Post-loop processing can go here
