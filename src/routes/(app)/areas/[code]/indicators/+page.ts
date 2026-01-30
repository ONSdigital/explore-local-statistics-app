import { error } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { pluralise, getName } from '@onsvisual/robo-utils';
import summaryData from '$lib/data/json-stat-summary.json';
import { geoLevels, geoLevelsLookup } from '$lib/config/geoLevels';
import type { PageLoad } from './$types';
import { extractAreaCodeFromSlug } from '$lib/api/geo/helpers/areaSlugUtils';

export const load: PageLoad = async ({ params, parent, fetch }) => {
	const code = extractAreaCodeFromSlug(params.code || '');
	if (code.error) error(code.error, code.message);

	const taxonomyPath = resolve(`/api/v1/metadata/taxonomy?hasGeo=${code}`);
	const metadataPath = resolve(`/api/v1/metadata/indicators?hasGeo=${code}&asLookup=true`);
	const areasPath = resolve(`/api/v1/geo/list?year=latest`);
	const relatedPath = resolve(`/api/v1/geo/related/${code}`);

	try {
		const [parentData, taxonomy, metadata, areas, related] = await Promise.all([
			parent(),
			(await fetch(taxonomyPath)).json(),
			(await fetch(metadataPath)).json(),
			(await fetch(areasPath)).json(),
			(await fetch(relatedPath)).json()
		]);
		areas.sort((a, b) => a.areanm.localeCompare(b.areanm, 'en-GB'));

		const area = parentData.area;
		const geoLevel = geoLevelsLookup[code.slice(0, 3)];
		const parentLevel = geoLevels[['ctry', 'rgn'].includes(geoLevel?.key) ? 'ctry' : 'rgn'];
		const areaParent = area.properties.parents.find((p) =>
			parentLevel.codes.includes(p.areacd.slice(0, 3))
		);

		const geoGroups = [
			{
				id: 'level',
				label: `All ${pluralise(geoLevel.label)}`,
				geoLevel: geoLevel.key
			}
		];
		if (geoLevel && related?.siblings?.parent)
			geoGroups.push({
				id: 'siblings',
				label: `All ${pluralise(geoLevel.label)} ${getName(related.siblings.parent, 'in')}`,
				geoLevel: geoLevel.key,
				geoExtent: related.siblings.parent.areacd
			});
		if (related.similar?.[2]?.cluster)
			geoGroups.push({
				id: 'cluster',
				label: `Similar demographics to ${getName(area.properties, 'the')}`,
				geoCluster: `demographic_${related.similar[2].cluster.key}`
			});

		return {
			taxonomy: taxonomy.data,
			metadata,
			areas,
			parent: areaParent,
			related,
			geoGroups,
			periods: summaryData.years,

			// Page metadata
			title: `${getName(area.properties)} (${area.properties.areacd}) - ONS`,
			description: `Find facts and figures from across the ONS on ${getName(area.properties, 'the')} (${area.properties.typenm}).`,
			pageType: `area page`,
			breadcrumbLinks: [
				{ label: 'Home', href: resolve('/') },
				{ label: 'Explore local statistics', href: resolve('/') },
				...[...[...area.properties.parents].reverse(), area.properties].map((p) => ({
					label: getName(p),
					href: resolve(`/areas/${p.areacd}`)
				}))
			],
			breadcrumbBackground: 'var(--ons-color-banner-bg)'
		};
	} catch (err) {
		error(404, { message: 'Area data not found.' });
	}
};
