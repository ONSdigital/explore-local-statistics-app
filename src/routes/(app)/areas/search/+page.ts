import type { PageLoad } from './$types';
import { resolve } from '$app/paths';
import { getParam } from '$lib/api/utils';
import { isValidPostcode } from '$lib/util/validationHelpers';

// Hard coded limit of 10 results per page
const limit = 10;
const meta = {
	title: 'Area search - ONS',
	description:
		'Find local areas within the UK including countries, regions, local authorities, parliamentary constituencies, electoral wards and parishes.',
	pageType: 'area search page',
	breadcrumbLinks: [{ label: 'Home', href: resolve('/') }]
};
const noResult = (query = null, page = 1) => ({
	meta: { query, page, count: 0, total: 0, limit, offset: 0 },
	data: []
});

export const load: PageLoad = async ({ url, fetch }) => {
	const query = getParam(url, 'q', null);
	const page = getParam(url, 'page', 1);
	const offset = (page - 1) * limit;
	if (!query) return { ...noResult(), ...meta };

	try {
		if (isValidPostcode(query.toUpperCase())) {
			const path = resolve(`/api/v1/geo/postcodes/${query}`);
			const result = await (await fetch(path)).json();
			if (result.message) throw Error();
			return { ...result, ...meta };
		} else {
			const path = resolve(`/api/v1/geo/search/${query}${offset ? `?offset=${offset}` : ''}`);
			const result = await (await fetch(path)).json();
			if (result.message) throw Error();
			return { ...result, ...meta };
		}
	} catch (err) {
		return { ...noResult(query, page), ...meta };
	}
};
