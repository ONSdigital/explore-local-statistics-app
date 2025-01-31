/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { csvParse, autoType } from 'd3-dsv';

const stripBom = (str) => {
	if (str.charCodeAt(0) === 0xfeff) return str.slice(1);
	return str;
};

// Load CSV data. Cells with "|" characters split into arrays.
export async function getCSV(url, fetch = window.fetch) {
	const str = await (await fetch(url)).text();
	return parseCSV(str);
}

// Parse CSV data. Cells with "|" characters split into arrays.
export async function parseCSV(csv: string) {
	const data = csvParse(stripBom(csv), autoType);
	const cols = data.columns.filter((c) => {
		data[0][c] && String(data[0][c]).includes('|');
	});
	for (const d of data) {
		for (const c of cols) d[c] = d[c].split('|');
	}
	return data;
}
