export function makeGeoArray(areacd, level, metadata, selectedArea) {
	const allAreas = metadata.areasGeogLevelObject[level];
	const filter = metadata.areasObject[selectedArea.areacd].geogLevel === level;
	const areas = filter ? allAreas.filter((cd) => cd !== areacd) : allAreas;
	return areas
		.map((cd) => metadata.areasObject[cd])
		.sort((a, b) => (a.areanm > b.areanm ? 1 : b.areanm > a.areanm ? -1 : 0));
}
