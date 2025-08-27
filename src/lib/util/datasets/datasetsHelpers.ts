/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import ckmeans from 'ckmeans';
import { geoCodesLookup, geoTypes } from '$lib/config/geoConfig';

const yearKey = 'xDomainNumb';

const isNumeric = (val) => isFinite(val) && val !== null;

export function filterData(data, types, year = null) {
	return data
		.filter(
			(d) =>
				isNumeric(d.value) && (!year || d[yearKey] === year) && types.includes(d.areacd.slice(0, 3))
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
		(d) => isNumeric(d.value) && d[yearKey] === year && types.includes(d.areacd.slice(0, 3))
	);
	if (filtered.length === 0) return { data: [], breaks: [] };
	const values = filtered.map((d) => d.value).sort((a, b) => a - b);
	// use kmeans clustering to define breaks:
	const breaksRaw = [...ckmeans(values, Math.min(values.length, 5)), values[values.length - 1]]
	// floor the min value, ceiling the max value, round all other values:
	const breaksAll = breaksRaw.map((n, i) => {
    	if (i === 0) return Math.floor(Math.min(...values));
    	if (i === breaksRaw.length - 1) return Math.ceil(Math.max(...values));
    	return roundNumber({ number: n, decimalPlaces: 0 });
	});
	// remove duplicates:
	const breaks = [...new Set(breaksAll)]
	
	const codes = [];
	for (const d of filtered) {
		d.cluster = getBreak(breaks, d.value);
		codes.push(d.areacd);
	}
	return { data: filtered, breaks, codes };
}

// stolen these functions from census maps
// https://github.com/ONSdigital/dp-census-atlas/blob/develop/src/util/numberUtil.ts
/*
  Round number to decimalPlaces
*/
export function roundNumber(args: { number: number; decimalPlaces: number }): number {
	const roundingFactor = 10 ** args.decimalPlaces;
	return Math.round(args.number * roundingFactor) / roundingFactor;
}

/*
	Return numbers rounded to decimalPlaces with repeated numbers removed.
  */
export function uniqueRoundedNumbers(args: { numbers: number[]; decimalPlaces: number }): number[] {
	return [
		...new Set(
			args.numbers.map((n) => {
				return roundNumber({ number: n, decimalPlaces: args.decimalPlaces });
			})
		)
	];
}

/**
 * Filters out City of London
 * @param {Array} data - Array of objects containing area data
 * @param {string[] | undefined} extremeAreas - Multiplier threshold (default: 700)
 * @returns {Array} Filtered array excluding areas with extreme values
 */
export function filterExtremeAreas(data, extremeAreas) {
	
	if (!extremeAreas) {
		return data;
	}
	
	return data.filter(d => !extremeAreas.includes(d.areacd))

}
