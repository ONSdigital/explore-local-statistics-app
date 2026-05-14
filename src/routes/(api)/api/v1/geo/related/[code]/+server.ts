import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getParam, hasValidParams } from '$lib/api/utils';
import getRelatedAreas from '$lib/api/geo/getRelatedAreas';

export const GET: RequestHandler = ({ url, params }) => {
	if (!hasValidParams(url, new Set(['includeNames'])))
		error(400, `Request contained invalid parameters.`);

	const code = params.code;
	const includeNames = getParam(url, 'includeNames', true);

	const relatedAreas = getRelatedAreas({ code, includeNames });
	if (relatedAreas.error) return error(relatedAreas.error, relatedAreas.message);

	return json(relatedAreas);
};
