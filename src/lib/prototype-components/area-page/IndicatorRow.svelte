<script lang="ts">
	// check if/where this file is being used might need weeding
	import TitleAdditionalDescription from '$lib/prototype-components/area-page/indicator-rows/TitleAdditionalDescription.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';
	import BeeswarmRowContainer from '$lib/prototype-components/area-page/indicator-rows/BeeswarmRowContainer.svelte';
	import LineChartRowContainer from '$lib/prototype-components/area-page/indicator-rows/LineChartRowContainer.svelte';
	import { onMount } from 'svelte';
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

	let width;

	$: indicatorCalculationsArray = metadata['_newStyleIndicatorsCalculationsArray'].filter(
		(el) => el.code === indicator.code
	);

	$: selectedChartData = indicatorChartData
		? indicatorChartData.filter((el) => el.areacd === selectedArea.areacd && el.value)
		: null;
	$: selectedPeriods = selectedChartData ? selectedChartData.map((el) => el.xDomainNumb) : [];
	$: selectedXDomain = [Math.min(...selectedPeriods), Math.max(...selectedPeriods)];

	$: comparisonChartData = indicatorChartData
		? selectionsObject['areas-rows-comparison-visible']
			? 'label' in selectionsObject['areas-rows-comparison-visible']
				? indicatorCalculationsArray
						.map((el) => {
							let allSiblingsCalc =
								selectedArea.geogLevel in el.calcsByGeogLevel
									? el.calcsByGeogLevel[selectedArea.geogLevel].med
									: null;

							let similarCalc =
								selectedArea.geogLevel === 'lower' && selectedArea.similarCluster
									? 'demographic' in el.clustersCalculations
										? el.clustersCalculations.demographic[selectedArea.similarCluster].median
										: null
									: null;

							let xDomainNumb = el.period;
							let value =
								selectionsObject['areas-rows-comparison-visible'].group === 'all-siblings'
									? allSiblingsCalc
									: selectionsObject['areas-rows-comparison-visible'].group ===
										  'same-parent-siblings'
										? el.sameParentGeogCalculations[
												selectedArea.parentcd + '-' + selectedArea.geogLevel
											].median
										: selectionsObject['areas-rows-comparison-visible'].group === 'similar-siblings'
											? similarCalc
											: selectionsObject['areas-rows-comparison-visible'].group ===
												  'region-children'
												? el.sameParentGeogCalculations['regions_and_countries'].med
												: selectionsObject['areas-rows-comparison-visible'].group ===
													  'upper-tier-local-authority-children'
													? el.sameParentGeogCalculations[selectedArea.areacd + '-upper'].med
													: selectionsObject['areas-rows-comparison-visible'].group ===
														  'lower-tier-local-authority-children'
														? el.sameParentGeogCalculations[selectedArea.areacd + '-lower'].med
														: null;

							return { xDomainNumb: xDomainNumb, value: value };
						})
						.filter((el) => el.value)
				: indicatorChartData.filter(
						(el) => el.areacd === selectionsObject['areas-rows-comparison-visible'].areacd
					)
			: []
		: null;

	$: comparisonPeriods = comparisonChartData ? comparisonChartData.map((el) => el.xDomainNumb) : [];
	$: comparisonXDomain = [Math.min(...comparisonPeriods), Math.max(...comparisonPeriods)];

	$: selectedAndComparisonXDomain = [
		Math.min(selectedXDomain[0], comparisonXDomain[0]),
		Math.max(selectedXDomain[1], comparisonXDomain[1])
	];

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

	$: timePeriodsArrayGlobal = metadata.periodsLookupArray.filter(
		(el) =>
			el.periodGroup === indicator.periodGroup &&
			indicator.years.includes(el.xDomainNumb) &&
			el.xDomainNumb >= chosenXDomain[0] &&
			el.xDomainNumb <= chosenXDomain[1]
	);

	$: timePeriodsArray = timePeriodsArrayGlobal.filter(
		(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
	);

	$: filteredChartData =
		xDomain[1] && xDomain[0]
			? indicatorChartData.filter(
					(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
				)
			: null;
	$: filteredChartDataBeeswarm = filteredChartData.filter((el) => el.xDomainNumb === xDomain[1]);

	$: additionalFilteredChartDataBeeswarm = filteredChartDataBeeswarm
		.filter((el) => selectionsObject['areas-rows-additional-chosen'].includes(el.areacd))
		.map((el) => ({
			...el,
			role: selectionsObject['areas-rows-additional-visible'].find(
				(elm) => elm.areacd === el.areacd
			).role,
			priority: false
		}));

	$: selectedFilteredChartData = selectedChartData
		? selectedChartData.filter((el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1])
		: null;
	$: selectedFilteredChartDataBeeswarm = selectedFilteredChartData
		? selectedFilteredChartData.find((el) => el.xDomainNumb === xDomain[1])
		: null;

	$: selectedFilteredChartDataBeeswarmWithRole = selectedFilteredChartDataBeeswarm
		? { ...selectedFilteredChartDataBeeswarm, role: 'main', priority: true }
		: null;

	$: comparisonFilteredChartData = comparisonChartData
		? comparisonChartData
				.filter((el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1])
				.sort((a, b) => a.xDomainNumb - b.xDomainNumb)
		: null;
	$: comparisonFilteredChartDataBeeswarm = comparisonFilteredChartData
		? comparisonFilteredChartData.find((el) => parseFloat(el.xDomainNumb) === xDomain[1])
		: null;

	$: comparisonFilteredChartDataBeeswarmWithRole = comparisonFilteredChartDataBeeswarm
		? {
				...comparisonFilteredChartDataBeeswarm,
				role: selectionsObject['areas-rows-comparison-visible'].role,
				priority: true
			}
		: null;

	$: latestTimePeriod = timePeriodsArray.find((el) => el.xDomainNumb == xDomain[1]);

	$: showVisuals =
		(selectedFilteredChartDataBeeswarm || comparisonFilteredChartDataBeeswarm) && latestTimePeriod;

	$: latestIndicatorCalculations = indicatorCalculationsArray.find(
		(el) => el.period === xDomain[1]
	);

	$: indicatorCalculations = latestIndicatorCalculations
		? latestIndicatorCalculations.calcsByGeogLevel[
				selectedArea.geogLevel in latestIndicatorCalculations.calcsByGeogLevel
					? selectedArea.geogLevel
					: 'lower' in latestIndicatorCalculations.calcsByGeogLevel
						? 'lower'
						: 'upper' in latestIndicatorCalculations.calcsByGeogLevel
							? 'upper'
							: 'region' in latestIndicatorCalculations.calcsByGeogLevel
								? 'region'
								: 'country'
			]
		: null;

	let mounted = false;

	onMount(() => {
		setTimeout(function () {
			mounted = true;
		}, 200);
	});

	let observed = false;
</script>

<div class="indicator-row-container" style="margin-bottom: 20px;">
	<TitleAdditionalDescription
		{showVisuals}
		{indicator}
		{xDomain}
		{selectedAndComparisonXDomain}
		{timePeriodsArray}
	></TitleAdditionalDescription>
</div>

<Observe bind:visible={observed}>
	<div class="indicator-row-container">
		{#if showVisuals}
			<div class="visuals-container">
				<div class="beeswarm-container">
					<BeeswarmRowContainer
						{observed}
						{metadata}
						{indicator}
						{latestTimePeriod}
						{latestIndicatorCalculations}
						{selectionsObject}
						{selectedArea}
						bind:hoverAreaId
						bind:hoverIndicatorId
						{selectedFilteredChartDataBeeswarmWithRole}
						{comparisonFilteredChartDataBeeswarmWithRole}
						{additionalFilteredChartDataBeeswarm}
						{customLookup}
						{filteredChartDataBeeswarm}
						{showConfidenceIntervals}
						{indicatorCalculations}
						noMoreRecentDataForSelectedArea={timePeriodsArrayGlobal[0].xDomainNumb !=
							timePeriodsArray[0].xDomainNumb}
					></BeeswarmRowContainer>
				</div>

				<div class="divider-vertical"></div>

				{#if mounted}
					<div class="line-chart-container">
						{#if xDomain[0] != xDomain[1]}
							<LineChartRowContainer
								{filteredChartData}
								{metadata}
								{indicator}
								{selectionsObject}
								{hoverAreaId}
								{timePeriodsArray}
								{xDomain}
								{selectedFilteredChartData}
								{comparisonFilteredChartData}
								{indicatorCalculations}
								{customLookup}
								{showConfidenceIntervals}
							></LineChartRowContainer>
						{:else}
							<span>No time series data to display</span>
						{/if}
					</div>
				{/if}
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
