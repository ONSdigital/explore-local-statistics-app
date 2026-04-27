import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		// Page metadata
		title: 'Explore local statistics - ONS',
		description:
			'Find, compare and visualise statistics about communities in the United Kingdom. Includes data on population, economy and health.',
		pageType: 'home page',
		breadcrumbLinks: [{ label: 'Home', href: '/' }],
		breadcrumbBackground: 'var(--ons-color-branded-tint)'
	};
};
