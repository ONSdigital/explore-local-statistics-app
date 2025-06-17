import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getDataset } from '$lib/api/getDataset';
import { base } from '$app/paths';
import { Breadcrumb } from '@onsvisual/svelte-components';

export const load: PageLoad = async ({ fetch, params }) => {
	const result = await getDataset(fetch, params?.slug);

	if (result.kind === 'Failure') {
		error(404, { message: 'Invalid dataset code' });
	}

	return {
		...result,
		title: `${result.indicator.metadata.label} - ONS`,
		description: result.indicator.metadata.subtitle,
		pageType: `indicator data page`,
		component: Breadcrumb,
		breadcrumbLinks: [
			{ label: 'Home', href: `/`, refresh: true },
			{ label: 'Explore local statistics', href: `${base}/` },
			{ label: 'Local indicators', href: `${base}/indicators` },
			{ label: result.indicator.metadata.label }
		],
		background: '#eaeaea'
	};
};
