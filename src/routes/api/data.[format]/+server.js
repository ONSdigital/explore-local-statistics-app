import { json, text } from '@sveltejs/kit';
import { csvFormat } from 'd3-dsv';
import cube from './json-stat.json';
import geoGroups from './geo-groups.js';

function ascending(a, b) {
	return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function getParam(url, key, fallback) {
	const param = url.searchParams.get(key);
	if (!param) return fallback;
	return param.includes(',') ? param.split(',') : param;
}

function toJSONStat(qb, dims) {
	const cube = structuredClone(qb);
	let indices = [0];

	for (let i = 0; i < dims.length; i++) {
		const dim = dims[i];
		const size = dim.values.length;

		if (dim.values.length !== 1) {
			const newIndices = [];
			// const newIndices = Array(indices.length * size);
			// let j = 0;
			for (const index of indices) {
				for (const val of dim.values) {
					newIndices.push(index * dim.count + val[1]);
					// newIndices[j] = (index * dim.count) + val[1];
					// j ++;
				}
			}
			indices = newIndices;
			// indices = indices.flatMap(index => dim.values.map(val => (index * dim.count) + val[1]));
		}

		cube.dimension[dim.key].category.index = Object.fromEntries(
			dim.values.map((val, i) => [val[0], i])
		);
		if (cube.dimension[dim.key].category.label && size < cube.size[i]) {
			const label = {};
			for (const val of dim.values) label[val[1]] = cube.dimension[dim.key].category.label[val[1]];
			cube.dimension[dim.key].category.label = label;
		}
		cube.size[i] = size;
	}

	const value = Array(indices.length).fill(null);

	for (let i = 0; i < indices.length; i++) {
		value[i] = cube.value[indices[i]];
	}
	cube.value = value;

	return cube;
}

function dimsToItems(dims) {
	let items = [[0]];
	for (const dim of dims) {
		const newItems = [];
		for (const item of items) {
			for (const val of dim.values) {
				newItems.push([item[0] * dim.count + val[1], ...item.slice(1), val[0]]);
			}
		}
		items = newItems;
	}
	return items;
}

function toRows(cube, dims) {
	const measures = dims[dims.length - 1];
	const measuresLength = measures.values.length;
	if (measuresLength === 0) return [];

	const items = dimsToItems(dims.slice(0, -1));

	const rows = [];
	for (const item of items) {
		const row = { indicator: cube.extension.code };
		for (let i = 0; i < dims.length - 1; i++) row[dims[i].key] = item[i + 1];
		for (let j = 0; j < measuresLength; j++) {
			row[measures.values[j][0]] = cube.value[item[0] * measures.count + j];
		}
		rows.push(row);
	}
	return rows;
}

function toJSON(cube, dims) {
	const measures = dims[dims.length - 1];
	const measuresLength = measures.values.length;

	const data = {};
	for (const dim of dims.slice(0, -1)) data[dim.key] = [];
	for (const val of measures.values) data[val[0]] = [];

	const items = dimsToItems(dims.slice(0, -1));
	for (const item of items) {
		for (let i = 0; i < dims.length - 1; i++) data[dims[i].key].push(item[i + 1]);
		for (let j = 0; j < measuresLength; j++) {
			data[measures.values[j][0]].push(cube.value[item[0] * measures.count + j]);
		}
	}
	return [cube.extension.code, data];
}

function toCSVW(datasets, measure, url) {
	let metadata = {
		'@context': 'http://www.w3.org/ns/csvw',
		url: url.href.replace('.csvw', '.csv'),
		'rdfs:label': 'Filtered datasets from ONS Explore Local Statistics API'
	};
	if (datasets.length === 1) {
		const ds = datasets[0];
		const sourceOrg = ds.extension.source[0].url.split('/').slice(0, 3).join('/') + '/';
		metadata = {
			...metadata,
			'rdfs:label': 'Filtered dataset from ONS Explore Local Statistics API',
			'dc:title': ds.label,
			'rdfs:comment': ds.extension.description,
			'dc:issued': {
				'@type': 'date',
				'@value': ds.updated
			},
			'dc:creator': {
				'@id': sourceOrg
			},
			'dc:publisher': {
				'@id': sourceOrg
			},
			'dcat:landingPage': {
				'@id': ds.extension.source[0].url
			}
		};
	}
	let measures = [
		{
			titles: 'Lower confidence interval',
			name: 'lci',
			datatype: 'number'
		},
		{
			titles: 'Value',
			name: 'value',
			datatype: 'number'
		},
		{
			titles: 'Upper confidence interval',
			name: 'uci',
			datatype: 'number'
		}
	];
	if (measure !== 'all') measures = measures.filter((m) => [measure].flat().includes(m.name));
	metadata.tableSchema = {
		columns: [
			{
				titles: 'Indicator',
				name: 'indicator',
				datatype: 'string'
			},
			{
				titles: 'Time period',
				name: 'date',
				datatype: 'date'
			},
			{
				titles: 'Area code',
				name: 'areacd',
				datatype: 'string'
			},
			...measures
		]
	};
	return metadata;
}

function makeFilter(param) {
	const set = new Set([param].flat());
	return (d) => set.has(d[0]);
}

function makeGeoFilter(param) {
	const codes = new Set();
	const types = new Set();
	for (const geo of [param].flat()) {
		if (geo.match(/^[EKNSW]\d{2}$/)) types.add(geo);
		else if (geoGroups[geo]) {
			for (const code of geoGroups[geo].codes) types.add(code);
		} else if (geo.match(/^[EKNSW]\d{8}$/) && !types.has(geo.slice(0, 3))) codes.add(geo);
	}
	return codes.size > 0 && types.size > 0
		? (d) => codes.has(d[0]) || types.has(d[0].slice(0, 3))
		: types.size > 0
			? (d) => types.has(d[0].slice(0, 3))
			: codes.size > 0
				? (d) => codes.has(d[0])
				: () => false;
}

function filterTime(values, param) {
	if (param === 'latest') return [values[values.length - 1]];
	if (param === 'earliest') return [values[0]];

	const params = [param].flat();
	const props = {
		start: params[0].match(/^\d{4}(-\d{2}){0,2}/)?.[0],
		end: params[params.length - 1].match(/^\d{4}(-\d{2}){0,2}/)?.[0],
		earliest: params[0].endsWith('earliest'),
		latest: params[params.length - 1].endsWith('latest')
	};
	if (!props.start && !props.end && !props.earliest && !props.latest) return [];

	const dates = values.map((d) => d[0].split('/')[0]);
	let startIndex;
	if (!props.start && props.earliest) startIndex = 0;
	else if (props.start) {
		props.start = props.start.slice(0, dates[0].length);
		const startDates =
			props.start.length < dates[0].length
				? dates.map((d) => d.slice(0, props.start.length))
				: dates;
		const index = startDates.indexOf(props.start);
		const indexForce =
			index === -1 && props.earliest
				? [props.start, ...startDates].sort(ascending).indexOf(props.start)
				: null;
		startIndex = !indexForce ? index : indexForce && indexForce < dates.length ? indexForce : null;
	}
	let endIndex;
	if (!props.end && props.latest) endIndex = values.length;
	if (props.end) {
		props.end = props.end.slice(0, dates[0].length);
		const endDates =
			props.end.length < dates[0].length ? dates.map((d) => d.slice(0, props.end.length)) : dates;
		const index = endDates.lastIndexOf(props.end);
		const indexForce =
			index === -1 && props.latest
				? [...endDates, props.end].sort(ascending).lastIndexOf(props.end)
				: null;
		endIndex = !indexForce ? index + 1 : indexForce && indexForce > 0 ? indexForce : null;
	}
	if (!Number.isInteger(startIndex) && !Number.isInteger(endIndex)) return [];
	return values.slice(
		Number.isInteger(startIndex) ? startIndex : endIndex - 1,
		Number.isInteger(endIndex) ? endIndex : startIndex + 1
	);
}

function filterCube(cube, filters, format) {
	const dims = [];
	for (let i = 0; i < cube.id.length; i++) {
		const key = cube.id[i];
		const dimension = cube.dimension[key];
		const dim = {
			key: key,
			count: cube.size[i],
			values: Object.entries(dimension.category.index)
		};
		const filter = filters[key];
		if (filter && dim.key === 'date') {
			dim.values = filterTime(dim.values, filter);
		} else if (filter) dim.values = dim.values.filter(filter);
		dims.push(dim);
	}
	const length = dims.map((dim) => dim.values.length).reduce((a, b) => a * b, 1);
	if (length === 0) return null;

	if (format === 'json') return toJSON(cube, dims);
	if (format === 'csv') return toRows(cube, dims);
	return toJSONStat(cube, dims);
}

function filterAll(datasets, params, format) {
	const filtered = [];
	for (const cube of datasets) {
		const data = filterCube(cube, params, format);
		if (data) filtered.push(data);
	}
	if (format === 'csv') return filtered;
	if (format === 'json') return Object.fromEntries(filtered);
	return {
		version: '2.0',
		class: 'collection',
		label: 'ONS Explore Local Statistics API response',
		updated: cube.updated,
		link: { item: filtered }
	};
}

function csvSerialise(datasets) {
	return csvFormat(datasets.flat());
}

export function GET({ params, url }) {
	const format = params.format || 'json';
	const topic = getParam(url, 'topic', 'all');
	const indicator = getParam(url, 'indicator', 'all');
	const geography = getParam(url, 'geography', 'all');
	const time = getParam(url, 'time', 'latest');
	const measure = getParam(url, 'measure', 'all');

	let datasets = cube.link.item;

	// Filter datasets by topic OR sub-topic
	if (topic !== 'all') {
		datasets = datasets.filter((d) =>
			[topic].flat().some((t) => [d.extension.topic, d.extension.subTopic].includes(t))
		);
	}

	// Filter datasets by indicator
	if (indicator !== 'all') {
		datasets = datasets.filter((d) => [indicator].flat().includes(d.extension.code));
	}

	// Return only CSVW metadata, if requested
	if (format === 'csvw') {
		const metadata = toCSVW(datasets, measure, url);
		return json(metadata);
	}

	// Create filters for data cube dimensions
	const filters = {};
	if (geography !== 'all') filters.areacd = makeGeoFilter(geography);
	if (time !== 'all') filters.date = time;
	if (measure !== 'all') filters.measure = makeFilter(measure);

	// Apply filters to datasets and generate output for selected format
	datasets = filterAll(datasets, filters, format);

	return format === 'csv' ? text(csvSerialise(datasets)) : json(datasets);
}
