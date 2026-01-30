import type { PageLoad } from './$types';
import { resolve } from '$app/paths';

export const load: PageLoad = async ({ fetch }) => {
	const path = resolve('/api/v1/metadata/taxonomy?excludeMultivariate=true');
	const taxonomy = await (await fetch(path)).json();

	return {
		taxonomy,

		// Page metadata
		title: 'Explore local indicators - ONS',
		description: `Explore ${taxonomy.meta.count} local datasets from the ONS, including disposable household income, participation in further education and life satisfaction.`,
		pageType: 'indicators page',
		breadcrumbLinks: [
			{ label: 'Home', href: resolve('/') },
			{ label: 'Explore local statistics', href: resolve('/') }
		]
	};
};
