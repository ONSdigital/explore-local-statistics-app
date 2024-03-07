import { writeFileSync } from 'fs';
import aq from 'arquero';
import arqueroProcessing from './arquero-processing.js';
import { readCsvAutoType } from './io.ts';
import { inferGeos } from './inferGeos.ts';
import CONFIG from './config.ts';
import { median, mad } from './stats.ts';

const COLUMN_ORIENTED_DATA_OUTPUT_PATH = `static/insights/column-oriented-data.json`;
const CONFIG_OUTPUT_PATH = `static/insights/config.json`;

await main();

async function main() {
	const [combinedData, indicators, indicatorsCalculations, _oldStyleIndicatorsCalculations] =
		await arqueroProcessing();

	const data = readDataFromCsvs();
	data.combinedData = combinedData.objects();
	const config = readConfigFromCsvs();
	config.indicators = indicators.objects();
	config.indicatorsCalculations = indicatorsCalculations;
	config._oldStyleIndicatorsCalculations = _oldStyleIndicatorsCalculations;

	checkSlugs(config.indicatorsMetadata);

	const outData = generateOutData(data, config.indicators);
	writeFileSync(
		COLUMN_ORIENTED_DATA_OUTPUT_PATH,
		JSON.stringify(
			{
				combinedDataObjectColumnOriented: outData.combinedDataObjectColumnOriented,
				beeswarmKeyData: outData.beeswarmKeyData
			},
			null,
			'\t'
		)
	);
	console.log(
		`Insights data JSON file in column-oriented format has been generated at: ${COLUMN_ORIENTED_DATA_OUTPUT_PATH}`
	);

	const outConfig = generateOutConfig(
		config,
		combinedData,
		outData.combinedDataObjectColumnOriented
	);

	const areaDetails = generateAreaDetails(outConfig, combinedData);
	outConfig.areaDetails = areaDetails;

	writeFileSync(CONFIG_OUTPUT_PATH, JSON.stringify(outConfig, null, '\t'));
	console.log(`Insights config JSON file has been generated at: ${CONFIG_OUTPUT_PATH}`);
}

function checkSlugs(indicatorsMetadata) {
	const slugs = indicatorsMetadata.map((d) => d.slug);
	const slugsSet = new Set(slugs);
	if (slugsSet.size !== slugs.length) {
		throw new Error('Error: At least one indicator slug is duplicated!');
	}
	const slugRegExp = new RegExp('^[a-z0-9-]*$');
	for (const slug of slugs) {
		if (!slugRegExp.test(slug)) {
			throw new Error(
				`Error: Slug ${slug} should only contain lowercase letters, numbers, and hyphens!`
			);
		}
	}
}

function generateOutData(data, indicatorsArray) {
	const combinedDataArray = [...data.combinedData].sort((a, b) => b.xDomainNumb - a.xDomainNumb);

	// combinedDataObjectColumnOriented stores an array for each column to save space.
	const combinedDataObjectColumnOriented = {};
	for (const indicator of indicatorsArray) {
		const rows = combinedDataArray.filter((e) => e.code === indicator.code);
		if (rows.length === 0) {
			throw new Error('Unexpectedly empty `rows` array.');
		}
		const dataByColumn = {};
		for (const columnName in rows[0]) {
			if (Object.getOwnPropertyDescriptor(rows[0], columnName)) {
				dataByColumn[columnName] = rows.map((row) => row[columnName]);
			}
		}

		// We don't need arrays for id and code, because all array elements are the same
		dataByColumn.id = dataByColumn.id[0];
		dataByColumn.code = dataByColumn.code[0];

		combinedDataObjectColumnOriented[indicator.code] = dataByColumn;
	}

	return {
		combinedDataObjectColumnOriented,
		beeswarmKeyData: data.beeswarmKeyData
	};
}

function generateOutConfig(config, combinedData, combinedDataObjectColumnOriented) {
	const clustersLookup = makeClustersLookup(config.clustersLookup);
	const clustersCalculations = makeClustersCalculations(clustersLookup, combinedData);

	const sameParentGeogCalculations = makeSameParentGeogCalculations(
		config.areasGeogLevel,
		config.areasParentsLookup,
		combinedData
	);

	const areasGeogInfoObject = toLookup(config.areasGeogInfo, 'areacd');

	const areasGeogLevelObject = makeAreasGeogLevelObject(config.areas, config.areasGeogLevel);

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
		const indicatorData = combinedDataObjectColumnOriented[el.code];
		el.inferredGeos = inferGeos(indicatorData.areacd);
		el.years = uniqueValues(indicatorData.xDomainNumb).sort((a, b) => a - b);
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

	const indicatorsCalculationsArray = combineIndicatorCalculations(
		config.indicatorsCalculations,
		sameParentGeogCalculations,
		clustersCalculations,
		clustersLookup.types,
		indicatorsObject
	);

	return {
		clustersLookup,
		areasGeogInfoObject,
		areasGeogLevelObject,
		areasArray,
		areasObject,
		indicatorsCodeLabelArray,
		indicatorsObject,
		_newStyleIndicatorsCalculationsArray: indicatorsCalculationsArray,
		indicatorsCalculationsArray: config._oldStyleIndicatorsCalculations,
		topicsArray,
		periodsLookupArray,
		periodsLookupObject,
		globalXDomainExtent
	};
}

function generateAreaDetails(outConfig, combinedData) {
	const areaDetails = Object.fromEntries(
		outConfig.areasArray.map((d) => [d.areacd, { ...d, filteredIndicators: {} }])
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

	const deomgraphicClustersLookup = getDemographicClustersLookup(outConfig.clustersLookup);
	for (const areacd of Object.keys(areaDetails)) {
		if (areacd in deomgraphicClustersLookup) {
			areaDetails[areacd].demographicCluster = deomgraphicClustersLookup[areacd].filter(
				// Don't include this area in the list of area codes in the cluster.
				(d) => d !== areacd
			);
		}
	}

	for (const areaDatum of Object.values(areaDetails)) {
		areaDatum.areasWithSameParent = outConfig.areasArray
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

	for (const item of indicatorsCalculationsArray) {
		item.clustersCalculations = {};
	}

	for (const clusterType of clusterTypes) {
		const clustersLookup = Object.fromEntries(
			clustersCalculations[clusterType].map((d) => [
				`${d.code};;;${d.xDomainNumb}`,
				d.filteredResults
			])
		);

		for (const item of indicatorsCalculationsArray) {
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
		types: []
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
					mad: clusterValues.length === 0 ? null : mad(clusterValues)
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
				mad: geogGroupValues.length === 0 ? null : mad(geogGroupValues)
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
	const geogLevelToPrefixes = {};
	for (const item of areasGeogLevel) {
		geogLevelToPrefixes[item.level] ||= new Set();
		geogLevelToPrefixes[item.level].add(item.areacd_prefix);
	}

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
							(d) => d.parentcd === parentcd && geogLevelToPrefixes[level].has(d.areacd.slice(0, 3))
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

	const areasArray = [...config.areas].sort((a, b) =>
		a.areanm > b.areanm ? 1 : b.areanm > a.areanm ? -1 : 0
	);
	areasArray.forEach((el) => {
		const areaParentObject = areasParentsLookupObject[el.areacd];

		el.parentcd = areaParentObject.parentcd;
		el.parentnm = areaParentObject.parentnm;
		el.countrycd = areaParentObject.countrycd;
		el.countrynm = areaParentObject.countrynm;

		const areacd_prefix = el.areacd.slice(0, 3);

		const areaGeogLevel = config.areasGeogLevel
			.filter((elm) => elm.areacd_prefix === areacd_prefix)
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

function makeAreasGeogLevelObject(areas, areasGeogLevel) {
	const result = {};
	for (const item of areasGeogLevel) {
		result[item.level] = [];
	}
	for (const place of areas) {
		const areacd_prefix = place.areacd.slice(0, 3);
		for (const item of areasGeogLevel) {
			if (areacd_prefix === item.areacd_prefix) {
				result[item.level].push(place.areacd);
			}
		}
	}
	return result;
}

function findGlobalXDomainExtent(indicatorsArray) {
	const xDomainNumbers = indicatorsArray.map((e) => parseInt(e.minXDomainNumb));
	return [Math.min(...xDomainNumbers), Math.max(...xDomainNumbers)];
}

function readDataFromCsvs() {
	const beeswarmKeyData = readCsvAutoType(`${CONFIG.CSV_DIR}/beeswarm-key-data.csv`);

	return {
		beeswarmKeyData
	};
}

function readConfigFromCsvs() {
	const clustersLookup = readCsvAutoType(`${CONFIG.CONFIG_DIR}/clusters/Cluster_allocation.csv`);
	const areasGeogInfo = readCsvAutoType(`${CONFIG.CONFIG_DIR}/geography/areas-geog-info.csv`);
	const areasGeogLevel = readCsvAutoType(`${CONFIG.CONFIG_DIR}/geography/areas-geog-level.csv`);
	const areasParentsLookup = readCsvAutoType(
		`${CONFIG.CONFIG_DIR}/geography/areas-parents-lookup.csv`
	);
	const areas = readCsvAutoType(`${CONFIG.CONFIG_DIR}/geography/areas.csv`);
	const indicatorsMetadata = readCsvAutoType(
		`${CONFIG.CONFIG_DIR}/indicators/indicators-metadata.csv`
	);
	const periodsLookup = readCsvAutoType(`${CONFIG.CONFIG_DIR}/periods/unique-periods-lookup.csv`);

	return {
		clustersLookup,
		areasGeogInfo,
		areasGeogLevel,
		areasParentsLookup,
		areas,
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

function toNestedLookup(data, keys) {
	const lookup = new Map();
	for (const item of data) {
		let map = lookup;
		for (const key of keys.slice(0, -1)) {
			if (!map.has(item[key])) {
				map.set(item[key], new Map());
			}
			map = map.get(item[key]);
		}
		const lastKey = keys[keys.length - 1];
		if (!map.has(item[lastKey])) {
			map.set(item[lastKey], []);
		}
		map.get(item[lastKey]).push(item);
	}
	return lookup;
}

function uniqueValues(arr) {
	const set = new Set();
	for (const item of arr) {
		set.add(item);
	}
	return Array.from(set);
}
