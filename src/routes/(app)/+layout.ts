import type { LayoutLoad } from './$types';
import { Breadcrumb } from '@onsvisual/svelte-components';
import coreMetadata from '../../data/insights/core-metadata.json';

export const load: LayoutLoad = async () => {
	return {
		coreMetadata,
		title: `Explore local statistics - ONS`,
		description: `Find, compare and visualise statistics about communities in the United Kingdom. Includes data on population, economy and health.`,
		pageType: `els-home-page`,
		component: Breadcrumb,
		breadcrumbLinks: [
			{ label: 'Home', href: 'https://www.ons.gov.uk/', refresh: true },
			{ label: 'Explore local statistics' }
		],
		background: '#e9eff4'
	};
};
