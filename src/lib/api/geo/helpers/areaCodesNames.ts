import areasLookup from '$lib/data/geo-metadata.json';

export function removeAreaNames(areas) {
	if (areas?.[0]?.areacd) return areas.map((a) => a.areacd);
	return areas;
}

export function codeToArea(code) {
	return { areacd: code, areanm: areasLookup[code]?.areanm };
}

export function addNameToArea(area) {
	return { ...area, areanm: areasLookup[area.areacd]?.areanm };
}

export function addAreaNames(areas) {
	if (typeof areas[0] === 'string') return areas.map(codeToArea);
	if (areas?.[0]?.areacd && !areas?.[0]?.areanm) return areas.map(addNameToArea);
	return areas;
}
