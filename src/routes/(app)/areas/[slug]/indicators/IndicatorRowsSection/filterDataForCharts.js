export function filterDataForCharts(
	indicatorChartData,
	selectedChartData,
	comparisonChartData,
	xDomain,
	selectionsObject
) {
	//filter chart data to only include data within selected time period range
	let filteredChartData =
		xDomain[1] && xDomain[0]
			? indicatorChartData.filter(
					(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
				)
			: null;

	let selectedFilteredChartData = selectedChartData
		? selectedChartData.filter((el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1])
		: null;

	let comparisonFilteredChartData = comparisonChartData
		? comparisonChartData
				.filter((el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1])
				.sort((a, b) => a.xDomainNumb - b.xDomainNumb)
		: null;

	//filter chart data for beeswarm to only include latest time period within selected time period range
	let filteredChartDataBeeswarm = filteredChartData.filter((el) => el.xDomainNumb === xDomain[1]);

	//filter to get beeswarm data for selected area
	let selectedFilteredChartDataBeeswarm = selectedFilteredChartData
		? selectedFilteredChartData.find((el) => el.xDomainNumb === xDomain[1])
		: null;

	let selectedFilteredChartDataBeeswarmWithRole = selectedFilteredChartDataBeeswarm
		? { ...selectedFilteredChartDataBeeswarm, role: 'main', priority: true }
		: null;

	//filter to get beeswarm data for comparison
	let comparisonFilteredChartDataBeeswarm = comparisonFilteredChartData
		? comparisonFilteredChartData.find((el) => parseFloat(el.xDomainNumb) === xDomain[1])
		: null;

	let comparisonFilteredChartDataBeeswarmWithRole = comparisonFilteredChartDataBeeswarm
		? {
				...comparisonFilteredChartDataBeeswarm,
				role: selectionsObject['areas-rows-comparison-visible'].role,
				priority: true
			}
		: null;

	//filter to get beeswarm data for additional selected areas
	let additionalFilteredChartDataBeeswarm = filteredChartDataBeeswarm
		.filter((el) => selectionsObject['areas-rows-additional-chosen'].includes(el.areacd))
		.map((el) => ({
			...el,
			role: selectionsObject['areas-rows-additional-visible'].find(
				(elm) => elm.areacd === el.areacd
			).role,
			priority: false
		}));

	return {
		timeSeries: {
			filtered: filteredChartData,
			selected: selectedFilteredChartData,
			comparison: comparisonFilteredChartData
		},
		beeswarm: {
			filtered: filteredChartDataBeeswarm,
			selected: selectedFilteredChartDataBeeswarmWithRole,
			comparison: comparisonFilteredChartDataBeeswarmWithRole,
			additional: additionalFilteredChartDataBeeswarm
		}
	};
}
