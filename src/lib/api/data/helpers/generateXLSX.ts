import { Workbook, Worksheet, Cell, Row, Column, Table } from 'documonster/excel';
import type { Font, WorkbookView } from 'documonster/excel';
import { toWords } from '@onsvisual/robo-utils';

// The library's own default (Excel's own default, Calibri 11) isn't what this workbook
// should look like - ONS branding is Arial 12. `Workbook.getModel`/`setModel`'s
// `defaultFont` field (set in `dataToSpreadsheet` below) replaces the exceljs version's
// monkey-patch of an internal `StylesXform` class to the same end (see
// https://github.com/exceljs/exceljs/issues/572#issuecomment-631788521).
//
// That default only applies to genuinely unstyled cells, though: the moment a cell gets
// *any* explicit font property, it gets its own independent font record that does not
// inherit from the default - `Cell.setFont(ws, addr, { bold: true })` alone renders in
// Excel's own default face (Calibri), not Arial. So every explicit font override below
// still spreads `...defaultFont` in alongside whatever it's actually overriding.
const defaultFont: Partial<Font> = {
	size: 12,
	color: { theme: 1 },
	name: 'Arial',
	family: 2,
	scheme: 'minor'
};

// documonster's public `TableStyleProperties.theme` type is `string | undefined`, but the
// runtime genuinely distinguishes `null` from `undefined`: passing `null` is what suppresses
// the library's own default table theme (`TableStyleMedium2`) - omitting the key, or passing
// `undefined`, falls back to it (verified against `table-style-info-xform.js`). There is no
// type that expresses this, so it's cast at the one place it's needed.
const noTableTheme = null as unknown as string;

const oneTableMessage = 'This worksheet contains one table.';
const statusMessage =
	'Some shorthand is used in this table, [x] = unavailable, [c] = confidential and [u] = low reliability.';

// This function grabs the metadata from the JSON-Stat required to populate the XLSX spreadsheet
export function getSpreadsheetMetadata(ds, dims) {
	const meta = {
		sheetName: ds.label,
		tableName: ds.extension.slug.replaceAll('-', '_').replace(/\d/g, (str) => toWords(str)),
		note: ds.extension.description,
		measures: new Set(),
		unit: ds.extension.unit,
		decimalPlaces: ds.extension.decimalPlaces,
		subtitle: ds.extension.subtitle,
		source: ds.extension.source,
		colLookup: {
			areanm: 'Area name',
			status: 'Status'
		},
		uniquePeriods: dims.find((d) => d.key === 'period').values.map((v) => v[0])
	};
	for (const key in ds.dimension) meta.colLookup[key] = ds.dimension[key].label;
	for (const key in ds.dimension.measure.category.label) {
		meta.colLookup[key] = ds.dimension.measure.category.label[key] || null;
		meta.measures.add(key);
	}
	return meta;
}

function addTextRow(sheet, text, options = {}) {
	const row = Worksheet.rowCount(sheet) + 1;
	if (text.startsWith('# ')) {
		Cell.setValue(sheet, row, 1, text.slice(2));
		Cell.setFont(sheet, row, 1, { ...defaultFont, size: 18, bold: true });
	} else if (text.startsWith('## ')) {
		Row.setHeight(sheet, row, 40);
		Cell.setValue(sheet, row, 1, text.slice(3));
		Cell.setFont(sheet, row, 1, { ...defaultFont, size: 14, bold: true });
	} else if (text.startsWith('[')) {
		Cell.setValue(sheet, row, 1, {
			text: text.match(/(?<=\[).*(?=\])/)[0],
			hyperlink: text.match(/(?<=\().*(?=\))/)[0]
		});
		Cell.setFont(sheet, row, 1, { ...defaultFont, underline: true, color: { argb: '0000FF' } });
	} else {
		// Plain text - no explicit font needed, this inherits the workbook's default font.
		Cell.setValue(sheet, row, 1, text);
	}
	if (options.height) Row.setHeight(sheet, row, options.height);
	if (options.alignment) Row.setAlignment(sheet, row, options.alignment);
}

function formatTableData(ds) {
	const columns: spreadsheetTableCol[] = [];
	const columnsLookup: { [key: string]: spreadsheetTableCol } = {};
	const rows: { [key: string]: spreadsheetTableRow } = {};

	const colKeys = Object.keys(ds.data[1]).filter(
		(key) => !['period', 'value', 'status'].includes(key)
	);
	let i = 0;
	for (const key of [...colKeys, ...ds.meta.uniquePeriods]) {
		const isNumeric = ds.meta.uniquePeriods.includes(key);
		const column = {
			index: i,
			key,
			heading: isNumeric
				? `${key}${ds.meta.unit ? ` (${ds.meta.unit})` : ''}`
				: ds.meta.colLookup[key] || key,
			...(isNumeric
				? {
						format: ds.meta.decimalPlaces
							? '#,##0.'.padEnd(ds.meta.decimalPlaces + 6, '0')
							: '#,##0'
					}
				: {})
		};
		columns.push(column);
		columnsLookup[key] = column;
		i++;
	}

	const data = ds.data[1];
	const hasStatusCol = 'status' in data;
	// Avoid the array allocation `.map().join('_')` did per row (profiled as a measurable
	// cost - see CPU profile notes). The single-key case (the common one - most indicators
	// have just `areacd`) skips the join entirely; the general case avoids the intermediate
	// array `.map()` creates.
	const getRowKey =
		colKeys.length === 1
			? (data, i, keys) => data[keys[0]][i]
			: (data, i, keys) => {
					let key = data[keys[0]][i];
					for (let k = 1; k < keys.length; k++) key += `_${data[keys[k]][i]}`;
					return key;
				};
	const getValue = hasStatusCol
		? (i) => (data.value[i] != null ? data.value[i] : data.status[i] ? `[${data.status[i]}]` : null)
		: (i) => data.value[i];

	for (let i = 0; i < data[colKeys[0]].length; i++) {
		const rowKey = getRowKey(data, i, colKeys);
		if (!rows[rowKey]) {
			rows[rowKey] = Array(columns.length).fill(null);
			for (let j = 0; j < colKeys.length; j++) rows[rowKey][j] = data[colKeys[j]][i];
		}
		rows[rowKey][columnsLookup[data.period[i]].index] = getValue(i);
	}

	return { columns, rows: Object.values(rows) };
}

function getColWidth(values = null) {
	const maxColWidth = 28;
	const minColWidth = 12;

	if (!values) return minColWidth;

	let maxLength = 0;
	for (let i = 0; i < values.length; i++) {
		const length = String(values[i]).length;
		if (length > maxLength) maxLength = length;
	}
	return maxLength < minColWidth ? minColWidth : maxLength > maxColWidth ? maxColWidth : maxLength;
}

export async function dataToSpreadsheet(data) {
	const workbook = Workbook.create();

	// Sets the actual workbook-wide default font (only genuinely unstyled cells pick
	// this up - see the comment on `defaultFont` above).
	const model = Workbook.getModel(workbook);
	model.defaultFont = defaultFont;
	Workbook.setModel(workbook, model);

	workbook.title = data.coverSheetTitle;
	workbook.creator = data.creator;
	workbook.lastModifiedBy = data.creator;
	workbook.created = data.created;
	workbook.modified = data.created;

	const coverSheet = Workbook.addWorksheet(workbook, 'Cover_sheet');
	Worksheet.setColumns(coverSheet, [{ width: 80, style: { alignment: { wrapText: true } } }]);
	addTextRow(coverSheet, `# ${data.coverSheetTitle}`);

	for (let i = 0; i < data.coverSheetContents.length; i++) {
		addTextRow(coverSheet, data.coverSheetContents[i]);
	}

	const contentsSheet = Workbook.addWorksheet(workbook, 'Table_of_contents');
	Worksheet.setColumns(contentsSheet, [{ width: 10 }, { width: 70 }]);
	addTextRow(contentsSheet, `# Table of contents`);
	addTextRow(contentsSheet, oneTableMessage, { height: 40, alignment: { vertical: 'top' } });
	Table.add(contentsSheet, {
		name: 'table_of_contents',
		ref: 'A3',
		headerRow: true,
		style: {
			theme: noTableTheme,
			showRowStripes: false
		},
		// `filterButton: false` on every column - Excel adds a filter dropdown to each
		// table header automatically; GOV.UK accessibility guidance requires this be
		// turned off (analysisfunction.civilservice.gov.uk "Making spreadsheets
		// accessible: a brief checklist of the basics"). This is a known trigger for
		// documonster's own dev-mode OOXML self-check (every column with a bare
		// `filterButton: false` matches a pattern it flags as "Excel drops tables with
		// a fully-hidden autoFilter on load") - verified against real Excel to open
		// correctly with the table intact, so the warning is expected and not a bug.
		columns: [
			{
				name: 'Table',
				style: { font: { ...defaultFont, underline: true, color: { argb: '0000FF' } } },
				filterButton: false
			},
			{ name: 'Name', style: { alignment: { wrapText: true } }, filterButton: false }
		],
		rows: data.sheets.map((d, i) => [
			{
				text: `Table ${i + 1}`,
				hyperlink: `#'${i + 1}'!A1`
			},
			d.sheetName
		])
	});
	Row.setFont(contentsSheet, 3, { ...defaultFont, bold: true });

	if (data.notes.length > 0) {
		const notesSheet = Workbook.addWorksheet(workbook, 'Notes');
		Worksheet.setColumns(notesSheet, [{ width: 10 }, { width: 70 }]);
		addTextRow(notesSheet, `# Notes`);
		addTextRow(notesSheet, oneTableMessage, { height: 40, alignment: { vertical: 'top' } });
		Table.add(notesSheet, {
			name: 'notes',
			ref: 'A3',
			headerRow: true,
			style: {
				theme: noTableTheme,
				showRowStripes: false
			},
			columns: [
				{ name: 'Number', filterButton: false },
				{ name: 'Note', style: { alignment: { wrapText: true } }, filterButton: false }
			],
			rows: data.notes.map((n) => [n.name, n.text])
		});
		Row.setFont(notesSheet, 3, { ...defaultFont, bold: true });
	}

	for (let i = 0; i < data.sheets.length; i++) {
		const s = data.sheets[i];
		const sheet = Workbook.addWorksheet(workbook, String(i + 1));

		addTextRow(sheet, `# ${s.sheetName}`);
		for (let j = 0; j < s.sheetIntroText.length; j++) {
			addTextRow(
				sheet,
				`${s.sheetIntroText[j]}`,
				j === s.sheetIntroText.length - 1 ? { height: 40, alignment: { vertical: 'top' } } : {}
			);
		}

		const tableRowNumber = Worksheet.rowCount(sheet) + 1;
		Table.add(sheet, {
			name: s.tableName,
			ref: `A${tableRowNumber}`,
			headerRow: true,
			style: {
				theme: noTableTheme,
				showRowStripes: false
			},
			columns: s.columns.map((c) => ({ name: c.heading, filterButton: false })),
			rows: s.rows
		});
		for (let i = 0; i < s.columns.length; i++) {
			const meta = s.columns[i];
			const colNumber = i + 1;
			if (meta.format) {
				Column.setNumFmt(sheet, colNumber, meta.format);
				Column.setWidth(sheet, colNumber, getColWidth());
			} else {
				Column.setWidth(sheet, colNumber, getColWidth(s.rows.map((d) => d[i])));
			}
		}
		Row.setFont(sheet, tableRowNumber, { ...defaultFont, bold: true });
		Row.setAlignment(sheet, tableRowNumber, { wrapText: true });
	}

	// `activeCell` isn't part of a workbook-level view in documonster's `WorkbookView` type
	// (it's a worksheet-level `sheetView` concept in the OOXML spec) - the exceljs version of
	// this call included it, but nothing reads a workbook-level `activeCell`, so dropping it
	// changes nothing observable. `WorkbookView` requires every field, so the partial object
	// (documonster merges a partial view onto its own defaults) is cast here.
	workbook.views = [{ activeTab: 0 } as WorkbookView];

	return Workbook.toBuffer(workbook);
}

// This function generates an ODS spreadsheet given data and metadata for a series of datasets
export default async function generateXLSX(datasets) {
	// Note: This cover sheet is currently hard-coded. Possibly better to move somewhere else?
	const data: spreadsheetData = {
		creator: 'Office for National Statistics',
		created: new Date(),
		coverSheetTitle: 'Explore Local Statistics data',
		coverSheetContents: [
			'## Source',
			'Office for National Statistics (ONS) and other producers of official statistics.',
			`Spreadsheet generated on ${new Date().toLocaleDateString('en-GB')} by the Explore Local Statistics service.`,
			'[Visit Explore Local Statistics on the ONS website](https://www.ons.gov.uk)',
			'## Notes',
			'Some cells are blank, indicating unavailable data.',
			"Dates follow the ISO 8601 standard, using a 'YYYY-MM-DD' format. Some dates express time periods in an extended 'YYYY-MM-DD/PnI' format, where 'P' means it's a period, 'n' is the number of time units and 'I' is the type of time unit (Y = year, M = month, W = week, D = day).",
			'## Quality and methodology',
			'Details of the Explore Local Statistics service are available at the link below, including its strengths and limitations, methods used, data uses and users.',
			'[Quality and methodology information](https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandwellbeing/methodologies/explorelocalstatisticsserviceqmi)'
		],
		notes: [],
		sheets: []
	};

	let i = 0;
	for (const ds of datasets) {
		if (ds.meta.note) {
			i++;
			data.notes.push({
				name: `note ${i}`,
				text: ds.meta.note
			});
		}

		const { columns, rows } = formatTableData(ds);
		const hasStatus = 'status' in ds.data[1];

		data.sheets.push({
			sheetName: ds.meta.note ? `${ds.meta.sheetName} [note ${i}]` : ds.meta.sheetName,
			tableName: ds.meta.tableName,
			sheetIntroText: [
				ds.meta.subtitle,
				...ds.meta.source.map(
					(s, j) =>
						`[Source${ds.meta.source.length > 1 ? ` ${j + 1}` : ''}: ${s.name}, published on ${s.date.split('-').reverse().join('/')}](${s.href})`
				),
				oneTableMessage,
				...(hasStatus ? [statusMessage] : [])
			],
			columns,
			rows
		});
	}

	return await dataToSpreadsheet(data);
}
