/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
export function filterChildren(place, type) {
	const labelKey = type.key === 'msoa' ? 'hclnm' : type.key === 'oa' ? 'areacd' : 'areanm';
	return place.children
		.filter((c) => type.codes.includes(c.areacd.slice(0, 3)))
		.sort((a, b) => a[labelKey].localeCompare(b[labelKey]));
}
