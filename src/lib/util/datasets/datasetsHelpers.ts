/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import ckmeans from 'ckmeans';

const yearKey = 'xDomainNumb';

export function filterData(data, types, year = null) {
	return data
		.filter(
			(d) => d.value && (!year || d[yearKey] === year) && types.includes(d.areacd.slice(0, 3))
		)
		.sort((a, b) => a[yearKey] - b[yearKey]);
}

export function pivotData(data, filter = null) {
	const piv = {};

	for (const d of data) {
		if (!filter || filter.includes(d.areacd.slice(0, 3))) {
			if (!piv[d.areacd]) piv[d.areacd] = { areacd: d.areacd, areanm: d.areanm };
			piv[d.areacd][d[yearKey]] = d.value;
		}
	}

	return Object.keys(piv)
		.map((key) => piv[key])
		.sort((a, b) => a.areanm.localeCompare(b.areanm));
}

function getBreak(breaks, value) {
	for (let i = 0; i < breaks.length - 2; i++) {
		if (value < breaks[i + 1]) return i;
	}
	return breaks.length - 2;
}

export function makeMapData(data, types, year) {
	const filtered = data.filter(
		(d) => d.value && d[yearKey] === year && types.includes(d.areacd.slice(0, 3))
	);
	const values = filtered.map((d) => d.value).sort((a, b) => a - b);
	const breaks = [...ckmeans(values, Math.min(values.length, 5)), values[values.length - 1]];
	const codes = [];
	for (const d of filtered) {
		d.cluster = getBreak(breaks, d.value);
		codes.push(d.areacd);
	}
	return { data: filtered, breaks, codes };
}
