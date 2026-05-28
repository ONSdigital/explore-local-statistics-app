import summaryStats from '$lib/data/json-stat-summary.json';
const minYear = summaryStats.years[0];
const maxYear = summaryStats.years[summaryStats.years.length - 1];

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

export function hasValidParams(url: URL, params: Set<string>) {
	const keys = url.searchParams.keys();

	for (const key of keys) {
		if (!params.has(key) || url.searchParams.getAll(key).length > 1) return false;
	}
	return true;
}

function isValidTime(value: string | number) {
	if (['earliest', 'latest', 'all'].includes(value)) return true;
	const year = +String(value).slice(0, 4);
	if (year <= maxYear && year >= minYear) return true;
	return false;
}

export function hasValidTimeParam(values: (string | number)[]) {
	for (const value of values) {
		if (!isValidTime(value)) return false;
	}
	return true;
}
