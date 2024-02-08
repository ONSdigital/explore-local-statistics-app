import { error, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { LayoutLoad } from './$types';
import { getArea } from '$lib/api/getArea';
import { getCSV } from '$lib/api/getCSV';
import { extractAreaCodeFromSlug } from '$lib/util/areas/extractAreaCodeFromSlug';
import { makeCanonicalSlug } from '$lib/util/areas/makeCanonicalSlug';

export const load: LayoutLoad = async ({ params, fetch }) => {
	const code = extractAreaCodeFromSlug(params.slug);
	const links = await getCSV(`${base}/data/links.csv`, fetch);
	for (const link of links) {
		if (link.image && !link.image.startsWith('http')) link.image = base + link.image;
	}

	console.log(code);

	if (code.kind === 'Failure') {
		error(404, { message: 'Invalid area code' });
	}

	const result = await getArea(fetch, code.type, code.value);

	if (result.kind === 'Failure') {
		if (result.status === 404) {
			error(404);
		} else {
			error(500);
		}
	} else {
		const canonicalSlug = makeCanonicalSlug(result.place.areacd, result.place.areanm);

		if (params.slug !== canonicalSlug) {
			redirect(301, canonicalSlug);
		}

		return {
			title: `${result.place.areanm} (${result.place.groupnm}) - local statistics from the ONS`,
			description: `Explore local statistics from the ONS for ${result.place.areanm} (${result.place.groupnm}).`,
			links,
			...result
		};
	}
};
