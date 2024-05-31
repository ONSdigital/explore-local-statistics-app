export function findChildrenAreas(metadata, selectedArea, geographyLevel) {
	return {
		lower: [],
		upper: [],
		combined: [],
		region: ['upper', 'lower'].includes(geographyLevel)
			? metadata.areasGeogLevelObject.upper
					.map((el) => metadata.areasObject[el])
					.filter((el) => [el.parentcd, el.countrycd].includes(selectedArea.areacd))
			: [],
		country: metadata.areasGeogLevelObject.region
			.map((el) => metadata.areasObject[el])
			.filter((el) => [el.parentcd, el.countrycd].includes(selectedArea.areacd))
	}[selectedArea.geogLevel];
}
