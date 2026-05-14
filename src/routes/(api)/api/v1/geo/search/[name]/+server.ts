import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getParam, hasValidParams } from '$lib/api/utils';
import getAreasByName from '$lib/api/geo/getAreasByName';
import getPostcodesList from '$lib/api/geo/getPostcodesList';

export const GET: RequestHandler = async ({ url, params }) => {
	if (
		!hasValidParams(
			url,
			new Set(['year', 'limit', 'offset', 'searchPostcodes', 'groupByLevel', 'geoLevel'])
		)
	)
		error(400, `Request contained invalid parameters.`);

	const name = params.name || null;
	const year = getParam(url, 'year', 'latest');
	const limit = getParam(url, 'limit', 10);
	const offset = getParam(url, 'offset', 0);
	const searchPostcodes = getParam(url, 'searchPostcodes', false);
	const groupByLevel = getParam(url, 'groupByLevel', false);
	const geoLevel = getParam(url, 'geoLevel', 'all');

	let areasList = getAreasByName({
		name,
		year,
		limit,
		offset,
		geoLevel,
		groupByLevel
	});
	if (areasList.error) error(areasList.error, areasList.message);

	if (searchPostcodes && areasList.meta.count === 0)
		areasList = await getPostcodesList({ code: name, limit, offset });

	return json(areasList);
};
