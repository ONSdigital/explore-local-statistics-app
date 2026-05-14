import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getParam, hasValidParams } from '$lib/api/utils';
import getGeoLevels from '$lib/api/geo/getGeoLevels';

export const GET: RequestHandler = ({ url }) => {
	if (!hasValidParams(url, new Set(['year', 'includeAreas'])))
		error(400, `Request contained invalid parameters.`);

	const year = getParam(url, 'year', 'latest');
	const includeAreas = getParam(url, 'includeAreas', true);

	const levels = getGeoLevels({
		year,
		includeAreas
	});

	return json(levels);
};
