import { readFileSync, writeFileSync } from 'fs';
import { csvParse } from 'd3-dsv';
import { stripBom } from './io';
import { capitalise } from '@onsvisual/robo-utils';

// const config_url = "https://raw.githubusercontent.com/ONSdigital/explore-local-statistics-app/refs/heads/develop/static/insights/config.json";
const input_dir = './scripts/config/clusters';
const output_clusters = './src/lib/data/areas-clusters.json';
const output_similar = './src/lib/data/areas-similar.json';

const descriptions_path = `${input_dir}/cluster-descriptions.json`;
const descriptions = JSON.parse(stripBom(readFileSync(descriptions_path, 'utf8')));

const types = Object.keys(descriptions);
const keys = Object.fromEntries(types.map((t) => [t, Object.keys(descriptions[t])]));
const clusters_empty = Object.fromEntries(
	types.map((t) => [t, Object.fromEntries(keys[t].map((key) => [key, []]))])
);
const clusters = {
	types,
	keys,
	lookup: {},
	clusters: clusters_empty,
	descriptions
};
console.log(clusters);

const clusters_path = `${input_dir}/cluster-allocation.csv`;
const clusters_data = csvParse(stripBom(readFileSync(clusters_path, { encoding: 'utf8' })));

const idKey = clusters_data.columns[0];
for (const row of [...clusters_data].sort((a, b) => a[idKey].localeCompare(b[idKey], 'en-GB'))) {
	const areacd = row[idKey];
	const obj = {};
	for (const type of types) {
		const letter = row[`${capitalise(type)} model`].slice(-1).toLowerCase();
		if (letter in clusters.clusters[type]) {
			obj[type] = letter;
			clusters.clusters[type][letter].push(areacd);
		}
	}
	console.log(areacd, obj, row);
	clusters.lookup[areacd] = obj;
}

writeFileSync(output_clusters, JSON.stringify(clusters));
console.log(`Wrote ${output_clusters}`);

const similar = {};

for (const type of types) {
	const similar_path = `${input_dir}/${type}-neighbours.csv`;
	const similar_data = csvParse(stripBom(readFileSync(similar_path, { encoding: 'utf8' })));

	const idKey = similar_data.columns[0];
	for (const row of similar_data) {
		const areacd = row[idKey];
		if (!similar[areacd]) similar[areacd] = Object.fromEntries(types.map((t) => [t, []]));
		for (const col of similar_data.columns.slice(1)) similar[areacd][type].push(row[col]);
	}
}

writeFileSync(output_similar, JSON.stringify(similar));
console.log(`Wrote ${output_similar}`);
