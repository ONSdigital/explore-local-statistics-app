import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getParam, hasValidParams } from '$lib/api/utils';
import getIndicators from '$lib/api/metadata/getIndicators';

export const GET: RequestHandler = ({ url, params }) => {
	if (
		!hasValidParams(
			url,
			new Set([
				'indicator',
				'topic',
				'excludeMultivariate',
				'hasGeo',
				'hasYear',
				'fullDims',
				'asLookup'
			])
		)
	)
		error(400, `Request contained invalid or duplicate parameters.`);

	const indicator = params.indicator || getParam(url, 'indicator', null);
	const topic = getParam(url, 'topic', 'all');
	const excludeMultivariate = getParam(url, 'excludeMultivariate', false);
	const hasGeo = getParam(url, 'hasGeo', 'all');
	const hasYear = getParam(url, 'hasYear', 'all');
	const fullDims = getParam(url, 'fullDims', false);
	const asLookup = getParam(url, 'asLookup', false);

	const metadata = getIndicators({
		indicator,
		topic,
		excludeMultivariate,
		hasGeo,
		hasYear,
		fullDims,
		asLookup,
		singleIndicator: !!params.indicator
	});

	if (!metadata) error(404, `Indicator "${indicator}" not found.`);
	if (metadata.error) error(metadata.error, metadata.message);

	return json(metadata);
};
