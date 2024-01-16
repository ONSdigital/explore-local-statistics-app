type AreaCodeResult = { kind: 'Success'; type: string; value: string } | { kind: 'Failure' };

export function extractAreaCodeFromSlug(slug: string): AreaCodeResult {
	const parts = slug.split('-');
	const code = parts[0];

	if (code !== '' && code.match(/[EKNSW]\d{8}\b/)) {
		return {
			kind: 'Success',
			type: code.slice(0, 3),
			value: code
		};
	} else {
		return {
			kind: 'Failure'
		};
	}
}
