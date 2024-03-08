<script lang="ts">
	import ChartOptions from '$lib/prototype-components/ChartOptions.svelte';
	import BarChartContainer from '$lib/prototype-components/area-page/main-chart/BarChartContainer.svelte';

	export let metadata, indicator, chartData, customLookup, selectionsObject;

	let chosenXDomain = [metadata.globalXDomainExtent[0], metadata.globalXDomainExtent[1]];

	let showConfidenceIntervals = false;

	$: indicatorCalculations = metadata.indicatorsCalculationsArray.find(
		(el) =>
			el.code === indicator.code &&
			el.period === indicator.maxXDomainNumb &&
			el.geog_level === 'lower'
	);

	$: filteredChartData = chartData.filter((el) => el.value);

	$: filteredChartDataSelected = [];

	$: filteredChartDataAdditionals = filteredChartData.filter((el) =>
		selectionsObject['indicator-additional-chosen'].includes(el.areacd)
	);
	$: filteredChartDataAreaGroup = selectionsObject['related-single-visible']
		? filteredChartData.filter(
				(el) =>
					selectionsObject['related-single-visible'].codes.includes(el.areacd) &&
					!selectionsObject['indicator-additional-chosen'].includes(el.areacd) &&
					el.areacd != selectedArea.areacd
			)
		: [];

	$: console.log(filteredChartDataAreaGroup);

	$: visibleAreasPeriods = [
		...new Set(
			[
				...filteredChartDataAdditionals,
				...filteredChartDataAreaGroup,
				...filteredChartDataSelected
			].map((el) => el.xDomainNumb)
		)
	];
	$: visibleAreasXDomain = [Math.min(...visibleAreasPeriods), Math.max(...visibleAreasPeriods)];

	$: xDomainInit = [
		Math.min(
			chosenXDomain[1],
			chosenXDomain[0] > visibleAreasXDomain[0] ? chosenXDomain[0] : visibleAreasXDomain[0]
		),
		Math.max(
			chosenXDomain[0],
			chosenXDomain[1] < visibleAreasXDomain[1] ? chosenXDomain[1] : visibleAreasXDomain[1]
		)
	];

	$: xDomain = [
		Math.min(...visibleAreasPeriods.filter((el) => el >= xDomainInit[0])),
		Math.max(...visibleAreasPeriods.filter((el) => el <= xDomainInit[1]))
	];

	$: timePeriodsArray = metadata.periodsLookupArray.filter(
		(el) =>
			el.periodGroup === indicator.periodGroup &&
			el.xDomainNumb >= xDomain[0] &&
			el.xDomainNumb <= xDomain[1]
	);
</script>

<div class="row-container align-right-container">
	<ChartOptions {metadata} bind:chosenXDomain bind:showConfidenceIntervals></ChartOptions>
</div>

{#if timePeriodsArray.length === 0}
	<div class="no-chart-container">
		<p>No data for selected areas over time period</p>
	</div>
{:else if timePeriodsArray.length > 0}
	<BarChartContainer
		{indicator}
		{metadata}
		latestPeriod={timePeriodsArray.find((el) => el.xDomainNumb === xDomain[1])}
		filteredChartDataSelected={filteredChartDataSelected.filter(
			(el) => el.xDomainNumb === xDomain[1]
		)}
		filteredChartDataAdditionals={filteredChartDataAdditionals.filter(
			(el) => el.xDomainNumb === xDomain[1]
		)}
		filteredChartDataAreaGroup={filteredChartDataAreaGroup.filter(
			(el) => el.xDomainNumb === xDomain[1]
		)}
		{selectionsObject}
		selectedArea={null}
		{indicatorCalculations}
		{xDomain}
		{customLookup}
		{showConfidenceIntervals}
		additionalID="indicator-additional"
		relatedID="indicator-related"
	></BarChartContainer>
	<!-- <LineChartContainer
		{indicator}
		{metadata}
		{timePeriodsArray}
		filteredChartDataSelected={filteredChartDataSelected.filter(
			(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
		)}
		filteredChartDataAdditionals={filteredChartDataAdditionals.filter(
			(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
		)}
		filteredChartDataAreaGroup={filteredChartDataAreaGroup.filter(
			(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
		)}
		{selectionsObject}
		selectedArea={null}
		additionalID="indicator-additional"
		relatedID="indicator-related"
		{indicatorCalculations}
		{xDomain}
		{customLookup}
		{showConfidenceIntervals}
	></LineChartContainer> -->
{:else}
	<div class="no-chart-container">
		<p>No data for selected areas prior to {timePeriodsArray[0].label}</p>
	</div>
{/if}

<style>
	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
	}

	.align-right-container {
		justify-content: end;
	}

	.no-chart-container {
		height: 500px;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		font-weight: bold;
	}
</style>
