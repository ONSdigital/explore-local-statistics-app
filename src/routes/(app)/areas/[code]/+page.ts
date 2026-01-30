import type { PageLoad } from './$types';
import { resolve } from '$app/paths';
import { getName } from '@onsvisual/robo-utils';
import { getProductLinks } from '$lib/util/linkHelpers';

export const load: PageLoad = async ({ parent }) => {
	const { area } = await parent();

	const productLinks = getProductLinks(area.properties);

	return {
		productLinks,

		// Page metadata
		title: `${getName(area.properties)} (${area.properties.areacd}) - ONS`,
		description: `Find facts and figures from across the ONS on ${getName(area.properties, 'the')} (${area.properties.typenm}).`,
		pageType: `area page`,
		breadcrumbLinks: [
			{ label: 'Home', href: resolve('/') },
			{ label: 'Explore local statistics', href: resolve('/') },
			...[...area.properties.parents].reverse().map((p) => ({
				label: getName(p),
				href: resolve(`/areas/${p.areacd}`)
			}))
		]
	};
};
