import type { RequestHandler } from './$types';
import { json, text, error } from '@sveltejs/kit';
import { Readable } from 'node:stream';
import { dataItemParams } from '$lib/api/config';
import { getParam, getDimensionFilters, hasValidParams, hasValidTimeParam } from '$lib/api/utils';
import getFilteredData from '$lib/api/data/getFilteredData';

// The item route: one specific indicator, named in the path, always returns the bare
// (non-collection) shape - the counterpart to `/api/v1/data.{format}` (the collection route,
// `../data.[format]/+server.ts`), which is unconditionally collection-shaped. See
// `docs/api/data-endpoint.md`/`data-item-endpoint.md` for the full behaviour writeup.
//
// `topic`, `indicator` and `excludeMultivariate` are not accepted here at all (the path
// already pins the one indicator) - `dataItemParams` is `dataParams` minus those three, so
// passing any of them is the same `400` as any other unrecognised parameter. There's also no
// `isOversizedRequest` check: that heuristic can never fire for a single named indicator (its
// "large indicators" axis is permanently false here), so it would just be dead weight.
export const GET: RequestHandler = async ({ url, params }) => {
	if (!hasValidParams(url, dataItemParams))
		error(400, `Request contained invalid or duplicate parameters.`);

	const format = params.format || null;
	const indicator = params.indicator || null;
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
		topic: 'all',
		indicator,
		excludeMultivariate: false,
		singleIndicator: true,
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

	const datasets = await getFilteredData(_params);
	if (datasets.error) error(datasets.error, datasets.message);

	return datasets.format === 'xlsx'
		? new Response(
				// See `../data.[format]/+server.ts` for why this streams rather than buffers -
				// identical handling here.
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
