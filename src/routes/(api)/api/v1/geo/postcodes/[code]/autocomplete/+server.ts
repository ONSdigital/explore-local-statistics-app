import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import getPostcodesList from '$lib/api/geo/getPostcodesList';
import { getParam } from '$lib/api/utils';

export const GET: RequestHandler = async ({ url, params }) => {
	const code = params.code;
	const limit = getParam(url, 'limit', 10);
	const offset = getParam(url, 'offset', 0);

	const postcodes = await getPostcodesList({ code, limit, offset });
	if (postcodes.error) error(postcodes.error, postcodes.message);

	return json(postcodes);
};
