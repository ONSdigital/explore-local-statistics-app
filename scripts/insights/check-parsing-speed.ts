import { readFileSync } from 'fs';
import { csvParse } from 'd3-dsv';

const COOKED_DIR = 'scripts/insights/cooked';
const CSV_DIR = `${COOKED_DIR}/csv`;

const DATA_CSV_PATH = `${CSV_DIR}/combined-data.csv`;
const DATA_PATH = `static/insights/data.json`;
const COLUMN_ORIENTED_DATA_PATH = `static/insights/column-oriented-data.json`;

const ITER_COUNT = 100; // how many times to repeat this timing experiment

main();

function main() {
	let startTime;
	const parseTimes = { csv: [], data: [], columnOrientedData: [] };

	const rawCsv = readFileSync(DATA_CSV_PATH).toString();
	const rawData = readFileSync(DATA_PATH);
	const rawColumnOrientedData = readFileSync(COLUMN_ORIENTED_DATA_PATH);

	for (let i = 0; i < ITER_COUNT; i++) {
		console.log(`Iteration ${i} of ${ITER_COUNT}...`);
		startTime = performance.now();
		const csvData = csvParse(stripBom(rawCsv));
		parseTimes.csv.push(performance.now() - startTime);

		startTime = performance.now();
		const data = JSON.parse(rawData);
		parseTimes.data.push(performance.now() - startTime);

		startTime = performance.now();
		const columnOrientedData = JSON.parse(rawColumnOrientedData);
		columnsToRowsForAllDatasets(columnOrientedData.combinedDataObjectColumnOriented);
		parseTimes.columnOrientedData.push(performance.now() - startTime);
	}

	console.log({
		csv: numbersSummary(parseTimes.csv),
		data: numbersSummary(parseTimes.data),
		columnOrientedData: numbersSummary(parseTimes.columnOrientedData)
	});
}

function columnsToRowsForAllDatasets(datasets) {
	for (const datasetName of Object.keys(datasets)) {
		datasets[datasetName] = columnsToRows(datasets[datasetName]);
	}
}

function columnsToRows(columns: { [x: string]: any[] }) {
	const columnNames = Object.keys(columns);
	const nRows = columns[columnNames[0]].length;
	const rows = [];
	for (let i = 0; i < nRows; i++) {
		rows.push({});
	}
	for (const c of columnNames) {
		const column = columns[c];
		for (let i = 0; i < nRows; i++) {
			rows[i][c] = column[i];
		}
	}

	return rows;
}

function numbersSummary(numbers: number[]) {
	const sum = numbers.reduce((partialSum, a: number) => partialSum + a, 0);
	const mean = sum / numbers.length;
	const min = Math.min(...numbers);
	const max = Math.max(...numbers);
	return { mean, min, max };
}

function stripBom(string: string): string {
	// Based on:
	// https://github.com/sindresorhus/strip-bom/blob/main/index.js
	// (MIT Licence)

	// Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
	// conversion translates it to FEFF (UTF-16 BOM).
	if (string.charCodeAt(0) === 0xfeff) {
		return string.slice(1);
	}

	return string;
}
