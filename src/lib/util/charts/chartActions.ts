/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import html2canvas from 'html2canvas';
import { csvFormatBody } from 'd3-dsv';

function doDownload(dataUrl, filename) {
	const a = document.createElement('a');
	a.href = dataUrl;
	a.download = filename;
	a.click();
}

function makeColumns(data) {
	const cols = [
		{ key: 'areacd', label: 'Area code' },
		{ key: 'areanm', label: 'Area name' },
		{ key: 'year', label: 'Year' },
		{ key: 'value', label: 'Value' }
	];
	const formatKeys = (key) => {
		for (const col of cols) {
			key = key.replace(col.key, col.label);
		}
		return key;
	};
	let keys = Object.keys(data[0]).filter((key) => typeof +key === 'number' && !isNaN(+key));
	keys = keys[0]
		? [...cols.slice(0, 2).map((col) => col.key), ...keys]
		: cols.map((col) => col.key);
	const labels = keys.map(formatKeys);
	return { keys, labels };
}

export function downloadCSV(data, filename = 'data.csv') {
	const cols = makeColumns(data);
	const csv = `${cols.labels.join(',')}\n${csvFormatBody(data, cols.keys)}`;

	const url = window.URL || window.webkitURL || window;
	const blob = new Blob([csv], { type: 'text/csv' });
	doDownload(url.createObjectURL(blob), filename);
}

export async function downloadPNG(el, filename = 'chart.png') {
	html2canvas(el, { windowWidth: el.scrollWidth, windowHeight: el.scrollHeight }).then((canvas) =>
		doDownload(canvas.toDataURL(), filename)
	);
}
