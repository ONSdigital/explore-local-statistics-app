import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getDataset } from '$lib/api/getDataset';

export const load: PageLoad = async ({ fetch, params, url }) => {
	const chart = url.searchParams.get('type');
	const areas = url.searchParams.get('areas');
	const geo = url.searchParams.get('geo');
	const years = url.searchParams.get('years');
	const intervals = url.searchParams.get('intervals') === 'true';

	if (!['line', 'bar', 'map', 'table'].includes(chart)) {
		error(404, { message: 'Invalid chart type' });
	}

	const result = await getDataset(fetch, params?.slug);

	if (result.kind === 'Failure') {
		error(404, { message: 'Invalid dataset code' });
	}

	const yearsArr = typeof years === 'string' ? years.split('-').map((d) => +d) : null;
	const xDomain = Array.isArray(yearsArr)
		? [yearsArr[0], yearsArr[yearsArr.length - 1]]
		: [result.indicator.minXDomainNumb, result.indicator.maxXDomainNumb];

	return {
		...result,
		title: result.indicator.metadata.label,
		description: result.indicator.metadata.subtitle,
		chart,
		areas: typeof areas === 'string' ? areas.split(',') : [],
		years: xDomain,
		geo,
		intervals
	};
};
