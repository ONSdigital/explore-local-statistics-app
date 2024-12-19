/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import ckmeans from 'ckmeans';

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
	const breaks = uniqueRoundedNumbers({numbers:[...ckmeans(values, Math.min(values.length, 5)), values[values.length - 1]],decimalPlaces:0});
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
		}),
	  ),
	];
  }