import { scaleLinear } from 'd3-scale';
import { AccurateBeeswarm } from 'accurate-beeswarm-plot';
import parse from 'parse-color';

// Gets the median for a sorted array of numbers
export function median(xs) {
	if (xs.length === 0) {
		throw new Error("Can't compute median of an empty array.");
	}

	if (xs.length % 2) {
		// The array has an odd number of elements
		return xs[Math.floor(xs.length / 2)];
	}

	// The array has an even number of elements
	const position = Math.floor(xs.length / 2);
	const a = xs[position - 1];
	const b = xs[position];
	return (a + b) / 2;
}

// Returns the median and MAD for a sorted array of numbers
export function medMad(xs, constant = 1.4826) {
	const med = median(xs);
	const absDeviations = xs.map((x) => Math.abs(x - med));
	const mad = constant * median([...absDeviations].sort((a, b) => a - b));
	return { med, mad };
}

export function parseChartData(
	data,
	valueKey = 'value',
	periodKey = 'period',
	idKey = 'areacd',
	sortByValue = false
) {
	if (!data || data?.message) return null; // No data
	if (!data[valueKey] || !data[periodKey] || !data[idKey]) return null; // Dimensions missing from data

	const array = [];
	const keyed = {};
	const valueDomain = [Infinity, -Infinity];
	const dateDomain = [Infinity, -Infinity];

	const hasConfidenceIntervals = data.lci_95 && data.uci_95;
	const minValueKey = hasConfidenceIntervals ? 'lci_95' : valueKey;
	const maxValueKey = hasConfidenceIntervals ? 'uci_95' : valueKey;

	const cols = Object.keys(data);
	for (let i = 0; i < data[cols[0]].length; i++) {
		if (data[valueKey][i] == null) continue;

		const row = {};
		for (const col of cols) row[col] = data[col][i];
		row.date = new Date(row[periodKey].slice(0, 10));

		const minVal = row[minValueKey];
		const maxVal = row[maxValueKey];
		const valid = (d) => d !== null && d !== undefined && d !== '';

		if (valid(minVal)) valueDomain[0] = Math.min(valueDomain[0], minVal);
		if (valid(maxVal)) valueDomain[1] = Math.max(valueDomain[1], maxVal);
		if (row.date < dateDomain[0]) dateDomain[0] = row.date;
		if (row.date > dateDomain[1]) dateDomain[1] = row.date;

		if (!keyed[row[idKey]]) keyed[row[idKey]] = [];
		keyed[row[idKey]].push(row);
		array.push(row);
	}

	return {
		array: sortByValue ? array.sort((a, b) => b[valueKey] - a[valueKey]) : array,
		keyed,
		valueDomain,
		dateDomain
	};
}

export function parseBeeswarmData(data, xKey, zKey, width = 400, height = 100, radius = 3) {
	if (!data || data?.message) return null;
	if (!data[xKey] || !data[zKey]) return null; // Dimensions missing from data

	const vals = data[xKey].filter((d) => d != null);
	const sorted = [...vals].sort((a, b) => a - b);
	const { med, mad } = medMad(sorted);
	const xLo = med - 3 * mad;
	const xHi = med + 3 * mad;
	const domain = [
		xLo < sorted[0] ? sorted[0] : xLo,
		xHi > sorted[sorted.length - 1] ? sorted[sorted.length - 1] : xHi
	];
	const range = [0, width];

	const scale = scaleLinear().domain(domain).range(range).clamp(true);
	const points = new AccurateBeeswarm(vals, radius, (val) => scale(val))
		.oneSided()
		.calculateYPositions();
	const yMax = Math.max(...points.map((p) => p.y));
	const xScaleFactor = 100 / width;
	const yScaleFactor = yMax > height ? height / yMax : 1;

	const array = [];
	const keyed = {};
	const cols = Object.keys(data);

	for (let i = 0; i < data[cols[0]].length; i++) {
		if (data[xKey][i] == null) continue;

		const row = {};
		for (const col of cols) row[col] = data[col][i];
		row.x = points[i].x * xScaleFactor;
		row.y = points[i].y * yScaleFactor;

		array.push(row);
		keyed[row[zKey]] = row;
	}

	return { array, keyed, median: med, mad, domain };
}

export function parsePyramidData(
	data: jsonDataCols,
	idKey: string,
	groupKey: string = 'sex',
	categoryKey: string = 'age'
) {
	if (!data || data?.message) return null;

	const keyed: { [key: string]: jsonDataRow[] } = {};
	const array: jsonDataRow[] = [];
	const cols = Object.keys(data);
	const valueCols = cols.slice(3).filter((col) => ![groupKey, categoryKey].includes(col));

	const groupDomain = new Set();
	const categoryDomain = new Set();
	let maxValue = 0;

	for (let i = 0; i < data[cols[0]].length; i++) {
		const key = data[idKey][i];
		if (!keyed[key]) keyed[key] = [];
		const row = {};
		for (const col of cols) row[col] = data[col][i];
		for (const col of valueCols) {
			if (data[col][i] > maxValue) maxValue = data[col][i];
		}
		keyed[key].push(row);
		array.push(row);
		groupDomain.add(data[groupKey][i]);
		categoryDomain.add(data[categoryKey][i]);
	}
	return {
		array,
		keyed,
		keysLength: Object.keys(keyed).length,
		valueDomain: [0, maxValue],
		groupDomain: Array.from(groupDomain).sort((a, b) => a.localeCompare(b, 'en-GB')),
		categoryDomain: Array.from(categoryDomain)
	};
}

export function getChartTypesForIndicator(indicator = null) {
	const chartTypes = [];
	if (!indicator || indicator.standardised) chartTypes.push({ key: 'map', label: 'Map' });
	if (!indicator || indicator.hasTimeseries) chartTypes.push({ key: 'line', label: 'Line chart' });
	return [...chartTypes, { key: 'bar', label: 'Bar chart' }, { key: 'table', label: 'Table' }];
}

export const contrastColor = (color) => {
	if (!color || typeof color !== 'string') return 'black';
	const rgb = parse(color).rgb;
	if (rgb) {
		const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
		return brightness > 125 ? 'black' : 'white';
	}
	return 'black';
};

export function makeCurlyBrace(x1, y1, x2, y2, w, q) {
	//Calculate unit vector
	var dx = x1 - x2;
	var dy = y1 - y2;
	var len = Math.sqrt(dx * dx + dy * dy);
	dx = dx / len;
	dy = dy / len;

	//Calculate Control Points of path,
	var qx1 = x1 + q * w * dy;
	var qy1 = y1 - q * w * dx;
	var qx2 = x1 - 0.25 * len * dx + (1 - q) * w * dy;
	var qy2 = y1 - 0.25 * len * dy - (1 - q) * w * dx;
	var tx1 = x1 - 0.5 * len * dx + w * dy;
	var ty1 = y1 - 0.5 * len * dy - w * dx;
	var qx3 = x2 + q * w * dy;
	var qy3 = y2 - q * w * dx;
	var qx4 = x1 - 0.75 * len * dx + (1 - q) * w * dy;
	var qy4 = y1 - 0.75 * len * dy - (1 - q) * w * dx;

	return (
		'M ' +
		x1 +
		' ' +
		y1 +
		' Q ' +
		qx1 +
		' ' +
		qy1 +
		' ' +
		qx2 +
		' ' +
		qy2 +
		' T ' +
		tx1 +
		' ' +
		ty1 +
		' M ' +
		x2 +
		' ' +
		y2 +
		' Q ' +
		qx3 +
		' ' +
		qy3 +
		' ' +
		qx4 +
		' ' +
		qy4 +
		' T ' +
		tx1 +
		' ' +
		ty1
	);
}
