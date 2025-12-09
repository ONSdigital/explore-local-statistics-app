export function filterDataForCharts(
	indicatorChartData,
	selectedChartData,
	comparisonChartData,
	xDomain,
	selectionsObject
) {
	let xDomainMax = indicatorChartData.find((el) => el.xDomainNumb < xDomain[1] + 1)?.xDomainNumb;

	//filter chart data to only include data within selected time period range
	let filteredChartData =
		xDomainMax && xDomain[0]
			? indicatorChartData.filter(
					(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomainMax
				)
			: null;

	let selectedFilteredChartData = selectedChartData
		? selectedChartData.filter((el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomainMax)
		: null;

	let comparisonFilteredChartData = comparisonChartData
		? comparisonChartData
				.filter((el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomainMax)
				.sort((a, b) => a.xDomainNumb - b.xDomainNumb)
		: null;

	//filter chart data for beeswarm to only include latest time period within selected time period range
	let filteredChartDataBeeswarm = filteredChartData
		? filteredChartData.filter((el) => el.xDomainNumb === xDomainMax)
		: null;
	//filter to get beeswarm data for selected areas
	let selectedFilteredChartDataBeeswarm = selectedFilteredChartData
		? selectedFilteredChartData.find((el) => el.xDomainNumb === xDomainMax)
		: null;

	let selectedFilteredChartDataBeeswarmWithRole = selectedFilteredChartDataBeeswarm
		? { ...selectedFilteredChartDataBeeswarm, role: 'main', priority: true }
		: null;

	//filter to get beeswarm data for comparison
	let comparisonFilteredChartDataBeeswarm = comparisonFilteredChartData
		? comparisonFilteredChartData.find((el) => parseFloat(el.xDomainNumb) === xDomainMax)
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
		? filteredChartDataBeeswarm
				.filter((el) => selectionsObject['areas-rows-additional-chosen'].includes(el.areacd))
				.map((el) => ({
					...el,
					role: selectionsObject['areas-rows-additional-visible'].find(
						(elm) => elm.areacd === el.areacd
					).role,
					priority: false
				}))
		: null;

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
