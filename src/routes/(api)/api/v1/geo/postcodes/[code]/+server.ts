import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import getPostcode from '$lib/api/geo/getPostcode';
import { getAreasByPostcode } from '$lib/api/geo/getAreasByPostcode';
import { getParam, hasValidParams } from '$lib/api/utils';

export const GET: RequestHandler = async ({ url, params }) => {
	if (!hasValidParams(url, new Set(['code', 'year', 'geoLevel', 'groupByLevel'])))
		error(400, `Request contained invalid or duplicate parameters.`);

	const code = params.code;
	const year = getParam(url, 'year', 'latest');
	const geoLevel = getParam(url, 'geoLevel', 'all');
	const groupByLevel = getParam(url, 'groupByLevel', false);

	const postcode = await getPostcode(code);
	if (postcode.error) error(postcode.error, postcode.message);

	const areas = await getAreasByPostcode({
		code,
		postcode,
		year,
		geoLevel,
		groupByLevel
	});
	if (areas.error) error(areas.error, areas.message);

	return json(areas);
};
