<script lang="ts">
	import TitleAdditionalDescription from '$lib/prototype-components/area-page/indicator-rows/TitleAdditionalDescription.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';
	import BeeswarmRowContainer from '$lib/prototype-components/area-page/indicator-rows/BeeswarmRowContainer.svelte';
	import LineChartRowContainer from '$lib/prototype-components/area-page/indicator-rows/LineChartRowContainer.svelte';
	import { onMount } from 'svelte';

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
								selectedArea.geogLevel === 'lower'
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

	$: timePeriodsArray = metadata.periodsLookupArray.filter(
		(el) =>
			el.periodGroup === indicator.periodGroup &&
			el.xDomainNumb >= xDomain[0] &&
			el.xDomainNumb <= xDomain[1]
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

	$: console.log(latestIndicatorCalculations);

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
		}, 500);
	});

	/*$: selectedIndicatorCalculations = xDomain[1] ?
						metadata.*/

	/*$: selectedIndicatorCalculations = xDomain[1]
		? metadata.indicatorsCalculationsArray.find(
				(el) =>
					el.code === indicator.code &&
					parseFloat(el.period) === xDomain[1] &&
					el.geog_level === 'lower'
			)
		: null;

	$: filteredChartData =
		xDomain[1] && xDomain[0]
			? indicatorChartData.filter(
					(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
				)
			: null;

	$: selectedAreaFilteredChartData = selectedAreaChartData
		? selectedAreaChartData.filter(
				(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
			)
		: null;
	$: selectedAreaFilteredChartDataBeeswarm = selectedAreaFilteredChartData
		? selectedAreaFilteredChartData.find((el) => el.xDomainNumb === xDomain[1])
		: null;

	$: comparisonAreaFilteredChartData = comparisonAreaChartData
		? comparisonAreaChartData.filter(
				(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
			)
		: null;
	$: comparisonAreaFilteredChartDataBeeswarm =
		comparisonAreaFilteredChartData &&
		comparisonAreaFilteredChartData.find((el) => parseFloat(el.xDomainNumb) === xDomain[1])
			? {
					...comparisonAreaFilteredChartData.find(
						(el) => parseFloat(el.xDomainNumb) === xDomain[1]
					),
					role: selectionsObject['areas-rows-comparison-visible'].role
				}
			: null;

	$: backgroundChartData =
		filteredChartData && selectionsObject['related-rows-visible']
			? filteredChartData.filter((el) =>
					selectionsObject['related-rows-visible'].codes.includes(el.areacd)
				)
			: null;
	$: backgroundChartDataBeeswarm = backgroundChartData
		? backgroundChartData.filter((el) => el.xDomainNumb === xDomain[1])
		: null;

	$: latestTimePeriod = timePeriodsArray.find((el) => el.xDomainNumb == xDomain[1]);

	$: hoverChartData =
		hoverAreaId && filteredChartData
			? filteredChartData.filter((el) => el.areacd === hoverAreaId)
			: [];*/
</script>

<div class="indicator-row-container">
	<TitleAdditionalDescription {showVisuals} {indicator} {xDomain} {selectedAndComparisonXDomain}
	></TitleAdditionalDescription>
</div>

<div class="indicator-row-container">
	{#if showVisuals}
		<div class="visuals-container">
			<div class="beeswarm-container">
				<BeeswarmRowContainer
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
				></BeeswarmRowContainer>
			</div>

			<Divider orientation="vertical"></Divider>

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
						<!-- <LineChartRowContainer
							{metadata}
							{indicator}
							{selectionsObject}
							bind:hoverId={hoverAreaId}
							bind:hoverIndicatorId
							{timePeriodsArray}
							{hoverChartData}
							{xDomain}
							{selectedIndicatorCalculations}
							{selectedAreaFilteredChartData}
							{comparisonAreaFilteredChartData}
							{backgroundChartData}
						></LineChartRowContainer> -->
					{:else}
						<span>No data before<br />{latestTimePeriod.label}</span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.indicator-row-container {
		padding: 0px;
		display: flex;
		flex-direction: column;
	}

	.visuals-container {
		margin: 0px 0px 5px 0px;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 2%;
	}

	.beeswarm-container {
		width: 64%;
	}

	.line-chart-container {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		justify-content: center;
		width: 32%;
	}

	@media (max-width: 800px) {
		.beeswarm-container {
			width: 100%;
		}

		.line-chart-container {
			display: none;
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
