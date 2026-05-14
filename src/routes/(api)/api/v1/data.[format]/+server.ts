import type { RequestHandler } from './$types';
import { json, text, error } from '@sveltejs/kit';
import { dataParams, dataPrefixParams } from '$lib/api/config';
import { getParam, getDimensionFilters, hasValidParams } from '$lib/api/utils';
import getFilteredData from '$lib/api/data/getFilteredData';
import { isOversizedRequest } from '$lib/api/data/helpers/requestValidators';

export const GET: RequestHandler = async ({ url, params }) => {
	if (!hasValidParams(url, dataParams, dataPrefixParams))
		error(400, `Request contained invalid parameters.`);

	const format = params.format || null;
	const topic = getParam(url, 'topic', 'all');
	const indicator = getParam(url, 'indicator', 'all');
	const excludeMultivariate = getParam(url, 'excludeMultivariate', false);
	const geo = getParam(url, 'geo', 'all');
	const geoExtent = getParam(url, 'geoExtent', 'all');
	const geoCluster = getParam(url, 'geoCluster', 'all');
	const hasGeo = getParam(url, 'hasGeo', 'any');
	const time = getParam(url, 'time', 'latest');
	const timeNearest = getParam(url, 'timeNearest', 'none');
	const measure = getParam(url, 'measure', 'all');
	const includeNames = getParam(url, 'includeNames', true);
	const includeStatus = getParam(url, 'includeStatus', ['json', 'xlsx'].includes(format));
	const dimFilters = getDimensionFilters(url);

	const _params: parsedParams = {
		format,
		topic,
		indicator,
		excludeMultivariate,
		geo,
		geoExtent,
		geoCluster,
		hasGeo,
		time,
		timeNearest,
		measure,
		includeNames,
		includeStatus,
		dimFilters,
		href: url.href
	};

	// Suppress requests that may run out of memory
	if (isOversizedRequest(_params))
		error(400, `Too much data requested. Try narrowing your parameters.`);

	const datasets = await getFilteredData(_params);
	if (datasets.error) error(datasets.error, datasets.message);

	return datasets.format === 'xlsx'
		? new Response(datasets.data, {
				headers: {
					'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
					// "Content-Length": String(datasets.data._readableState.length)
				}
			})
		: datasets.format === 'text'
			? text(datasets.data)
			: json(datasets.data);
};
