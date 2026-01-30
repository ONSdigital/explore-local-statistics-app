import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getParam } from '$lib/api/utils';
import getSimilarAreas from '$lib/api/geo/getSimilarAreas';

export const GET: RequestHandler = ({ url, params }) => {
	const code = params.code;
	const includeNames = getParam(url, 'includeNames', true);

	const similar = getSimilarAreas({ code, includeNames });
	if (similar.error) error(similar.error, similar.message);

	return json(similar);
};
