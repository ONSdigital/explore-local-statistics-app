import aq from 'arquero';
import fs from 'fs';

export function loadCsvWithoutBom(filename: string) {
	const rawCsv = stripBom(fs.readFileSync(filename).toString());
	return aq.fromCSV(rawCsv);
}

export function loadIndicatorCsvWithoutBom(filename: string) {
	let rawCsv = fs.readFileSync(filename).toString();

	// Make column names lowercase. It would be nicer to do this after parsing the CSV, but
	// in order to ask Arquero to parse the `period` column as strings I think we need
	// to do the renaming before parsing.
	const rows = rawCsv.split('\n');
	rows[0] = stripBom(rows[0].toLowerCase());
	rawCsv = rows.join('\n');

	return aq.fromCSV(rawCsv, { parse: { period: String } });
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
