import aq from 'arquero';
import fs from 'fs';

export async function loadCsvWithoutBom(filename: string) {
	const table = await aq.loadCSV(filename, {});
	return table.rename(Object.fromEntries(table.columnNames().map((n) => [n, stripBom(n)])));
}

export async function loadIndicatorCsvWithoutBom(filename: string) {
	let rawJson = fs.readFileSync(filename).toString();

	// Make column names lowercase. It would be nicer to do this after parsing the CSV, but
	// in order to ask Arquero to parse the `period` column as strings I think we need
	// to do the renaming before parsing.
	const rows = rawJson.split('\n');
	rows[0] = stripBom(rows[0].toLowerCase());
	rawJson = rows.join('\n');

	return aq.fromCSV(rawJson, { parse: { period: String } });
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
