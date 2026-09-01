import type { LayoutLoad } from './$types';
import { resolve } from '$app/paths';

export const load: LayoutLoad = async ({ fetch }) => {
	const path = '/api/v1/metadata/taxonomy?excludeMultivariate=true';
	const [taxonomy, taxonomyFlat] = await Promise.all([
		(await fetch(resolve(path))).json(),
		(await fetch(resolve(path + '&flat=true'))).json()
	]);

	return {
		taxonomy,
		taxonomyFlat
	};
};
