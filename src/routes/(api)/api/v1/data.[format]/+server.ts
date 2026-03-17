import type { RequestHandler } from './$types';
import { read } from '$app/server';
import { json, text, error } from '@sveltejs/kit';
import { getParam, getDimensionFilters } from '$lib/api/utils';
import getFilteredData from '$lib/api/data/getFilteredData';
import { files, paths } from '$lib/data';
import { isValidAreaCode, isValidAreaTypeCode } from '$lib/util/validationHelpers';

export const GET: RequestHandler = async ({ url, params }) => {
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

	// Return pre-generated XLSX files for large requests
	if (
		[topic, indicator, geo, geoExtent, geoCluster, time, measure].every((d) => d === 'all') &&
		format === 'xlsx'
	) {
		const areaType = isValidAreaCode(hasGeo)
			? hasGeo.slice(0, 3)
			: isValidAreaTypeCode(hasGeo)
				? hasGeo
				: null;
		const file = `all-datasets${areaType ? `-${areaType}` : ''}.xlsx`;
		const path = paths.find((p) => p.endsWith(`/${file}`));
		if (path) return read(files[path]);
		else error(400, `No datasets available for ${hasGeo}`);
	}

	const datasets = await getFilteredData({
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
	});
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
