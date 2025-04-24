import type { PageLoad } from './$types';
import { base } from '$app/paths';
import { getData } from '$lib/api/getData';
import { getName } from '@onsvisual/robo-utils';
import { Breadcrumb } from '@onsvisual/svelte-components';
import { makeCanonicalSlug } from '$lib/util/areas/makeCanonicalSlug';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { place } = await parent();
	const result = await getData(fetch);

	return {
		...result,
		title: `Local indicators for ${getName(place, 'the')} (${place.areacd}) - ONS`,
		description: `Explore local statistics from the ONS on ${getName(place, 'the')} (${place.typenm}). Includes data on population, economy and health.`,
		pageType: `area data page`,
		component: Breadcrumb,
		breadcrumbLinks: [
			{ label: 'Home', href: 'https://www.ons.gov.uk/', refresh: true },
			{ label: 'Explore local statistics', href: `${base}/` },
			...[...place.parents].reverse().map((p) => ({
				label: getName(p),
				href: `${base}/areas/${makeCanonicalSlug(p.areacd, p.areanm)}`
			})),
			{
				label: getName(place),
				href: `${base}/areas/${makeCanonicalSlug(place.areacd, place.areanm)}`
			},
			{ label: `Local indicators` }
		],
		background: '#eaeaea'
	};
};
