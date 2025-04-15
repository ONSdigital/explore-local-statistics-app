import type { PageLoad } from './$types';
import { Breadcrumb } from '@onsvisual/svelte-components';
import { base } from '$app/paths';

export const load: PageLoad = async ({ parent }) => {
	const { coreMetadata } = await parent();

	return {
		coreMetadata,
		title: `Explore local indicators - ONS`,
		description: `Explore ${coreMetadata.indicatorsCodeLabelArray.length} local datasets from the ONS, including disposable household income, participation in further education and life satisfaction.`,
		pageType: `els-indicators-page`,
		component: Breadcrumb,
		breadcrumbLinks: [
			{ label: 'Home', href: 'https://www.ons.gov.uk/', refresh: true },
			{ label: 'Explore local statistics', href: `${base}/` },
			{ label: 'Local indicators' }
		],
		background: '#fff'
	};
};
