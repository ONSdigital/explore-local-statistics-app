import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { read } from '$app/server';
import { getParam, hasValidParams } from '$lib/api/utils';
import getBoundaries from '$lib/api/geo/getBoundaries';
import topo from '$lib/data/topo.json?url';

export const GET: RequestHandler = ({ url, params }) => {
	if (!hasValidParams(url, new Set(['year', 'country', 'geoLevel'])))
		error(400, `Request contained invalid parameters.`);

	const format = params.format || null;
	const year = getParam(url, 'year', 'latest');
	const country = getParam(url, 'country', 'all');
	const geoLevel = getParam(url, 'geoLevel', 'ltla');

	if (format === 'topojson' && year === 'all' && country === 'all' && geoLevel === 'all')
		return read(topo);

	const boundaries = getBoundaries({
		format,
		year,
		country,
		geoLevel
	});
	if (boundaries.error) error(boundaries.error, boundaries.message);

	return json(boundaries);
};
