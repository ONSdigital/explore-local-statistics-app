import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getParam, hasValidParams } from '$lib/api/utils';
import getSimilarAreas from '$lib/api/geo/getSimilarAreas';

export const GET: RequestHandler = ({ url, params }) => {
	if (!hasValidParams(url, new Set(['includeNames'])))
		error(400, `Request contained invalid parameters.`);

	const code = params.code;
	const includeNames = getParam(url, 'includeNames', true);

	const similar = getSimilarAreas({ code, includeNames });
	if (similar.error) error(similar.error, similar.message);

	return json(similar);
};
