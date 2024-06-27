export function createTimeSeriesOfMedianValues(
	selectedArea,
	indicatorCalculationsArray,
	selectionsObject
) {
	let medianValuesArray = indicatorCalculationsArray.map((el) => {
		//median value for all siblings of our selected area
		let allSiblingsCalc = el.calcsByGeogLevel?.[selectedArea.geogLevel];

		//median value for all demographically similar areas to our selected area
		let similarCalc =
			selectedArea.similarCluster && 'demographic' in el.clustersCalculations
				? el.clustersCalculations.demographic[selectedArea.similarCluster]
				: null;

		//determine median value based on which selection object group is currently selected
		let value = {
			'all-siblings': allSiblingsCalc?.med,
			'similar-siblings': similarCalc?.median,
			'same-parent-siblings':
				el.sameParentGeogCalculations?.[selectedArea.parentcd + '-' + selectedArea.geogLevel]
					?.median,
			'region-children': el.sameParentGeogCalculations?.['regions_and_countries']?.med,
			'upper-tier-local-authority-children':
				el.sameParentGeogCalculations?.[selectedArea.areacd + '-upper']?.med,
			'lower-tier-local-authority-children':
				el.sameParentGeogCalculations?.[selectedArea.areacd + '-lower']?.med
		}[selectionsObject['areas-rows-comparison-visible'].group];

		return { xDomainNumb: el.period, value: value };
	});

	return medianValuesArray.filter((el) => el.value);
}
