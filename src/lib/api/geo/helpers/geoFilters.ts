// Functions to filter geography metadata
import { geoLevels, geoLevelsAll } from '$lib/config/geoLevels';
import { isValidAreaCode } from '$lib/util/validationHelpers';
import readData from '$lib/data';

const metadata = await readData('json-stat-metadata');

export function geoYearFilter(item, year) {
	if (!item.start && !item.end) return true;
	if (!item.end && item.start <= year) return true;
	if (!item.start && item.end >= year) return true;
	if (item.start <= year && item.end >= year) return true;
	return false;
}

export function makeGeoFilter(param) {
	const codes = new Set();
	const types = new Set();
	for (const geo of param) {
		if (geoLevels[geo]) {
			for (const code of geoLevels[geo].codes) types.add(code);
		} else if (isValidAreaCode(geo) && !types.has(geo.slice(0, 3))) codes.add(geo);
	}
	return codes.size > 0 && types.size > 0
		? (d) => codes.has(d.areacd) || types.has(d.areacd.slice(0, 3))
		: types.size > 0
			? (d) => types.has(d.areacd.slice(0, 3))
			: codes.size > 0
				? (d) => codes.has(d.areacd)
				: () => false;
}

export function makeGeoLevelFilter(levels) {
	const codes = new Set(
		[levels]
			.flat()
			.map((l) => geoLevelsAll?.[l]?.codes)
			.flat()
	);
	return (cd) => codes.has(cd.slice(0, 3));
}

export function makeCountryFilter(countries) {
	const codes = new Set([countries].flat());
	return (cd) => codes.has(cd[0]);
}

export function makeGeoDatasetFilter(slug) {
	const ds = metadata.link.item.find((ds) => ds.extension.slug === slug);
	return ds ? (d) => ds.dimension.areacd.category.index[d.areacd] : () => false;
}

export function makeAreaListFilter(geo, year, indicator) {
	if (geo === 'all' && year === 'all' && indicator === 'all') return null;
	const yFilter = year === 'all' ? () => true : geoYearFilter;
	const gFilter = geo === 'all' ? () => true : makeGeoFilter([geo].flat());
	const iFilter = indicator === 'all' ? () => true : makeGeoDatasetFilter(indicator);
	return (d) => yFilter(d, year) && gFilter(d) && iFilter(d);
}
