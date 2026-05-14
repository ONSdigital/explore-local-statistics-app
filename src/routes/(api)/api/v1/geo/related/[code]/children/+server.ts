import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getParam, hasValidParams } from '$lib/api/utils';
import getChildAreas from '$lib/api/geo/getChildAreas';

export const GET: RequestHandler = ({ url, params }) => {
	if (!hasValidParams(url, new Set(['geoLevel', 'includeNames'])))
		error(400, `Request contained invalid parameters.`);

	const code = params.code;
	const geoLevel = getParam(url, 'geoLevel', null);
	const includeNames = getParam(url, 'includeNames', true);

	const children = getChildAreas({ code, geoLevel, includeNames });
	if (children.error) error(children.error, children.message);

	return json(children);
};
