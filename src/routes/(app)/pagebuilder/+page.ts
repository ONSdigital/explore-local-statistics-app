import type { PageLoad } from './$types';
import { resolve } from '$app/paths';

export const load: PageLoad = async ({ fetch }) => {
	const taxonomyPath = resolve('/api/v1/metadata/taxonomy?flat=true');
	const geographyPath = resolve('/api/v1/geo/list?asLookup=true,year=all');
	const taxonomy = await (await fetch(taxonomyPath)).json();
	const geo = await (await fetch(geographyPath)).json();

	return {
		taxonomy,
		geo,

		// Page metadata
		title: 'Explore local indicators - ONS',
		description: `Explore ${taxonomy.meta.count} local datasets from the ONS, including disposable household income, participation in further education and life satisfaction.`,
		pageType: 'indicators',
		breadcrumbLinks: [
			{ label: 'Home', href: '/' },
			{ label: 'Explore local statistics', href: resolve('/') }
		]
	};
};
