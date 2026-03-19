import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getParam } from '$lib/api/utils';
import getGeoLevels from '$lib/api/geo/getGeoLevels';

export const GET: RequestHandler = ({ url }) => {
	const year = getParam(url, 'year', 'latest');
	const includeAreas = getParam(url, 'includeParents', true);

	const levels = getGeoLevels({
		year,
		includeAreas
	});

	return json(levels);
};
