import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { hasValidParams } from '$lib/api/utils';
import getAreaByCode from '$lib/api/geo/getAreaByCode';

export const GET: RequestHandler = async ({ url, params }) => {
	if (!hasValidParams(url, new Set([])))
		error(400, `Request contained invalid or duplicate parameters.`);

	const code = params.code;

	const area = await getAreaByCode(code);
	if (area.error) error(area.error, area.message);

	return json(area);
};
