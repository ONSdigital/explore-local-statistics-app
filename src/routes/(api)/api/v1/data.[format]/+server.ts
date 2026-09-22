import type { RequestHandler } from './$types';
import { json, text, error } from '@sveltejs/kit';
import { Readable } from 'node:stream';
import { dataParams } from '$lib/api/config';
import { getParam, getDimensionFilters, hasValidParams, hasValidTimeParam } from '$lib/api/utils';
import getFilteredData from '$lib/api/data/getFilteredData';
import { isOversizedRequest } from '$lib/api/data/helpers/requestValidators';

export const GET: RequestHandler = async ({ url, params }) => {
	if (!hasValidParams(url, dataParams))
		error(400, `Request contained invalid or duplicate parameters.`);

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

	if (!hasValidTimeParam([time].flat())) error(400, `Request contained invalid time period.`);

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
		? new Response(
				// `generateXLSX` now returns a `Readable`, not a `Buffer` - the workbook is
				// serialized (XML + ZIP compression, still with native Excel Tables intact)
				// as the client reads it, rather than being fully built in memory first.
				// `Readable.toWeb` is the standard bridge to the Web `ReadableStream` a Fetch
				// API `Response` body takes; SvelteKit's Node adapter already reads and writes
				// that incrementally, and propagates an early client disconnect back to
				// `.cancel()`/`.destroy()` on this stream. Content-Length can't be set - the
				// compressed size isn't known until the last byte is written.
				Readable.toWeb(datasets.data) as ReadableStream<Uint8Array>,
				{
					headers: {
						'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
					}
				}
			)
		: datasets.format === 'text'
			? text(datasets.data)
			: json(datasets.data);
};
