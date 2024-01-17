import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getArea } from '$lib/api/getArea';
import { extractAreaCodeFromSlug } from '$lib/util/areas/extractAreaCodeFromSlug';
import { makeCanonicalSlug } from '$lib/util/areas/makeCanonicalSlug';

export const load: PageLoad = async ({ params }) => {
	const code = extractAreaCodeFromSlug(params.slug);

	if (code.kind === 'Failure') {
		error(404, { message: 'Invalid area code' });
	}

	const result = await getArea(code.type, code.value);

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
			...result
		};
	}
};
