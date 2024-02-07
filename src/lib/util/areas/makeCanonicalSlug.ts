import { slugify } from '../url/slugify';

export const makeCanonicalSlug = (code: string, name?: string) => {
	if (!code) {
		throw 'No area code was given';
	}

	if (name === undefined) {
		return code;
	}

	if (!name) {
		throw 'No area name was given';
	}

	const slugifiedName = slugify(name);
	return `${code}-${slugifiedName}`;
};
