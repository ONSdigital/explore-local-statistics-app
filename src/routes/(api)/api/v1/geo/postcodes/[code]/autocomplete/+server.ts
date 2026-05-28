import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import getPostcodesList from '$lib/api/geo/getPostcodesList';
import { getParam, hasValidParams } from '$lib/api/utils';

export const GET: RequestHandler = async ({ url, params }) => {
	if (!hasValidParams(url, new Set(['limit', 'offset'])))
		error(400, `Request contained invalid or duplicate parameters.`);

	const code = params.code;
	const limit = getParam(url, 'limit', 10);
	const offset = getParam(url, 'offset', 0);

	const postcodes = await getPostcodesList({ code, limit, offset });
	if (postcodes.error) error(postcodes.error, postcodes.message);

	return json(postcodes);
};
