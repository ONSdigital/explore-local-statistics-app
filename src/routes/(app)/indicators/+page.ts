import type { PageLoad } from './$types';
import { resolve } from '$app/paths';

export const load: PageLoad = async ({ parent }) => {
	const { taxonomy } = await parent();

	return {
		// Page metadata
		title: 'Explore local indicators - ONS',
		description: `Explore ${taxonomy.meta.count} local datasets from the ONS, including disposable household income, participation in further education and life satisfaction.`,
		pageType: 'indicators',
		breadcrumbLinks: [
			{ label: 'Home', href: '/' },
			{ label: 'Explore local statistics', href: resolve('/') }
		],
		breadcrumbBackground: 'var(--ons-color-banner-bg)'
	};
};
