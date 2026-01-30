// Functions to filter JSON-Stat at a dataset level
import { geoLevels } from '$lib/config/geoLevels';
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
	return {
		error: 400,
		message: "Invalid 'hasGeo' parameter. Must be a valid GSS code or geography level."
	};
}

export function makeDatasetFilter(indicator, topic, excludeMultivariate, geo, year) {
	if (!indicator && topic === 'all' && geo === 'all' && year === 'all' && !excludeMultivariate)
		return () => true;
	const multivariateFilter =
		excludeMultivariate === true ? (ds) => !ds.extension.isMultivariate : () => true;
	const indicatorFilter = makeIndicatorFilter(indicator, topic);
	const yearFilter = year === 'all' ? () => true : makeYearFilter(year);
	if (yearFilter.error) return yearFilter;
	const geoFilter = geo === 'all' ? () => true : makeDatasetGeoFilter(geo);
	if (geoFilter.error) return geoFilter;
	return (ds) => indicatorFilter(ds) && multivariateFilter(ds) && yearFilter(ds) && geoFilter(ds);
}
