const DELIMITER = ',';

// Same quoting rule as d3-dsv's `formatValue` (quote only if the value contains a
// quote, the delimiter, or a line break) but skips its per-cell `Date` check and regex
// test - JSON-Stat values are only ever string/number/null, and numbers can never need
// quoting, so a couple of `indexOf` checks are enough.
function formatValue(value: unknown): string {
	if (value == null) return '';
	if (typeof value === 'number') return String(value);
	const str = String(value);
	if (
		str.indexOf('"') === -1 &&
		str.indexOf(DELIMITER) === -1 &&
		str.indexOf('\n') === -1 &&
		str.indexOf('\r') === -1
	) {
		return str;
	}
	return `"${str.replace(/"/g, '""')}"`;
}

function formatRow(row: Record<string, unknown>, cols: string[]): string {
	let out = formatValue(row[cols[0]]);
	for (let i = 1; i < cols.length; i++) out += DELIMITER + formatValue(row[cols[i]]);
	return out;
}

// Equivalent to d3-dsv's `csvFormat(rows, cols)` with an explicit `cols` array, avoiding
// the per-row array allocation `preformatBody`'s `.map().join()` does.
function csvFormatRows(rows: Record<string, unknown>[], cols: string[]): string {
	const lines = new Array(rows.length + 1);
	lines[0] = cols.map(formatValue).join(DELIMITER);
	for (let i = 0; i < rows.length; i++) lines[i + 1] = formatRow(rows[i], cols);
	return lines.join('\n');
}

// Infer columns from row data. `datasets` is an array of one rows-array per dataset
// (not yet flattened) - every row in a dataset shares the same key set (see
// `colsToRows` in dataFormatters.ts), so it's enough to inspect one row per dataset.
function inferColumns(datasets) {
	const cols = new Set();
	for (const rows of datasets) {
		if (!rows?.length) continue;
		for (const col in rows[0]) cols.add(col);
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
	const cols = sortColumns(inferColumns(datasets));
	const rows = datasets.flat();
	return csvFormatRows(rows, cols);
}
