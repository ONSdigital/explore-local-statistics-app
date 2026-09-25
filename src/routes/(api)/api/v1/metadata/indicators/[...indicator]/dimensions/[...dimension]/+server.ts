import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { hasValidParams } from '$lib/api/utils';
import getDimensions from '$lib/api/metadata/getDimensions';

export const GET: RequestHandler = ({ url, params }) => {
	if (!hasValidParams(url, new Set([])))
		error(400, `Request contained invalid or duplicate parameters.`);

	const indicator = params.indicator || null;
	const dimension = params.dimension || null;

	const dimensions = getDimensions({ indicator, dimension });
	if (dimensions.error) error(dimensions.error, dimensions.message);

	return json(dimensions);
};
