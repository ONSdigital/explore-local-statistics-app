import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getDataset } from '$lib/api/getDataset';

export const load: PageLoad = async ({ fetch, params }) => {
	const result = await getDataset(fetch, params?.slug);

	if (result.kind === 'Failure') {
		error(404, { message: 'Invalid dataset code' });
	}

	return {
		...result,
		title: `${result.indicator.metadata.label} - ONS`,
		description: result.indicator.metadata.subtitle,
		pageType: `indicator data page`
	};
};
