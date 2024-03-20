import { error, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { LayoutLoad } from './$types';
import { getArea } from '$lib/api/getArea';
import { getCSV } from '$lib/api/getCSV';
import { extractAreaCodeFromSlug } from '$lib/util/areas/extractAreaCodeFromSlug';
import { makeCanonicalSlug } from '$lib/util/areas/makeCanonicalSlug';
import { getName } from '@onsvisual/robo-utils';

export const load: LayoutLoad = async ({ params, fetch }) => {
	const code = extractAreaCodeFromSlug(params.slug);
	const links = await getCSV(`${base}/data/links.csv`, fetch);
	for (const link of links) {
		for (const key of ['url', 'image']) {
			if (link[key] && !link[key].startsWith('http')) link[key] = base + link[key];
		}
	}

	if (code.kind === 'Failure') {
		error(404, { message: 'Invalid area code' });
	}

	const result = await getArea(fetch, code.type, code.value);

	if (result.kind === 'Failure') {
		if (result.status === 404) {
			error(404, { message: 'Page not found' });
		} else {
			error(500, { message: 'Sorry, there was an error with this page' });
		}
	} else {
		const canonicalSlug = makeCanonicalSlug(result.place.areacd, result.place.areanm);

		if (params.slug !== canonicalSlug) {
			redirect(301, canonicalSlug);
		}

		return {
			...result,
			links,
			title: `${getName(result.place)} (${result.place.areacd}) - ONS`,
			description: `Find facts and figures from across the ONS on ${getName(result.place, 'the')} (${result.place.typenm}).`
		};
	}
};
