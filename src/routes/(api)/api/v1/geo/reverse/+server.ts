import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getParam } from '$lib/api/utils';
import getAreasByLngLat from '$lib/api/geo/getAreasByLngLat';

export const GET: RequestHandler = async ({ url }) => {
	const lng = getParam(url, 'lng', null);
	const lat = getParam(url, 'lat', null);
	const year = getParam(url, 'year', 'latest');
	const geoLevel = getParam(url, 'geoLevel', 'all');
	const groupByLevel = getParam(url, 'groupByLevel', false);

	const areasList = await getAreasByLngLat({ lng, lat, year, geoLevel, groupByLevel });
	if (areasList.error) error(areasList.error, areasList.message);

	return json(areasList);
};
