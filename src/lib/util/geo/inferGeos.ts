/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
export const groups = [
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
		codes: ['E06', 'E09', 'E10', 'E47', 'N09', 'S12', 'W06'],
		label: 'Upper-tier/combined authorities'
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

const years = [
	{ year: 2018, excludes: ['E06000059', 'E06000060', 'E06000061', 'E06000065'] },
	{ year: 2019, excludes: ['E06000060', 'E06000061', 'E06000065'] },
	{ year: 2020, excludes: ['E06000061', 'E06000065'] },
	{ year: 2021, excludes: ['E06000065'] },
	{ year: 2023, excludes: [] }
];

function getYear(codes) {
	const cds = codes.filter((code) => code.slice(0, 3) === 'E06');
	for (const year of years) {
		if (year.excludes.every((cd) => !cds.includes(cd))) return year.year;
	}
	return null;
}

function getTypes(codes) {
	return Array.from(new Set(codes.map((cd) => cd.slice(0, 3)))).sort((a, b) => a.localeCompare(b));
}

function getCtrys(types) {
	return Array.from(new Set(types.map((t) => t[0])))
		.filter((t) => t !== 'K')
		.sort((a, b) => a.localeCompare(b));
}

function getGroups(types, ctrys) {
	return groups.filter((grp) => {
		return grp.codes.length > 1
			? grp.codes
					.filter((cd) =>
						ctrys
							.filter((c) => c !== 'N') // Some datasets have N92 but not N09
							.includes(cd[0])
					)
					.every((cd) => types.includes(cd))
			: types.includes(grp.codes[0]);
	});
}

export function inferGeos(codes) {
	const year = getYear(codes);
	const types = getTypes(codes);
	const ctrys = getCtrys(types);
	const groups = getGroups(types, ctrys);
	return { ctrys, types, groups, year };
}
