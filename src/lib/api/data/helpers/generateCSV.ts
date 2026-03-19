import { csvFormat } from 'd3-dsv';

// Infer columns from row data
function inferColumns(rows) {
	const cols = new Set();
	for (const row of rows) {
		for (const col in row) cols.add(col);
	}
	return Array.from(cols);
}

// Sort order of columns for CSV output
function sortColumns(cols) {
	return cols.includes('status') ? [...cols.filter((col) => col !== 'status'), 'status'] : cols;
}

// Generate CSV as a text string (to be sent as a file)
export default function generateCSV(datasets) {
	const rows = datasets.flat();
	const cols = sortColumns(inferColumns(rows));
	return csvFormat(rows, cols);
}
