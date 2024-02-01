import type { PageLoad } from './$types';
import { getData } from '$lib/api/getData';

export const load: PageLoad = async ({ fetch }) => {
	const result = await getData(fetch);

	return {
		...result
	};
};
