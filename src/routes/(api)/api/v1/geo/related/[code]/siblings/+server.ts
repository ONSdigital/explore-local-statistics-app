import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getParam, hasValidParams } from '$lib/api/utils';
import getSiblingAreas from '$lib/api/geo/getSiblingAreas';

export const GET: RequestHandler = ({ url, params }) => {
	if (!hasValidParams(url, new Set(['parentLevel', 'includeNames'])))
		error(400, `Request contained invalid or duplicate parameters.`);

	const code = params.code;
	const parentLevel = getParam(url, 'parentLevel', null);
	const includeNames = getParam(url, 'includeNames', true);

	const siblings = getSiblingAreas({ code, parentLevel, includeNames });
	if (siblings.error) error(siblings.error, siblings.message);

	return json(siblings);
};
