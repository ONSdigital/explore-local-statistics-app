import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import getDimensions from '$lib/api/metadata/getDimensions';

export const GET: RequestHandler = ({ params }) => {
	const indicator = params.indicator || null;
	const dimension = params.dimension || null;

	const dimensions = getDimensions({ indicator, dimension });
	if (dimensions.error) error(dimensions.error, dimensions.message);

	return json(dimensions);
};
