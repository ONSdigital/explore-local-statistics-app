// Workaround to override default font + size in ExcelJS
// See issue: https://github.com/exceljs/exceljs/issues/572#issuecomment-631788521
import StylesXform from 'exceljs/lib/xlsx/xform/style/styles-xform.js';
const defaultFont = { size: 12, color: { theme: 1 }, name: 'Arial', family: 2, scheme: 'minor' };
const origStylesXformInit = StylesXform.prototype.init;
StylesXform.prototype.init = function () {
	origStylesXformInit.apply(this, arguments);
	this._addFont(defaultFont);
};

import ExcelJS from 'exceljs';
import { PassThrough } from 'node:stream';
import { toWords } from '@onsvisual/robo-utils';

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
	const row = sheet.getRow(sheet.rowCount + 1);
	const cell = row.getCell(1);
	if (text.startsWith('# ')) {
		cell.value = text.slice(2);
		cell.font = { ...defaultFont, size: 18, bold: true };
	} else if (text.startsWith('## ')) {
		row.height = 40;
		cell.value = text.slice(3);
		cell.font = { ...defaultFont, size: 14, bold: true };
	} else if (text.startsWith('[')) {
		cell.value = {
			text: text.match(/(?<=\[).*(?=\])/)[0],
			hyperlink: text.match(/(?<=\().*(?=\))/)[0]
		};
		cell.font = { ...defaultFont, underline: true, color: { argb: '0000FF' } };
	} else {
		cell.value = text;
	}
	if (options.height) row.height = options.height;
	if (options.alignment) row.alignment = options.alignment;
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
							: '#,###'
					}
				: {})
		};
		columns.push(column);
		columnsLookup[key] = column;
		i++;
	}

	const data = ds.data[1];
	const hasStatusCol = 'status' in data;
	const getRowKey = (data, i, keys) => keys.map((key) => data[key][i]).join('_');
	const getValue = hasStatusCol
		? (i) => data.value[i] || (data.status[i] ? `[${data.status[i]}]` : null)
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
	const workbook = new ExcelJS.Workbook();

	workbook.creator = data.creator;
	workbook.lastModifiedBy = data.creator;
	workbook.created = data.created;
	workbook.modified = data.created;

	const coverSheet = workbook.addWorksheet('Cover sheet');
	coverSheet.columns = [{ width: 80, style: { alignment: { wrapText: true } } }];
	addTextRow(coverSheet, `# ${data.coverSheetTitle}`);

	for (let i = 0; i < data.coverSheetContents.length; i++) {
		addTextRow(coverSheet, data.coverSheetContents[i]);
	}

	const contentsSheet = workbook.addWorksheet('Table of contents');
	contentsSheet.columns = [{ width: 10 }, { width: 70 }];
	addTextRow(contentsSheet, `# Table of contents`);
	addTextRow(contentsSheet, oneTableMessage, { height: 40, alignment: { vertical: 'top' } });
	contentsSheet.addTable({
		name: 'table_of_contents',
		ref: 'A3',
		headerRow: true,
		style: {
			theme: null,
			showRowStripes: false
		},
		columns: [
			{ name: 'Table', style: { font: { underline: true, color: { argb: '0000FF' } } } },
			{ name: 'Name', style: { alignment: { wrapText: true } } }
		],
		rows: data.sheets.map((d, i) => [
			{
				text: `Table ${i + 1}`,
				hyperlink: `#'${i + 1}'!A1`
			},
			d.sheetName
		])
	});
	contentsSheet.getRow(3).font = { ...defaultFont, bold: true };

	if (data.notes.length > 0) {
		const notesSheet = workbook.addWorksheet('Notes');
		notesSheet.columns = [{ width: 10 }, { width: 70 }];
		addTextRow(notesSheet, `# Notes`);
		addTextRow(notesSheet, oneTableMessage, { height: 40, alignment: { vertical: 'top' } });
		notesSheet.addTable({
			name: 'notes',
			ref: 'A3',
			headerRow: true,
			style: {
				theme: null,
				showRowStripes: false
			},
			columns: [{ name: 'Number' }, { name: 'Note', style: { alignment: { wrapText: true } } }],
			rows: data.notes.map((n) => [n.name, n.text])
		});
		notesSheet.getRow(3).font = { ...defaultFont, bold: true };
	}

	for (let i = 0; i < data.sheets.length; i++) {
		const s = data.sheets[i];
		const sheet = workbook.addWorksheet(String(i + 1));

		addTextRow(sheet, `# ${s.sheetName}`);
		for (let j = 0; j < s.sheetIntroText.length; j++) {
			addTextRow(
				sheet,
				`${s.sheetIntroText[j]}`,
				j === s.sheetIntroText.length - 1 ? { height: 40, alignment: { vertical: 'top' } } : {}
			);
		}

		const tableRowNumber = sheet.rowCount + 1;
		sheet.addTable({
			name: s.tableName,
			ref: `A${tableRowNumber}`,
			headerRow: true,
			style: {
				theme: null,
				showRowStripes: false
			},
			columns: s.columns.map((c) => ({ name: c.heading })),
			rows: s.rows
		});
		sheet.getRow(tableRowNumber).font = { ...defaultFont, bold: true };
		sheet.getRow(tableRowNumber).alignment = { wrapText: true };

		for (let i = 0; i < s.columns.length; i++) {
			const meta = s.columns[i];
			const col = sheet.getColumn(i + 1);
			if (meta.format) {
				col.numFmt = meta.format;
				col.width = getColWidth();
			} else {
				col.width = getColWidth(s.rows.map((d) => d[i]));
			}
		}
	}

	const stream = new PassThrough();
	await workbook.xlsx.write(stream);

	return stream;
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
			"Dates follow the ISO 8601 standard. Some use an extended 'YYYY-MM-DD/PnI' format, where 'P' means it's a period, 'n' is the number of time units and 'I' is the type of time unit (Y = year, M = month, W = week, D = day).",
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
