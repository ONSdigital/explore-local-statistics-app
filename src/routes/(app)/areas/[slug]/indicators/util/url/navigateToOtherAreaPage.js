import { base } from '$app/paths';
import { goto } from '$app/navigation';
import { makeCanonicalSlug } from '$lib/util/areas/makeCanonicalSlug';

export function navigateToOtherAreaPage(e, options = {}, type = 'search') {
	if (e.detail.type === 'postcode') {
		postcode = e.detail;
	} else {
		goto(
			`${base}/areas/${makeCanonicalSlug(e.detail.areacd, e.detail.areanm)}/indicators`,
			options
		);
	}
}
