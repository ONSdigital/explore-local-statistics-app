import aq from 'arquero';
import fs from 'fs';
import { csvParse } from 'd3-dsv';

export function loadCsvWithoutBom(filename: string) {
	return aq.from(readCsvAutoType(filename));
}

export function readCsvAutoType(filename: string) {
	const raw = fs.readFileSync(filename);
	return csvParse(stripBom(raw.toString()), autoTypeWithoutDates);
}

// A modified version of
// https://github.com/d3/d3-dsv/blob/main/src/autoType.js
// , which always leaves dates as strings.
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
