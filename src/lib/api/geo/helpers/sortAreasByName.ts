function getName(area: areaObject) {
	return area.hclnm || area.areanm || area.areacd || '';
}

export function sortAreasFunction(a: areaObject, b: areaObject) {
	return getName(a).localeCompare(getName(b), 'en-GB');
}

export default function sortAreasByName(areas: areaObject[]) {
	return [...areas].sort(sortAreasFunction);
}
