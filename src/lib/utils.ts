import { resolve } from '$app/paths';
import { format } from 'd3-format';
import { utcFormat } from 'd3-time-format';
import { geoLevels } from './config/geoLevels';
import { feature } from 'topojson-client';
import { ckmeans } from 'simple-statistics';
import { oldGeoCodesLookup } from './config/geoLookups';
import { geoLevelsAllLookup } from '$lib/config/geoLevels';

export function parseData(data: jsonDataCols) {
	const cols = Object.keys(data);
	const rows: jsonDataRow[] = [];

	for (let i = 0; i < data[cols[0]].length; i++) {
		const row: jsonDataRow = {};
		for (const col of cols) row[col] = data[col][i];
		// row.areanm = areaLookup[row.areacd].areanm;
		rows.push(row);
	}
	return rows;
}

export function parseDataKeyed(data: jsonDataCols, zKey: string, rowTemplate: jsonDataRow = {}) {
	if (data.message) return { keyed: {}, array: [] };
	const keyed: jsonDataRowsKeyed = {};
	const array: jsonDataRow[] = [];
	const cols = Object.keys(data);
	for (let i = 0; i < data[cols[0]].length; i++) {
		const row: jsonDataRow = { ...rowTemplate };
		for (const col of cols) row[col] = data[col][i];
		row.time = new Date(data.period[i].split('/')[0]);
		if (!keyed[data[zKey][i]]) keyed[data[zKey][i]] = [];
		keyed[data[zKey][i]].push(row);
		array.push(row);
	}
	return { keyed, array };
}

export function makeValueFormatter(dp) {
	return format(`,.${dp ?? 0}f`);
}

export function parsePeriod(period) {
	if (typeof period === 'string') return new Date(period.split('/')[0]);
	return period;
}

export function makePeriodFormatter(periodFormat: string) {
	const range = +periodFormat?.match?.(/^\d+/)?.[0];
	const formatter =
		periodFormat === 'month'
			? utcFormat('%b %Y')
			: periodFormat === 'quarter'
				? utcFormat('Q%q %Y')
				: periodFormat === 'year'
					? utcFormat('%Y')
					: periodFormat === 'academic-year'
						? (d) => {
								const year = d.getFullYear();
								return `AY ${year}-${(year + 1) % 100}`;
							}
						: periodFormat === 'financial-year'
							? (d) => {
									const year = d.getFullYear();
									return `FY ${year}-${String((year + 1) % 100).padStart(2, '0')}`;
								}
							: range
								? (d) => {
										const year = d.getFullYear();
										return `${year}-${String((year + range) % 100).padStart(2, '0')}`;
									}
								: utcFormat('%-d %b %Y');
	return (p) => formatter(parsePeriod(p));
}

export function sleep(ms = 1000) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function slugify(text: string) {
	const matches = text
		.toLowerCase()
		.replace(/'/g, '') // remove apostrophes since we don't want to split apostrophised words
		.replace(/&+/g, 'and') // special case 'and'
		.match(/[a-zA-Z0-9]+/g); // match alphanumeric sequences

	return matches ? matches.join('-') : '';
}

export function makeDataUrl(
	indicator: string,
	timeRange: string | string[],
	timeNearest: string | null = null,
	geoSelected: string[] = [],
	geoLevel: string | null = null,
	geoExtent: string | null = null,
	geoCluster: string | null = null,
	otherDims: object | null = null
): string {
	const base = '/api/v1/data.cols.json';
	const chunks: { key: string; value: string }[] = [];

	if (indicator) chunks.push({ key: 'indicator', value: indicator });

	const geoLevelObj = geoLevels[geoLevel];
	const geo = geoLevelObj ? [geoLevel] : [];
	geo.push(
		...geoSelected.filter((cd) =>
			!geoLevelObj ? true : !geoLevelObj.codes.includes(cd.slice(0, 3))
		)
	);
	if (geo.length > 0) chunks.push({ key: 'geo', value: geo.join(',') });
	if (geoExtent) chunks.push({ key: 'geoExtent', value: geoExtent });
	if (geoCluster) chunks.push({ key: 'geoCluster', value: geoCluster });
	if (otherDims)
		chunks.push(
			...Object.keys(otherDims).map((key) => ({
				key: `dimension_${key}`,
				value: [otherDims[key]].flat().join(',')
			}))
		);

	const time = Array.isArray(timeRange)
		? timeRange.map((p) => String(p).slice(0, 10)).join(',')
		: String(timeRange).slice(0, 10);
	if (time) chunks.push({ key: 'time', value: time });
	if (timeNearest) chunks.push({ key: 'timeNearest', value: timeNearest });

	const url = `${base}?${chunks.map((ch) => `${ch.key}=${ch.value}`).join('&')}&includeNames=true`;
	return resolve(url);
}

export function makeGeoJSON(topojson, layer: string) {
	return feature(topojson, layer);
}

export function makeMapFeatures(topo) {
	const features = {};

	for (const layer of Object.keys(topo.objects)) {
		const geo = makeGeoJSON(topo, layer);
		for (const f of geo.features) {
			features[f.properties.areacd] = f;
		}
	}
	for (const code of Object.keys(oldGeoCodesLookup))
		features[code] = features[oldGeoCodesLookup[code]];

	return features;
}

export function valuesToBreaks(values: number[], count = 5) {
	const clusters = ckmeans(values, values.length < count ? values.length : count);
	const breaks = [
		...clusters.map((c) => c[0]),
		clusters[clusters.length - 1][clusters[clusters.length - 1].length - 1]
	];
	return Array.from(new Set(breaks)); // de-duplicate breaks
}

export function getAreaType(area) {
	return geoLevelsAllLookup[area.areacd?.slice?.(0, 3)]?.label || null;
}
