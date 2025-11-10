<script lang="ts">
	import TitleAndAdditionalDescription from './TitleAndAdditionalDescription.svelte';
	import BeeswarmContainer from '$lib/data-viz/indicator-row-beeswarm/BeeswarmContainer.svelte';
	import LineChartContainer from '$lib/data-viz/indicator-row-line-chart/LineChartContainer.svelte';

	import { createTimeSeriesOfMedianValues } from './createTimeSeriesOfMedianValues';
	import { filterDataForCharts } from './filterDataForCharts';

	import { Observe } from '@onsvisual/svelte-components';

	export let hoverAreaId,
		hoverIndicatorId,
		indicator,
		metadata,
		indicatorChartData,
		customLookup,
		selectedArea,
		selectionsObject,
		chosenXDomain,
		showConfidenceIntervals;

	//get data for our selected area, determine which time period range our selected area has data for
	$: selectedChartData = indicatorChartData
		? indicatorChartData.filter(
				(el) => el.areacd === selectedArea.areacd && (el.value == 0 ? el : el.value)
			)
		: null;
	$: selectedPeriods = selectedChartData ? selectedChartData.map((el) => el.xDomainNumb) : [];
	$: selectedXDomain = [Math.min(...selectedPeriods), Math.max(...selectedPeriods)];

	//get the calculations for the indicator for every year as an array. if the comparison is a median value, this is required to create comparisonChartData
	$: indicatorCalculationsArray = metadata['_newStyleIndicatorsCalculationsArray'].filter(
		(el) => el.code === indicator.code
	);

	//if our comparison is a median value, label will be a key in our selectionsObject entry. in this case we need to get that median value for each year and create an array [{xDomainNumb: xxx, value: median value for xxx},...] - this is what createTimeSeriesOfMedianValues does. if our comparison is an area then we simply filter for data for that area code. we then determine which time period range our comparison data belongs to
	$: comparisonChartData = indicatorChartData
		? selectionsObject['areas-rows-comparison-visible']
			? 'label' in selectionsObject['areas-rows-comparison-visible']
				? createTimeSeriesOfMedianValues(selectedArea, indicatorCalculationsArray, selectionsObject)
				: indicatorChartData.filter(
						(el) => el.areacd === selectionsObject['areas-rows-comparison-visible'].areacd
					)
			: []
		: null;
	$: comparisonPeriods = comparisonChartData ? comparisonChartData.map((el) => el.xDomainNumb) : [];
	$: comparisonXDomain = [Math.min(...comparisonPeriods), Math.max(...comparisonPeriods)];

	//the time period range based on combined data from our selected area and primary comparison
	// $: selectedAndComparisonXDomain = [
	// 	Math.min(selectedXDomain[0], comparisonXDomain[0]),
	// 	Math.max(selectedXDomain[1], comparisonXDomain[1])
	// ];
	$: selectedAndComparisonXDomain = selectedXDomain;

	//determine xDomain for time series chart and latest time period - used for the beeswarm.
	$: xDomainInit = [
		Math.min(
			chosenXDomain[1],
			chosenXDomain[0] > selectedAndComparisonXDomain[0]
				? chosenXDomain[0]
				: selectedAndComparisonXDomain[0]
		),
		Math.max(
			chosenXDomain[0],
			chosenXDomain[1] < selectedAndComparisonXDomain[1]
				? chosenXDomain[1]
				: selectedAndComparisonXDomain[1]
		)
	];

	$: xDomain = [
		Math.min(...[...selectedPeriods, ...comparisonPeriods].filter((el) => el >= xDomainInit[0])),
		Math.max(...[...selectedPeriods, ...comparisonPeriods].filter((el) => el <= xDomainInit[1]))
	];

	// get calculations for latest time period. our preference is to use calculations for
	$: latestIndicatorCalculations = indicatorCalculationsArray.find(
		(el) => el.period === xDomain[1]
	);

	$: indicatorCalculations =
		latestIndicatorCalculations?.calcsByGeogLevel?.[selectedArea.geogLevel];

	//filter time periods
	$: timePeriodsArrayGlobal = metadata.periodsLookupArray.filter(
		(el) =>
			el.periodGroup === indicator.periodGroup &&
			indicator.years.includes(el.xDomainNumb) &&
			el.xDomainNumb >= chosenXDomain[0] &&
			el.xDomainNumb <= chosenXDomain[1]
	);

	$: timePeriodsArray = metadata.periodsLookupArray.filter(
		(el) =>
			el.id === indicator.id &&
			indicator.years.includes(el.xDomainNumb) &&
			el.xDomainNumb >= chosenXDomain[0] &&
			el.xDomainNumb <= chosenXDomain[1] &&
			el.xDomainNumb >= xDomain[0] &&
			el.xDomainNumb <= xDomain[1]
	);

	$: latestTimePeriod = timePeriodsArray.find((el) => el.xDomainNumb == xDomain[1]);

	//filter data so that it's ready to be used for beeswarm and time series charts
	$: filteredChartDataObject = filterDataForCharts(
		indicatorChartData,
		selectedChartData,
		comparisonChartData,
		xDomain,
		selectionsObject
	);

	$: showVisuals = filteredChartDataObject && latestTimePeriod;

	let observed = false;
</script>

<div
	id={indicator.metadata.slug}
	class="indicator-row-container"
	style:margin-bottom="20px"
	style:scroll-margin-top="140px"
>
	<TitleAndAdditionalDescription {showVisuals} {indicator}></TitleAndAdditionalDescription>
</div>

<Observe bind:visible={observed}>
	<div class="indicator-row-container">
		{#if showVisuals}
			<div class="visuals-container">
				<div class="beeswarm-container">
					<BeeswarmContainer
						{observed}
						{metadata}
						{indicator}
						{latestTimePeriod}
						{latestIndicatorCalculations}
						{selectionsObject}
						{selectedArea}
						bind:hoverAreaId
						bind:hoverIndicatorId
						selectedFilteredChartDataBeeswarmWithRole={filteredChartDataObject.beeswarm.selected}
						comparisonFilteredChartDataBeeswarmWithRole={filteredChartDataObject.beeswarm
							.comparison}
						additionalFilteredChartDataBeeswarm={filteredChartDataObject.beeswarm.additional}
						filteredChartDataBeeswarm={filteredChartDataObject.beeswarm.filtered}
						{customLookup}
						{showConfidenceIntervals}
						{indicatorCalculations}
					></BeeswarmContainer>
				</div>

				<div class="divider-vertical"></div>

				<div class="line-chart-container">
					{#if xDomain[0] != xDomain[1]}
						<LineChartContainer
							filteredChartData={filteredChartDataObject.timeSeries.filtered}
							{metadata}
							{indicator}
							{selectedArea}
							{selectionsObject}
							{hoverAreaId}
							{timePeriodsArray}
							{xDomain}
							selectedFilteredChartData={filteredChartDataObject.timeSeries.selected}
							comparisonFilteredChartData={filteredChartDataObject.timeSeries.comparison}
							{indicatorCalculations}
							{customLookup}
							{showConfidenceIntervals}
						></LineChartContainer>
					{:else}
						<span>No time series data to display</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</Observe>

<style>
	.divider-vertical {
		border-right-style: solid;
		border-right-color: #cbd5e1;
		border-right-width: 1px;
		margin: 0px 15px 0px 5px;
		width: 0px;
	}

	.indicator-row-container {
		padding: 0px;
		display: flex;
		flex-direction: column;
	}

	.visuals-container {
		margin: 0px;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: space-between;
		width: 100%;
	}

	.beeswarm-container {
		flex-grow: 1;
		overflow: hidden;
	}

	.beeswarm-container:focus-within {
		box-shadow:
			0 0 0 0 var(--ons-color-page-light),
			0 0 0 2px var(--ons-color-text-link-focus),
			0 0 0 6px var(--ons-color-focus);
		outline: 3px solid rgba(0, 0, 0, 0);
		z-index: 1;
	}

	.line-chart-container {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		justify-content: center;
		width: 225px;
		overflow: hidden;
	}

	@media (max-width: 950px) {
		.line-chart-container {
			display: none;
		}

		.divider-vertical {
			display: none;
		}

		.beeswarm-container {
			margin: 0px 10px;
		}
	}

	span {
		text-align: center;
		font-size: 16px;
		line-height: 20px;
		font-weight: bold;
	}

	.no-data-text {
		font-weight: bold;
	}
</style>
