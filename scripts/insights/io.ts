import aq from 'arquero';
import fs, { writeFileSync } from 'fs';
import { csvParse } from 'd3-dsv';

export function loadCsvWithoutBom(filename: string, options = {}) {
	return aq.from(readCsvAutoType(filename, options));
}

export function readCsvAutoType(filename: string, { stringColumns = [] } = {}) {
	const raw = fs.readFileSync(filename);
	const result = csvParse(stripBom(raw.toString()), autoTypeWithoutDates);

	for (const columnName of stringColumns) {
		if (!result.columns.includes(columnName)) continue;
		for (const row of result) {
			if (row[columnName] !== null) {
				row[columnName] = String(row[columnName]);
			}
		}
	}

	for (const columnName of result.columns) {
		const typesSeen = { number: false, string: false, boolean: false, undefined: false };
		let nullSeen = false;
		for (const row of result) {
			const value = row[columnName];
			if (value === null) {
				nullSeen = true;
				continue;
			}
			const type = typeof value;
			if (!(type in typesSeen)) {
				throw new Error(`Unexpected type in CSV value ${value}: ${type} (in file ${filename}).`);
			}
			typesSeen[type] = true;
		}
		const numberOfTypesSeen = Object.values(typesSeen).reduce((a, b) => a + (b ? 1 : 0), 0);
		if (numberOfTypesSeen > 1) {
			throw new Error(`More than one type exists in column ${columnName} in file ${filename}.`);
		}
	}

	return result;
}

// A modified version of
// https://github.com/d3/d3-dsv/blob/main/src/autoType.js
// that always leaves dates as strings.
function autoTypeWithoutDates(object: { [key: string]: any }) {
	for (const key in object) {
		const value = object[key].trim();
		if (!value) object[key] = null;
		else if (value === 'true') object[key] = true;
		else if (value === 'false') object[key] = false;
		else if (value === 'NaN') object[key] = NaN;
		else if (!isNaN(+value)) object[key] = +value;
	}
	return object;
}

export function readJsonSync(filename: string) {
	return JSON.parse(fs.readFileSync(filename).toString());
}

export function writeJson(filename, data, { minify = false } = {}) {
	const jsonString = minify ? JSON.stringify(data) : JSON.stringify(data, null, '\t');
	writeFileSync(filename, jsonString);
	//console.log(`Wrote ${filename}.`);
}

function stripBom(string: string): string {
	// Based on:
	// https://github.com/sindresorhus/strip-bom/blob/main/index.js
	// (MIT Licence)
	// Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
	// conversion translates it to FEFF (UTF-16 BOM).
	if (string.charCodeAt(0) === 65279) {
		return string.slice(1);
	}

	return string;
}
