import { error, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { extractAreaCodeFromSlug, makeCanonicalSlug } from '$lib/api/geo/helpers/areaSlugUtils';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params, url, fetch }) => {
	const code = extractAreaCodeFromSlug(params.code || '');
	if (code.error) error(code.error, code.message);

	let area;

	try {
		const areaPath = resolve(`/api/v1/geo/lookup/${code}`);
		area = await (await fetch(areaPath)).json();
		if (area.error) error(area.error, area.message);
	} catch (err) {
		console.log(err);
		error(404, { message: 'Area not found.' });
	}

	const canonicalSlug = makeCanonicalSlug(area.properties);
	if (params.code !== canonicalSlug) {
		const redirectPath = url.pathname.replace(params.code, canonicalSlug);
		redirect(301, resolve(redirectPath));
	}

	return { area };
};
