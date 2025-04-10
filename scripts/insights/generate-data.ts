import { readFileSync } from 'fs';
import aq from 'arquero';
import arqueroProcessing from './arquero-processing.js';
import { readCsvAutoType } from './io.ts';
import { inferGeos } from './inferGeos.ts';
import CONFIG from './config.ts';
import { median, mad } from './stats.ts';
import {
	toLookup,
	uniqueValues,
	toNestedLookup,
	toLookupWithMultipleValues
} from './data-utils.ts';
import { writeJson } from './io.ts';
import { checkSlugs } from './data-processing-warnings.ts';
import { createSpreadsheet } from './create-spreadsheet.ts';
import { generateSitemap } from './generate-sitemap.ts';

const COLUMN_ORIENTED_DATA_OUTPUT_PATH = `static/insights/column-oriented-data.json`;
const CONFIG_OUTPUT_PATH = `static/insights/config.json`;
const UNMINIFIED_COLUMN_ORIENTED_DATA_OUTPUT_PATH = `static/insights/column-oriented-data-unminified.json`;
const UNMINIFIED_CONFIG_OUTPUT_PATH = `static/insights/config-unminified.json`;
const AREA_DETAILS_OUTPUT_DIR = `static/insights/area-details`;
const INDIVIDUAL_DATASETS_OUTPUT_DIR = `static/insights/individual-datasets`;

// put the core-metadata into src to be imported as it's currently loaded in the layout page and is reasonably small
const CORE_METADATA_OUTPUT_PATH = `src/data/insights/core-metadata.json`;

await main();

async function main() {
	const [
		combinedData,
		indicators,
		indicatorsCalculations,
		_oldStyleIndicatorsCalculations,
		periods,
		jsonAdditionalMetadata
	] = await arqueroProcessing();

	const config = readConfigFromCsvs();

	console.log(
		'Duplicate areas: ',
		config.areas.map((d) => d.areanm).filter((e, i, a) => a.indexOf(e) !== i)
	);

	config.indicatorsMetadata = config.indicatorsMetadata.map((el) => {
		return { ...el, ...(el.code in jsonAdditionalMetadata ? jsonAdditionalMetadata[el.code] : {}) };
	});

	config.indicators = indicators.objects();
	config.indicatorsCalculations = indicatorsCalculations;
	config._oldStyleIndicatorsCalculations = _oldStyleIndicatorsCalculations;

	const sitemapPlaces = readCsvAutoType(`static/data/places.csv`);
	// writeJson('./sitemapPlaces.json', sitemapPlaces);
	//use sitemapPlaces rather than config.areas
	generateSitemap(sitemapPlaces, config.indicatorsMetadata);

	checkSlugs(config.indicatorsMetadata.map((d) => d.slug));

	const combinedDataObjectColumnOriented = generateOutData(
		combinedData.objects(),
		config.indicators
	);

	const outConfig = generateOutConfig(
		config,
		combinedData,
		combinedDataObjectColumnOriented,
		periods
	);

	const data = {
		combinedDataObjectColumnOriented,
		beeswarmKeyData: readCsvAutoType(`${CONFIG.CSV_DIR}/beeswarm-key-data.csv`)
	};
	writeJson(COLUMN_ORIENTED_DATA_OUTPUT_PATH, data, { minify: true });
	writeJson(CONFIG_OUTPUT_PATH, outConfig, { minify: true });
	// Also write unminified versions to make git diffs more useful
	writeJson(UNMINIFIED_COLUMN_ORIENTED_DATA_OUTPUT_PATH, data);
	writeJson(UNMINIFIED_CONFIG_OUTPUT_PATH, outConfig);

	for (const datasetCode of Object.keys(combinedDataObjectColumnOriented)) {
		const slug = outConfig.indicatorsObject[datasetCode].metadata.slug;
		writeJson(
			`${INDIVIDUAL_DATASETS_OUTPUT_DIR}/${slug}.json`,
			combinedDataObjectColumnOriented[datasetCode]
		);
	}

	const coreMetadata = {
		indicatorsCodeLabelArray: outConfig.indicatorsCodeLabelArray,
		indicatorsObject: outConfig.indicatorsObject,
		topicsArray: outConfig.topicsArray
	};
	writeJson(CORE_METADATA_OUTPUT_PATH, coreMetadata);

	const areaDetails = generateAreaDetails(
		outConfig.clustersLookup,
		outConfig.areasArray,
		combinedData,
		config.globalNeighbours,
		config.demographicNeighbours,
		config.economicNeighbours
	);

	for (const areacd of Object.keys(areaDetails)) {
		writeJson(`${AREA_DETAILS_OUTPUT_DIR}/${areacd}.json`, areaDetails[areacd]);
	}

	createSpreadsheet(
		combinedDataObjectColumnOriented,
		outConfig,
		periods,
		'static/insights/datadownload.ods'
	);
}

function generateOutData(combinedData, indicatorsArray) {
	const combinedDataLookup = toNestedLookup(
		[...combinedData].sort((a, b) => b.xDomainNumb - a.xDomainNumb),
		['code']
	);

	// combinedDataObjectColumnOriented stores an array for each column to save space.
	const combinedDataObjectColumnOriented = {};
	for (const indicator of indicatorsArray) {
		const rows = combinedDataLookup.get(indicator.code);
		if (rows.length === 0) {
			throw new Error('Unexpectedly empty `rows` array.');
		}
		const keys = Object.keys(rows[0]);
		for (const row of rows) {
			if (Object.keys(row).length !== keys.length) {
				throw new Error('Unexpected number of keys in a data row.');
			}
		}
		const dataByColumn = {};
		for (const columnName of keys) {
			dataByColumn[columnName] = rows.map((row) => row[columnName]);
		}

		// We don't need arrays for id and code, because all array elements are the same
		dataByColumn.id = dataByColumn.id[0];
		dataByColumn.code = dataByColumn.code[0];

		combinedDataObjectColumnOriented[indicator.code] = dataByColumn;
	}

	return combinedDataObjectColumnOriented;
}

function generateOutConfig(config, combinedData, combinedDataObjectColumnOriented, periods) {
	const clustersLookup = makeClustersLookup(config.clustersLookup);
	const clustersCalculations = makeClustersCalculations(clustersLookup, combinedData);

	const neighbourLookup = makeNeighbourLookup(
		config.globalNeighbours,
		config.demographicNeighbours,
		config.economicNeighbours
	);

	const sameParentGeogCalculations = makeSameParentGeogCalculations(
		config.areasGeogLevel,
		config.areasParentsLookup,
		combinedData
	);

	const areasArray = makeAreasArray(config);

	const indicatorsMetadataObject = makeIndicatorsMetadataObject(config.indicatorsMetadata);

	const indicatorsArray = config.indicators;
	indicatorsArray.forEach((el) => {
		el.metadata = indicatorsMetadataObject[el.code];
		const indicatorData = combinedDataObjectColumnOriented[el.code];
		el.inferredGeos = inferGeos(indicatorData.areacd);
		el.years = uniqueValues(indicatorData.xDomainNumb).sort((a, b) => a - b);
	});

	const indicatorsCodeLabelArray = indicatorsArray.map((el) => ({
		code: el.code,
		label: el.metadata.label
	}));

	const topicsArray = [...new Set(indicatorsArray.map((e) => e.topic))].map((e) => {
		const listOfIndicators = indicatorsArray.filter((el) => el.topic === e);
		const subTopics = [...new Set(listOfIndicators.map((el) => el.subTopic))];

		return {
			name: e,
			subTopics: subTopics.map((el) => ({
				name: el,
				indicatorCodes: indicatorsArray.filter((elm) => elm.subTopic === el).map((d) => d.code)
			}))
		};
	});

	const periodsLookupArray = periods;
	const usedPeriodGroups = new Set(indicatorsArray.map((d) => d.id));
	const periodsLookupObject = toLookupWithMultipleValues(
		periodsLookupArray.filter((d) => usedPeriodGroups.has(d.id)),
		'id'
	);

	const indicatorsCalculationsArray = combineIndicatorCalculations(
		config.indicatorsCalculations,
		sameParentGeogCalculations,
		clustersCalculations,
		clustersLookup.types
	);

	return {
		clustersLookup,
		areasGeogInfoObject: toLookup(config.areasGeogInfo, 'areacd'),
		areasGeogLevelObject: makeAreasGeogLevelObject(config.areas, config.areasGeogLevel),
		areasArray,
		areasObject: toLookup(areasArray, 'areacd'),
		indicatorsCodeLabelArray,
		indicatorsObject: toLookup(indicatorsArray, 'code'),
		_newStyleIndicatorsCalculationsArray: indicatorsCalculationsArray,
		indicatorsCalculationsArray: config._oldStyleIndicatorsCalculations,
		topicsArray,
		periodsLookupArray,
		periodsLookupObject,
		globalXDomainExtent: findGlobalXDomainExtent(indicatorsArray),
		neighbourLookup
	};
}

function makeIndicatorsMetadataObject(indicatorsMetadata) {
	indicatorsMetadata = indicatorsMetadata.map((d) => {
		d = { ...d };
		d.prefix = d.prefix == null ? '' : d.prefix.replace('GBPSign', '£');
		d.suffix = d.suffix == null ? '' : d.suffix;
		return d;
	});

	return toLookup(indicatorsMetadata, 'code');
}

function generateAreaDetails(
	clustersLookup,
	areasArray,
	combinedData,
	globalNeighbours,
	demographicNeighbours,
	economicNeighbours
) {
	const areaDetails = Object.fromEntries(
		areasArray.map((d) => [d.areacd, { ...d, filteredIndicators: {} }])
	);

	for (const { code, areacd, xDomainNumb } of combinedData) {
		if (!(code in areaDetails[areacd].filteredIndicators)) {
			areaDetails[areacd].filteredIndicators[code] = new Set();
		}
		areaDetails[areacd].filteredIndicators[code].add(xDomainNumb);
	}
	for (const areacd of Object.keys(areaDetails)) {
		areaDetails[areacd].filteredIndicators = Object.entries(
			areaDetails[areacd].filteredIndicators
		).map(([code, xDomainNumb]) => ({ code, xDomainNumb: [...xDomainNumb].sort((a, b) => a - b) }));
	}

	const deomgraphicClustersLookup = getDemographicClustersLookup(clustersLookup);
	for (const areacd of Object.keys(areaDetails)) {
		if (areacd in deomgraphicClustersLookup) {
			areaDetails[areacd].demographicCluster = deomgraphicClustersLookup[areacd].filter(
				// Don't include this area in the list of area codes in the cluster.
				(d) => d !== areacd
			);
		}
	}

	// add in info about global cluster and nearest neighbours
	const nearestNeighbourLookup = makeNeighbourLookup(
		globalNeighbours,
		demographicNeighbours,
		economicNeighbours
	);
	for (const areacd of Object.keys(areaDetails)) {
		if (areacd in nearestNeighbourLookup) {
			areaDetails[areacd].nearestNeighbours = nearestNeighbourLookup[areacd];
		}
	}

	for (const areaDatum of Object.values(areaDetails)) {
		areaDatum.areasWithSameParent = areasArray
			.filter(
				(d) =>
					d.parentcd === areaDatum.parentcd &&
					d.geogLevel === areaDatum.geogLevel &&
					d.areacd !== areaDatum.areacd
			)
			.map((d) => d.areacd);
	}
	return areaDetails;
}

function getDemographicClustersLookup(clustersLookup) {
	const letterToAreaCodes = {};
	const areaCodeToCluster = {};
	for (let i = 0; i < clustersLookup.data.areacd.length; i++) {
		const areacd = clustersLookup.data.areacd[i];
		const letter = clustersLookup.data.demographic[i];
		letterToAreaCodes[letter] ||= [];
		letterToAreaCodes[letter].push(areacd);
		areaCodeToCluster[areacd] = letterToAreaCodes[letter];
	}
	return areaCodeToCluster;
}

function combineIndicatorCalculations(
	indicatorsCalculations,
	sameParentGeogCalculations,
	clustersCalculations,
	clusterTypes
) {
	const indicatorsCalculationsArray = JSON.parse(JSON.stringify(indicatorsCalculations));

	const sameParentLookup = Object.fromEntries(
		sameParentGeogCalculations.map((d) => [`${d.code};;;${d.xDomainNumb}`, d.filteredResults])
	);

	for (const item of indicatorsCalculationsArray) {
		if (`${item.code};;;${item.period}` in sameParentLookup) {
			item.sameParentGeogCalculations = sameParentLookup[`${item.code};;;${item.period}`];
		}
	}

	for (const clusterType of clusterTypes) {
		const clustersLookup = Object.fromEntries(
			clustersCalculations[clusterType].map((d) => [
				`${d.code};;;${d.xDomainNumb}`,
				d.filteredResults
			])
		);

		for (const item of indicatorsCalculationsArray) {
			item.clustersCalculations ||= {};
			if (`${item.code};;;${item.period}` in clustersLookup) {
				item.clustersCalculations[clusterType] = clustersLookup[`${item.code};;;${item.period}`];
			}
		}
	}

	return indicatorsCalculationsArray;
}

function makeClustersLookup(clustersLookupRaw) {
	const clustersLookup = {
		data: { areacd: clustersLookupRaw.map((row) => row['Local Authority Code']) },
		types: [],
		descriptions: getClusterDescriptions()
	};
	for (const columnName of clustersLookupRaw.columns) {
		if (!columnName.startsWith('Local Authority')) {
			const shortColumnName = columnName.split(' ')[0].toLowerCase();
			clustersLookup.types.push(shortColumnName);
			clustersLookup.data[shortColumnName] = clustersLookupRaw.map((row) => {
				const clusterCode = row[columnName].slice(-1).toLowerCase();
				return clusterCode.match(/[a-z]/) ? clusterCode : null;
			});
		}
	}
	return clustersLookup;
}

function makeNeighbourLookup(globalLookup, demographyLookup, economyLookup) {
	const nearestNeighbourLookup = {};

	// Process each lookup file
	const lookups = [
		{ data: globalLookup, type: 'global' },
		{ data: demographyLookup, type: 'demographic' },
		{ data: economyLookup, type: 'economic' }
	];

	lookups.forEach(({ data, type }) => {
		for (const row of data) {
			const areacd = row['AREACD'];

			// Initialize area entry if not exists
			if (!nearestNeighbourLookup[areacd]) {
				nearestNeighbourLookup[areacd] = {};
			}

			// Create neighbours array for this type
			const neighbours = [];

			// Collect neighbours from the row
			for (const key in row) {
				if (!key.includes('AREACD')) {
					neighbours.push(row[key]);
				}
			}

			// Store neighbours for this specific type
			nearestNeighbourLookup[areacd][type] = neighbours;
		}
	});

	return nearestNeighbourLookup;
}

function getClusterDescriptions() {
	const clusterDescriptions = readFileSync(CONFIG.CONFIG_DIR + '/clusters/Cluster-descriptions.txt')
		.toString()
		.split('\n')
		.filter((s) => new RegExp('^[A-Za-z]*_[A-D]:').test(s));

	return clusterDescriptions.map((d) => {
		const type = CONFIG.CLUSTER_TYPES_LOOKUP[d.split('_')[0]];
		if (type == null) {
			throw new Error(`Unknown cluster type: ${d.split('_')[0]}.`);
		}
		return {
			type,
			letter: d.split('_')[1].slice(0, 1).toLowerCase(),
			text: d.replace(new RegExp('^[^:]*: *'), '')
		};
	});
}

function makeClustersCalculations(clustersLookup, combinedData) {
	const clustersCalculations = {};
	for (const clusterType of clustersLookup.types) {
		clustersCalculations[clusterType] = [];
		const areacdToCluster = aq
			.table({
				areacd: clustersLookup.data.areacd,
				cluster: clustersLookup.data[clusterType]
			})
			.filter((d) => d.cluster !== null);
		const joinedTable = combinedData
			.join(areacdToCluster, 'areacd')
			.filter((d) => d.value !== null);
		const clusters = areacdToCluster
			.select('cluster')
			.dedupe()
			.array('cluster')
			.sort((a, b) => a.localeCompare(b));

		const codeAndYear = joinedTable.select('code', 'xDomainNumb').dedupe().objects();
		const lookup = toNestedLookup(joinedTable.objects(), ['code', 'xDomainNumb', 'cluster']);
		for (const { code, xDomainNumb } of codeAndYear) {
			const filteredResults = {};
			for (const cluster of clusters) {
				const clusterItems = lookup.get(code).get(xDomainNumb).get(cluster);
				const clusterValues = clusterItems === undefined ? [] : clusterItems.map((d) => d.value);
				filteredResults[cluster] = {
					median: clusterValues.length === 0 ? null : median(clusterValues),
					mad: clusterValues.length === 0 ? null : mad(clusterValues),
					count: clusterValues.length
				};
			}
			clustersCalculations[clusterType].push({ code, xDomainNumb, filteredResults });
		}
	}

	return clustersCalculations;
}

function makeSameParentGeogCalculations(areasGeogLevel, areasParentsLookup, combinedData) {
	const regionAndCountryPrefixes = ['E12', 'N92', 'S92', 'W92']; // English regions and devolved countries
	const regionAndCountryCodes = new Set(
		areasParentsLookup
			.map((d) => d.parentcd)
			.filter((d) => d !== null && regionAndCountryPrefixes.includes(d.slice(0, 3)))
	);

	const geogGroups = makeGeogGroups(regionAndCountryCodes, areasParentsLookup, areasGeogLevel);

	const sameParentGeogCalculations = [];

	const combinedDataWithoutNulls = combinedData.filter((d) => d.value !== null);
	const codeAndYear = combinedDataWithoutNulls.select('code', 'xDomainNumb').dedupe().objects();
	const lookup = toNestedLookup(combinedDataWithoutNulls.objects(), ['code', 'xDomainNumb']);
	for (const { code, xDomainNumb } of codeAndYear) {
		const filteredTable = lookup.get(code).get(xDomainNumb);
		const filteredResults = {};
		for (const geogGroup of geogGroups) {
			const geogGroupValues = filteredTable
				.filter((d) => geogGroup.areaCodes.has(d.areacd))
				.map((d) => d.value);
			filteredResults[geogGroup.parentCode] = {
				median: geogGroupValues.length === 0 ? null : median(geogGroupValues),
				mad: geogGroupValues.length === 0 ? null : mad(geogGroupValues),
				count: geogGroupValues.length
			};
		}
		sameParentGeogCalculations.push({ code, xDomainNumb, filteredResults });
	}

	return sameParentGeogCalculations;
}

function makeGeogGroups(
	regionAndCountryCodes: Set<unknown>,
	areasParentsLookup: any,
	areasGeogLevel
) {
	const geogLevelToPrefixes = toLookupWithMultipleValues(areasGeogLevel, 'level', 'areacd_prefix');

	const geogGroups = [
		{
			parentCode: 'regions_and_countries',
			areaCodes: regionAndCountryCodes
		}
	];

	for (const level of ['upper', 'lower']) {
		for (const parentcd of regionAndCountryCodes) {
			geogGroups.push({
				parentCode: `${parentcd}-${level}`,
				areaCodes: new Set(
					areasParentsLookup
						.filter(
							(d) =>
								d.parentcd === parentcd && geogLevelToPrefixes[level].includes(d.areacd.slice(0, 3))
						)
						.map((d) => d.areacd)
				)
			});
		}
	}
	return geogGroups;
}

function makeAreasArray(config) {
	const areasParentsLookupObject = toLookup(config.areasParentsLookup, 'areacd');

	return [...config.areas]
		.sort((a, b) => (a.areanm > b.areanm ? 1 : b.areanm > a.areanm ? -1 : 0))
		.map((el) => {
			el = { ...el, ...areasParentsLookupObject[el.areacd] };

			const areaGeogLevel = config.areasGeogLevel
				.filter((elm) => elm.areacd_prefix === el.areacd.slice(0, 3))
				.map((elm) => elm.level);

			el.geogLevel =
				areaGeogLevel.length === 1
					? areaGeogLevel[0]
					: areaGeogLevel.includes('lower')
						? 'lower'
						: 'country';

			return el;
		});
}

function makeAreasGeogLevelObject(areas, areasGeogLevel) {
	const result = {};
	for (const item of areasGeogLevel) {
		result[item.level] ||= [];
		for (const place of areas) {
			if (place.areacd.slice(0, 3) === item.areacd_prefix) {
				result[item.level].push(place.areacd);
			}
		}
	}
	return result;
}

function findGlobalXDomainExtent(indicatorsArray) {
	const years = indicatorsArray.flatMap((e) => e.years);
	return [Math.min(...years), Math.max(...years)];
}

function readConfigFromCsvs() {
	const clustersDir = `${CONFIG.CONFIG_DIR}/clusters`;
	const periodsDir = `${CONFIG.CONFIG_DIR}/periods`;
	const geogDir = `${CONFIG.CONFIG_DIR}/geography`;
	const indicatorsDir = `${CONFIG.CONFIG_DIR}/indicators`;

	return {
		clustersLookup: readCsvAutoType(`${clustersDir}/Cluster_allocation.csv`),
		// clusterNeighbours: readCsvAutoType(`${clustersDir}/Cluster_neighbours.csv`),
		globalNeighbours: readCsvAutoType(`${clustersDir}/Global_neighbours.csv`),
		economicNeighbours: readCsvAutoType(`${clustersDir}/Economic_neighbours.csv`),
		demographicNeighbours: readCsvAutoType(`${clustersDir}/Demographic_neighbours.csv`),
		areasGeogInfo: readCsvAutoType(`${geogDir}/areas-geog-info.csv`),
		areasGeogLevel: readCsvAutoType(`${geogDir}/areas-geog-level.csv`),
		areasParentsLookup: readCsvAutoType(`${geogDir}/areas-parents-lookup.csv`),
		areas: readCsvAutoType(`${geogDir}/areas.csv`),
		indicatorsMetadata: readCsvAutoType(`${indicatorsDir}/indicators-metadata.csv`),
		periodsLookup: readCsvAutoType(`${periodsDir}/unique-periods-lookup.csv`, {
			stringColumns: ['period', 'label', 'labelShort']
		})
	};
}
