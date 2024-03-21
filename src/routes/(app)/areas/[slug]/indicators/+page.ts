import type { PageLoad } from './$types';
import { getData } from '$lib/api/getData';
import { getName } from '@onsvisual/robo-utils';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { place } = await parent();
	const result = await getData(fetch);

	return {
		...result,
		title: `Local indicators for ${getName(place, 'the')} (${place.areacd}) - ONS`,
		description: `Explore local statistics from the ONS on ${getName(place, 'the')} (${place.typenm}). Includes data on population, economy and health.`,
		pageType: `area data page`
	};
};
