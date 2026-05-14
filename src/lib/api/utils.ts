import type { Url } from 'url';

function parseParam(param: string): parsedParam {
	return param === 'true'
		? true
		: param === 'false'
			? false
			: param.includes(',')
				? param.split(',')
				: param.match(/^-?\d+(\.\d+)?$/)
					? +param
					: param;
}

export function getParam(url: URL, key: string, fallback: parsedParam) {
	const param = url.searchParams.get(key);
	if (param == null) return fallback;
	return parseParam(param);
}

export function getDimensionFilters(url: URL) {
	const params = [...url.searchParams].filter((p) => p[0].startsWith('dimension_'));
	if (params.length === 0) return [];
	return params.map((p) => ({
		key: p[0].slice(10),
		values: parseParam(p[1])
	}));
}

export function hasValidParams(url: URL, params: Set<string>, prefixes: Set<string> = new Set()) {
	for (const key of url.searchParams.keys()) {
		if (!params.has(key) && !(key.includes('_') && prefixes.has(key.split('_')[0]))) return false;
	}
	return true;
}
