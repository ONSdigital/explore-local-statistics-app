import { readFileSync, writeFileSync } from 'fs';
import { csvParse, csvFormat, autoType } from 'd3-dsv';
import { geoLevels, geoLevelsNamed } from '../src/lib/config/geoLevels';

const topoUrl =
	'https://raw.githubusercontent.com/ONSdigital/uk-topojson/refs/heads/main/output/topo.json';
const metaUrl =
	'https://raw.githubusercontent.com/ONSdigital/geo-scripts/refs/heads/main/input/lookups/lookup.csv';
const outputDir = './src/lib';

const geoCodes = new Set(
	Object.values(geoLevels)
		.map((g) => g.codes)
		.flat()
);

function getLevels(cd) {
	return Object.keys(geoLevels).filter((key) => geoLevels[key].codes.includes(cd.slice(0, 3)));
}

function getChildren(cd, rows) {
	return rows.filter((row) => row.parentcd === cd).map((row) => row.areacd);
}

function getParents(cds, rows) {
	const cd = cds[cds.length - 1];
	const row = rows.find((row) => row.areacd === cd);
	if (row.parentcd) return getParents([...cds, row.parentcd], rows);
	return cds;
}

// Fetch topoJSON
const topo = await (await fetch(topoUrl)).json();
const topoPath = `${outputDir}/data/topo.json`;
writeFileSync(topoPath, JSON.stringify(topo));
console.log(`Wrote ${topoPath}`);

// Make geography lookup
const lookupRows = csvParse(await (await fetch(metaUrl)).text(), autoType);
const rows = lookupRows.filter((row) => geoCodes.has(row.areacd.slice(0, 3)));

const lookup = {};
for (const row of rows) {
	const obj = {};
	for (const key of ['areacd', 'areanm', 'start', 'end']) {
		if (row[key]) obj[key] = row[key];
	}
	obj.level = getLevels(row.areacd);
	obj.parents = row.parentcd ? getParents([row.parentcd], rows) : [];
	obj.children = getChildren(row.areacd, rows);
	lookup[row.areacd] = obj;
}

const geoPath = `${outputDir}/data/geo-metadata.json`;
writeFileSync(geoPath, JSON.stringify(lookup));
console.log(`Wrote ${geoPath}`);

// Make areas list
const filterCodes = new Set(
	Object.values(geoLevelsNamed)
		.map((l) => l.codes)
		.flat()
);
const includeParent = new Set(
	['wd', 'par']
		.map((key) => geoLevelsNamed[key])
		.map((l) => l.codes)
		.flat()
);
const arrayKeys = ['areacd', 'areanm', 'parentcd'];
const objectKeys = ['start', 'end'];
const listRaw = lookupRows.filter((row) => filterCodes.has(row.areacd.slice(0, 3)));
const list = {};
for (const key of arrayKeys) list[key] = [];
for (const key of objectKeys) list[key] = {};

for (let i = 0; i < listRaw.length; i++) {
	const row = listRaw[i];
	for (const key of arrayKeys) {
		if (key !== 'parentcd' || includeParent.has(row.areacd.slice(0, 3))) list[key].push(row[key]);
		else list[key].push(null);
	}
	for (const key of objectKeys) {
		if (row[key]) list[key][i] = row[key];
	}
}
const listPath = `${outputDir}/data/areas-list.json`;
writeFileSync(listPath, JSON.stringify(list));
console.log(`Wrote ${listPath}`);
