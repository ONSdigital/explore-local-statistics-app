import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getParam } from '$lib/api/utils';
import getParentAreas from '$lib/api/geo/getParentAreas';

export const GET: RequestHandler = ({ url, params }) => {
	const code = params.code;
	const includeNames = getParam(url, 'includeNames', true);

	const parents = getParentAreas({ code, includeNames });
	if (parents.error) error(parents.error, parents.message);

	return json(parents);
};
