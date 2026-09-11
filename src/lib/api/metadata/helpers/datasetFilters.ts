// Functions to filter JSON-Stat at a dataset level
import { geoLevels, geoCodesViz } from '$lib/config/geoLevels';
import { isValidAreaCode, isValidYear } from '$lib/util/validationHelpers';

export function makeIndicatorFilter(indicator, topic) {
	if ((!indicator || indicator === 'all') && topic === 'all') return () => true;

	const topics = [topic].flat();
	const indicators = [indicator].flat();
	return !indicator || indicator === 'all'
		? (ds) => [ds.extension.topic, ds.extension.subtopic].some((t) => topics.includes(t))
		: indicator && topic === 'all'
			? (ds) => indicators.includes(ds.extension.slug)
			: (ds) =>
					indicators.includes(ds.extension.slug) ||
					[ds.extension.topic, ds.extension.subtopic].some((t) => topics.includes(t));
}

export function makeYearFilter(year) {
	const timeString = String(year);
	if (!isValidYear(timeString))
		return { error: 400, message: "Invalid 'hasYear' parameter. Must be YYYY or 'all'." };
	return (ds) =>
		Object.keys(ds.dimension.period.category.index)
			.map((d) => d.slice(0, 4))
			.includes(timeString);
}

export function hasGeo(ds, geo) {
	return geo in ds.dimension.areacd.category.index;
}

export function makeDatasetGeoFilter(geo) {
	if (isValidAreaCode(geo)) return (ds) => hasGeo(ds, geo);
	if (geo in geoLevels) return (ds) => ds.extension.geography.levels.includes(geo);
	if (geoCodesViz.has(geo)) return (ds) => ds.extension.geography.types.includes(geo);
	return {
		error: 400,
		message: "Invalid 'hasGeo' parameter. Must be a valid GSS code or geography level."
	};
}

export function makeDatasetFilter(indicator, topic, excludeMultivariate, geo, year) {
	if (!indicator && topic === 'all' && geo === 'any' && year === 'all' && !excludeMultivariate)
		return () => true;
	// A multivariate indicator named explicitly in `indicator` is kept even with
	// excludeMultivariate=true - the exclusion only applies to indicators pulled in broadly via
	// `topic`/`all`. Matches the data endpoint's `filterIndicators.ts` behaviour.
	const indicators = new Set([indicator].flat());
	const multivariateFilter =
		excludeMultivariate === true
			? (ds) => !ds.extension.isMultivariate || indicators.has(ds.extension.slug)
			: () => true;
	const indicatorFilter = makeIndicatorFilter(indicator, topic);
	const yearFilter = year === 'all' ? () => true : makeYearFilter(year);
	if (yearFilter.error) return yearFilter;
	// 'any' is the "no filter" sentinel here, matching the data endpoint's hasGeo - not 'all',
	// which would be semantically backwards (implying "only datasets covering every geography").
	const geoFilter = geo === 'any' ? () => true : makeDatasetGeoFilter(geo);
	if (geoFilter.error) return geoFilter;
	return (ds) => indicatorFilter(ds) && multivariateFilter(ds) && yearFilter(ds) && geoFilter(ds);
}
