// Functions to filter geography metadata
import { geoLevels, geoLevelsAll } from '$lib/config/geoLevels';
import { isValidAreaCode } from '$lib/util/validationHelpers';

export function geoYearFilter(area: areaObject, year: number | null) {
	return !year || ((!area.start || year >= area.start) && (!area.end || year <= area.end));
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
