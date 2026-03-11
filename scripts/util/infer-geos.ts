import { csvParse, autoType } from 'd3-dsv';
import { geoLevels } from '../../src/lib/config/geoLevels';

const changesUrl =
	'https://raw.githubusercontent.com/ONSvisual/uk-topojson/refs/heads/main/input/changes.csv';

type areaGroupObject = { key: string; codes: string[]; label: string };
const groups: areaGroupObject[] = Object.entries(geoLevels).map((entry) => ({
	key: entry[0],
	...entry[1]
}));

let startDatesCache: { [key: string]: string | number }[] | null = null;

async function getStartDates(groups: areaGroupObject[], countries: string[]) {
	let startDatesAll;
	if (startDatesCache) startDatesAll = startDatesCache;
	else {
		console.log('Fetching geography dates from uk-topojson repo');
		const startDatesRaw = await (await fetch(changesUrl)).text();
		startDatesAll = csvParse(startDatesRaw, autoType).filter(
			(d) => d.newcd && d.type !== 'new_geo'
		);
		startDatesCache = startDatesAll;
	}

	const earliestYear = Math.min(...startDatesAll.map((d) => d.start)) - 1;
	const latestYear = Math.max(...startDatesAll.map((d) => d.start));

	const startDatesFiltered = startDatesAll.filter(
		(d) =>
			countries.includes(d.newcd[0]) &&
			groups[groups.length - 1].codes.includes(d.newcd.slice(0, 3))
	);
	if (startDatesFiltered.length === 0) return { startDates: null, latestYear };

	const years = Array.from(new Set(startDatesFiltered.map((d) => d.start))).sort((a, b) => a - b);

	const startDates = [];
	for (const year of years) {
		startDates.push({
			year,
			codes: startDatesFiltered.filter((d) => d.start === year).map((d) => d.newcd)
		});
	}
	return { startDates, earliestYear, latestYear };
}

async function getYear(codes: string[], groups: areaGroupObject[], countries: string[]) {
	const startDates = await getStartDates(groups, countries);
	if (!startDates.startDates) return startDates.latestYear;

	for (const year of [...startDates.startDates].reverse()) {
		if (year.codes.every((cd) => codes.includes(cd))) return year.year;
	}
	return startDates.earliestYear;
}

function getTypes(codes: string[]) {
	return Array.from(new Set(codes.map((cd) => cd.slice(0, 3)))).sort((a, b) => a.localeCompare(b));
}

function getCountries(types: string[]) {
	return Array.from(new Set(types.map((t) => t[0])))
		.filter((t) => ['E', 'N', 'S', 'W'].includes(t))
		.sort((a, b) => a.localeCompare(b));
}

function getGroups(types: string[], countries: string[]) {
	return groups.filter((grp) => {
		const codes = grp.codes.filter((cd) => countries.includes(cd[0]));
		return codes.length && codes.every((cd) => types.includes(cd));
	});
}

export default async function inferGeos(codes: string[]) {
	const types = getTypes(codes);
	const countries = getCountries(types);
	const groups = getGroups(types, countries);
	const year = await getYear(codes, groups, countries);
	return { countries, levels: groups.map((g) => g.key), types, year };
}
