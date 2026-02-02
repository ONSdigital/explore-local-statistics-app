import { makeGeoLevelFilter, geoYearFilter } from './helpers/geoFilters';
import groupAreasByLevel from './helpers/groupAreasByLevel';
import { geoLevelsAllLookup } from '$lib/config/geoLevels';
import readData from '$lib/data';
import summaryData from '$lib/data/json-stat-summary.json';

const areasList = await readData('areas-list');
const geoMetadata = await readData('geo-metadata');
const geoLatestYear = summaryData.geoYears[summaryData.geoYears.length - 1];

function makeAreaRow(json, i) {
	const row = { areacd: json.areacd[i], areanm: json.areanm[i] };
	if (json.parentcd[i]) row.parent = geoMetadata?.[json.parentcd[i]]?.areanm;
	return row;
}

function addAreaTypes(areas) {
	if (areas.length === 0) return areas;
	return areas.map((area) => {
		const type = geoLevelsAllLookup[area.areacd.slice(0, 3)];
		area.type = type?.label;
		return area;
	});
}

function makeCombinedFilter(name, geo, year) {
	if (!geo && !year) return (d, i) => name(d.areanm[i]);
	if (!geo && year)
		return (d, i) => name(d.areanm[i]) && year({ start: d.start[i], end: d.end[i] });
	if (geo && !year) return (d, i) => name(d.areanm[i]) && geo(d.areacd[i]);
	return (d, i) =>
		name(d.areanm[i]) && geo(d.areacd[i]) && year({ start: d.start[i], end: d.end[i] });
}

export default function getAreasByName(params = {}) {
	if (typeof params.name !== 'string') return { error: 400, message: 'No search string provided' };

	const limit = params.limit || 10;
	const offset = params.offset || 0;

	const matches = [];
	let areas = [];

	// Skip search if string contains numbers
	if (!params.name.match(/\d/)) {
		const str = params.name
			.toLowerCase()
			.match(/[a-z'\.\-\s]/g)
			.join(''); // Strip out special characters

		const year =
			params.year === 'latest' ? geoLatestYear : params.year === 'all' ? null : params.year;
		const regexStart = new RegExp(`^${str}`, 'i');
		const regexWord = new RegExp(`\\b${str}`, 'i');

		const geoLevelFilter = params.geoLevel !== 'all' ? makeGeoLevelFilter(params.geoLevel) : null;
		const yearFilter = year ? (area) => geoYearFilter(area, year) : null;
		const combinedFilter = makeCombinedFilter(
			(nm) => nm.match(regexWord),
			geoLevelFilter,
			yearFilter
		);

		for (let i = 0; i < areasList.areanm.length; i++) {
			if (combinedFilter(areasList, i)) matches.push(makeAreaRow(areasList, i));
		}

		areas = matches
			.toSorted((a, b) => {
				const aMatch = a.areanm.match(regexStart);
				const bMatch = b.areanm.match(regexStart);
				return aMatch && bMatch ? 0 : aMatch ? -1 : bMatch ? 1 : 0;
			})
			.slice(offset, offset + limit);
	}

	const result = {
		meta: {
			query: params.name,
			count: areas.length,
			total: matches.length,
			limit,
			offset
		},
		data: params.groupByLevel ? groupAreasByLevel(addAreaTypes(areas)) : addAreaTypes(areas)
	};

	return result;
}
