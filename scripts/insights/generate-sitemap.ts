import { writeFile } from 'fs';
import { slugify } from '../../src/lib/util/url/slugify.ts';
import { noIndex, essGeocodes } from '../../src/lib/config/geoConfig.ts';
import { create } from 'xmlbuilder2';

export function generateSitemap(areas, indicators) {
	const sitemapData = {
		areas: areas.filter((d) => !noIndex.includes(d.areacd.slice(0, 3))),
		'areas-with-indicators': areas.filter((d) => essGeocodes.includes(d.areacd.slice(0, 3))),
		indicators: indicators.map((d) => d.slug)
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

	// writeJson('./noIndex.json', noIndex);

	writeFile('./static/sitemap.xml', doc, (err) => {
		if (err) {
			console.error(err);
		} else {
			// file written successfully
		}
	});
}
