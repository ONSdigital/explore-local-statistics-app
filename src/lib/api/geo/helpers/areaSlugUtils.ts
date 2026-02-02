import { isValidAreaCode } from '$lib/util/validationHelpers';
import { slugify } from '$lib/utils';

export function extractAreaCodeFromSlug(slug: string): string | errorObject {
	const parts = slug.split('-');
	const code = parts[0];

	if (isValidAreaCode(code)) return code;
	return { error: 404, message: 'Area not found. Invalid GSS code.' };
}

export const makeCanonicalSlug = (props: areaObject) => {
	if (!props?.areacd) throw 'No area code was given';
	if (!props?.areanm) return props.areacd;

	return `${props.areacd}-${slugify(props.areanm)}`;
};
