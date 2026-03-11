import { readFileSync, writeFile } from 'fs';
import { geoCodesIndexed, geoCodesViz } from '../src/lib/config/geoLevels';
import { create } from 'xmlbuilder2';

const areasPath = './src/lib/data/areas-list.json';
const metadataPath = './src/lib/data/json-stat-metadata.json';
const outputPath = './static/sitemap.xml';

function slugify(text: string) {
	const matches = text
		.toLowerCase()
		.replace(/'/g, '')
		.replace(/&+/g, 'and')
		.match(/[a-zA-Z0-9]+/g);
	return matches ? matches.join('-') : '';
}

function parseCols(data) {
	const cols = Object.keys(data);
	const rows = [];

	for (let i = 0; i < data[cols[0]].length; i++) {
		const row = {};
		for (const col of cols) row[col] = data[col][i];
		rows.push(row);
	}
	return rows;
}

console.log(`Reading ${areasPath}`);
const areas = parseCols(JSON.parse(readFileSync(areasPath, { encoding: 'utf8' })));

console.log(`Reading ${metadataPath}`);
const metadata = JSON.parse(readFileSync(metadataPath, { encoding: 'utf8' }));

const sitemapData = {
	areas: areas.filter((d) => geoCodesIndexed.has(d.areacd.slice(0, 3))),
	'areas-with-indicators': areas.filter((d) => geoCodesViz.has(d.areacd.slice(0, 3))),
	indicators: metadata.link.item.map((d) => d.extension.slug)
};

const intro = `<?xml version="1.0" encoding="utf-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

const outro = `</urlset>`;

const paths: string[] = [];

paths.push('https://ons.gov.uk/explore-local-statistics/');
paths.push('https://ons.gov.uk/explore-local-statistics/areas/');
paths.push('https://ons.gov.uk/explore-local-statistics/indicators/');

Object.keys(sitemapData).forEach((d) => {
	if (d == 'areas') {
		sitemapData[d].forEach((e) => {
			paths.push(
				'https://ons.gov.uk/explore-local-statistics/areas/' + e.areacd + '-' + slugify(e.areanm)
			);
		});
	} else if (d == 'areas-with-indicators') {
		sitemapData[d].forEach((e) => {
			paths.push(
				'https://ons.gov.uk/explore-local-statistics/areas/' +
					e.areacd +
					'-' +
					slugify(e.areanm) +
					'/indicators'
			);
		});
	} else {
		sitemapData[d].forEach((f) => {
			paths.push('https://ons.gov.uk/explore-local-statistics/indicators/' + f);
		});
	}
});

let content = intro;

const date = new Date().toISOString().split('T')[0];

paths.forEach((d) => {
	content = content.concat(
		'<url>',
		'<loc>',
		d,
		'</loc>',
		'<lastmod>',
		date,
		'</lastmod>',
		'</url>'
	);
});

content = content.concat(outro);

const doc = create(content).end({ prettyPrint: true });

writeFile(outputPath, doc, (err) => {
	if (err) {
		console.error(err);
	} else {
		console.log(`Wrote ${outputPath}`);
	}
});
