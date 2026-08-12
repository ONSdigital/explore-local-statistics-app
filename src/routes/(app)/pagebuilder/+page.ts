import type { PageLoad } from './$types';
import { resolve } from '$app/paths';

export const load: PageLoad = async ({ fetch }) => {
	const taxonomyPath = resolve('/api/v1/metadata/taxonomy?flat=true');
	const taxonomyNestedPath = resolve('/api/v1/metadata/taxonomy?excludeMultivariate=true');
	const areasPath = resolve('/api/v1/geo/list');
	const taxonomy = await (await fetch(taxonomyPath)).json();
	const areas = await (await fetch(areasPath)).json();
	const taxonomyNested = await (await fetch(taxonomyNestedPath)).json();

	areas.sort((a, b) => a.areanm.localeCompare(b.areanm));

	return {
		taxonomy,
		taxonomyNested,
		areas,

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
