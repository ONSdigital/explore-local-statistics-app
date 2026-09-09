// A comma, not a generic delimiter - this replaces d3-dsv's `csvFormat`, which is
// always called with the default comma delimiter here. See `csvFormatRows` below for
// why this is hand-rolled rather than delegated to the library.
const DELIMITER = ',';

// Same quoting rule as d3-dsv's `formatValue` (quote only if the value contains a
// quote, the delimiter, or a line break; double any internal quotes) but without the
// per-cell cost the library pays on every one of a large download's cells:
//   - `value instanceof Date` - always false here, our row values are the string/number/
//     null values a JSON-Stat cube produces, never Date objects
//   - `value += ""` - unconditional string coercion, even for values already strings
//   - a regex `.test()` per cell - a couple of `indexOf` checks do the same job for a
//     single, known delimiter character, without regex engine call overhead
// Numbers skip the quoting check entirely: a JS number's string form never contains a
// quote, comma or line break, so there's nothing to check.
// Profiled: this was ~86% of `generateCSV`'s total time on a large real download,
// almost entirely inside d3-dsv's own `formatValue`/`preformatBody`/`format`.
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

// Equivalent to d3-dsv's `csvFormat(rows, cols)`, given an explicit (non-null) `cols`
// array - which is the only way this is ever called here (see `generateCSV` below).
// Avoids the per-row `columns.map(...).join(delimiter)` d3-dsv's `preformatBody` does
// (one array allocation per row) in favour of direct string concatenation.
function csvFormatRows(rows: Record<string, unknown>[], cols: string[]): string {
	const lines = new Array(rows.length + 1);
	lines[0] = cols.map(formatValue).join(DELIMITER);
	for (let i = 0; i < rows.length; i++) lines[i + 1] = formatRow(rows[i], cols);
	return lines.join('\n');
}

// Infer columns from row data. `datasets` is an array of one rows-array per dataset
// (not yet flattened) - every row within a single dataset is built from the same fixed
// key set (see `colsToRows` in dataFormatters.ts, which always writes every declared
// column onto every row), so it's enough to inspect one row per dataset rather than
// scanning every row across every dataset - profiled as ~8% of total generateCSV time
// for a large single-dataset download, entirely avoidable since the extra rows never
// contribute a new key.
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
