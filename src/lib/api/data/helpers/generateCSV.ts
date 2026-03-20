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
	const last_cols = ['value', 'lci_95', 'uci_95', 'status'];
	const sorted = [
		...cols.filter((col) => !last_cols.includes(col)),
		...last_cols.filter((col) => cols.includes(col))
	];
	return sorted;
}

// Generate CSV as a text string (to be sent as a file)
export default function generateCSV(datasets) {
	const rows = datasets.flat();
	const cols = sortColumns(inferColumns(rows));
	return csvFormat(rows, cols);
}
