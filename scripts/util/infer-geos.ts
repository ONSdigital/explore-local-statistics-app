import { csvParse, autoType } from 'd3-dsv';

const changesUrl =
	'https://raw.githubusercontent.com/ONSvisual/uk-topojson/refs/heads/main/input/changes.csv';

const groups = [
	{
		key: 'uk',
		codes: ['K02'],
		label: 'United Kingdom'
	},
	{
		key: 'ctry',
		codes: ['E92', 'S92', 'N92', 'W92'],
		label: 'Countries'
	},
	{
		key: 'rgn',
		codes: ['E12', 'S92', 'N92', 'W92'],
		label: 'Countries and regions'
	},
	{
		key: 'cauth',
		codes: ['E47'],
		label: 'Combined authorities'
	},
	{
		key: 'utla',
		codes: ['E06', 'E08', 'E09', 'E10', 'N09', 'S12', 'W06'],
		label: 'Upper-tier/unitary authorities'
	},
	{
		key: 'ltla',
		codes: ['E06', 'E07', 'E08', 'E09', 'N09', 'S12', 'W06'],
		label: 'Lower-tier/unitary authorities'
	}
];

let endDatesCache;

async function getEndDates(groups, countries) {
	let endDatesAll;
	if (endDatesCache) endDatesAll = endDatesCache;
	else {
		const endDatesRaw = await (await fetch(changesUrl)).text();
		endDatesAll = csvParse(endDatesRaw, autoType);
		endDatesCache = endDatesAll;
	}

	const latestYear = Math.max(...endDatesAll.map((d) => d.start));
	const endDatesFiltered = endDatesAll.filter(
		(d) =>
			countries.includes(d.oldcd[0]) &&
			d.type !== 'new_geo' &&
			groups[groups.length - 1].codes.includes(d.oldcd.slice(0, 3))
	);
	if (endDatesFiltered.length === 0) return { endDates: null, latestYear };

	const years = Array.from(new Set(endDatesFiltered.map((d) => d.start))).sort((a, b) => a - b);

	const endDates = [];
	for (const year of years) {
		endDates.push({
			year,
			codes: endDatesFiltered.filter((d) => d.start === year).map((d) => d.oldcd)
		});
	}
	return { endDates, latestYear };
}

async function getYear(codes, groups, countries) {
	const endDates = await getEndDates(groups, countries);
	if (!endDates.endDates) return endDates.latestYear;

	for (const year of endDates.endDates) {
		if (year.codes.some((cd) => codes.includes(cd))) return year.year - 1;
	}
	return endDates.latestYear;
}

function getTypes(codes) {
	return Array.from(new Set(codes.map((cd) => cd.slice(0, 3)))).sort((a, b) => a.localeCompare(b));
}

function getCountries(types) {
	return Array.from(new Set(types.map((t) => t[0])))
		.filter((t) => ['E', 'N', 'S', 'W'].includes(t))
		.sort((a, b) => a.localeCompare(b));
}

function getGroups(types) {
	return groups.filter((grp) => grp.codes.some((cd) => types.includes(cd)));
}

export default async function inferGeos(codes) {
	const types = getTypes(codes);
	const countries = getCountries(types);
	const groups = getGroups(types, countries);
	const year = await getYear(codes, groups, countries);
	return { countries, levels: groups.map((g) => g.key), types, year };
}
