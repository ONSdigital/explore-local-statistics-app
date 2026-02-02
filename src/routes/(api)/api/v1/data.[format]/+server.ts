import type { RequestHandler } from './$types';
import { json, text, error } from '@sveltejs/kit';
import { getParam, getDimensionFilters } from '$lib/api/utils';
import getFilteredData from '$lib/api/data/getFilteredData';

export const GET: RequestHandler = async ({ url, params }) => {
	const format = params.format || null;
	const topic = getParam(url, 'topic', 'all');
	const indicator = getParam(url, 'indicator', 'all');
	const excludeMultivariate = getParam(url, 'excludeMultivariate', false);
	const geo = getParam(url, 'geo', 'all');
	const geoExtent = getParam(url, 'geoExtent', 'all');
	const geoCluster = getParam(url, 'geoCluster', 'all');
	const hasGeo = getParam(url, 'hasGeo', 'any');
	const groupByArea = getParam(url, 'groupByArea', false);
	const time = getParam(url, 'time', 'latest');
	const timeNearest = getParam(url, 'timeNearest', 'none');
	const measure = getParam(url, 'measure', 'all');
	const includeNames = getParam(url, 'includeNames', true);
	const includeStatus = getParam(url, 'includeStatus', ['json', 'xlsx'].includes(format));
	const dimFilters = getDimensionFilters(url);

	const datasets = await getFilteredData({
		format,
		topic,
		indicator,
		excludeMultivariate,
		geo,
		geoExtent,
		geoCluster,
		hasGeo,
		groupByArea,
		time,
		timeNearest,
		measure,
		includeNames,
		includeStatus,
		dimFilters,
		href: url.href
	});
	if (datasets.error) error(datasets.error, datasets.message);

	// NOTE: This should be replaced with a more limited list of origins in production
	const headers = { 'Access-Control-Allow-Origin': '*' };

	return datasets.format === 'xlsx'
		? new Response(datasets.data, {
				headers: {
					...headers,
					'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
					// "Content-Length": String(datasets.data._readableState.length),
				}
			})
		: datasets.format === 'text'
			? text(datasets.data, { headers })
			: json(datasets.data, { headers });
};
