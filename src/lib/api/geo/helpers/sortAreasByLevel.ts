import { geoCodesAllArray } from '$lib/config/geoLevels';

// Sorts areas from large to small (ie. from country to output area)
function sortAreas(a, b) {
	const aIndex = geoCodesAllArray.indexOf(a?.areacd?.slice(0, 3));
	const bIndex = geoCodesAllArray.indexOf(b?.areacd?.slice(0, 3));
	return aIndex === bIndex ? 0 : aIndex === -1 ? -1 : bIndex === -1 ? 1 : aIndex > bIndex ? 1 : -1;
}

export default function sortAreasByLevel(areas) {
	if (areas.length === 0) return [];

	return [...areas].sort(sortAreas);
}
