import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getParam } from '$lib/api/utils';
import getRelatedAreas from '$lib/api/geo/getRelatedAreas';

export const GET: RequestHandler = ({ url, params }) => {
	const code = params.code;
	const includeNames = getParam(url, 'includeNames', true);

	const relatedAreas = getRelatedAreas({ code, includeNames });
	if (relatedAreas.error) return error(relatedAreas.error, relatedAreas.message);

	return json(relatedAreas);
};
