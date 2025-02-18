import type { LayoutLoad } from './$types';
import { base } from '$app/paths';
import { Breadcrumb } from '@onsvisual/svelte-components';

export const load: LayoutLoad = async ({ fetch }) => {
	const coreMetadata = await (await fetch(`${base}/insights/core-metadata.json`)).json();

	return {
		coreMetadata,
		title: `Explore local statistics - ONS`,
		description: `Find, compare and visualise statistics about communities in the United Kingdom. Includes data on population, economy and health.`,
		pageType: `home page`,
		component: Breadcrumb,
		breadcrumbLinks: [
			{ label: 'Home', href: 'https://www.ons.gov.uk/', refresh: true },
			{ label: 'Explore local statistics' }
		],
		background: '#e9eff4'
	};
};
