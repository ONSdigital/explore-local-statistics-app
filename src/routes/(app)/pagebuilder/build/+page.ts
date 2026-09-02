import type { PageLoad } from './$types';
import { resolve } from '$app/paths';

export const load: PageLoad = async ({ fetch }) => {
	const taxonomyPath = resolve('/api/v1/metadata/taxonomy?flat=true');
	const taxonomyNestedPath = resolve('/api/v1/metadata/taxonomy?excludeMultivariate=true');
	const taxonomy = await (await fetch(taxonomyPath)).json();
	const taxonomyNested = await (await fetch(taxonomyNestedPath)).json();

	return {
		taxonomy,
		taxonomyNested,

		// Page metadata
		title: 'Explore local indicators - ONS',
		description: `Explore ${taxonomy.meta.count} local datasets from the ONS, including disposable household income, participation in further education and life satisfaction.`,
		pageType: 'comparison',
		breadcrumbLinks: [
			{ label: 'Home', href: '/' },
			{ label: 'Explore local statistics', href: resolve('/') }
		]
	};
};
