import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getParam } from '$lib/api/utils';
import getAreasList from '$lib/api/geo/getAreasList';

export const GET: RequestHandler = ({ url }) => {
	const geo = getParam(url, 'geo', 'all');
	const year = getParam(url, 'year', 'latest');
	const indicator = getParam(url, 'indicator', 'all');
	const asLookup = getParam(url, 'asLookup', false);
	const groupByLevel = getParam(url, 'groupByLevel', false);
	const includeParents = getParam(url, 'includeParents', false);
	const includeChildren = getParam(url, 'includeChildren', false);
	const includeDates = getParam(url, 'includeDates', false);
	const includeLevel = getParam(url, 'includeLevel', false);

	const areasList = getAreasList({
		geo,
		year,
		indicator,
		asLookup,
		groupByLevel,
		includeParents,
		includeChildren,
		includeDates,
		includeLevel
	});

	return json(areasList);
};
