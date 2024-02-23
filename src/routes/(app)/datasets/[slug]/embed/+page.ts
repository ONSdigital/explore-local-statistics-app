import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getDataset } from '$lib/api/getDataset';

export const load: PageLoad = async ({ fetch, params, url }) => {
	const chartType = url.searchParams.get('type');

	if (!['map', 'table'].includes(chartType)) {
		error(404, { message: 'Invalid chart type' });
	}

	const result = await getDataset(fetch, params?.slug);

	if (result.kind === 'Failure') {
		error(404, { message: 'Invalid dataset code' });
	}

	return {
		title: result.indicator.metadata.label,
		description: result.indicator.metadata.subtitle,
		...result,
		chartType
	};
};
