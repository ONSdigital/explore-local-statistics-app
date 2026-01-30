import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getParam } from '$lib/api/utils';
import getSiblingAreas from '$lib/api/geo/getSiblingAreas';

export const GET: RequestHandler = ({ url, params }) => {
	const code = params.code;
	const parentLevel = getParam(url, 'parentLevel', null);
	const includeNames = getParam(url, 'includeNames', true);

	const siblings = getSiblingAreas({ code, parentLevel, includeNames });
	if (siblings.error) error(siblings.error, siblings.message);

	return json(siblings);
};
