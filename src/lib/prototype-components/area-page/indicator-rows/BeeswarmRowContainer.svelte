<script lang="ts">
	import { madRangeLookup, colorsLookup } from '$lib/config';
	import { roundNumber } from '$lib/utils';
	import BeeswarmRow from '$lib/prototype-components/data-vis/BeeswarmRow.svelte';

	export let topRow,
		combinedSelectableAreaTypesObject,
		indicator,
		selectedIndicatorCalculations,
		timePeriod,
		visibleAreasWithData,
		filteredBackgroundChartData,
		filteredChartDataForVisibleAreas;
	export let hoverId, hoverIndicatorId;

	let width = 1000;

	$: height = topRow ? 100 : 100;

	$: padding = { top: height - 60, right: 0, bottom: 5, left: 0 };

	$: spaceForOutliers = 40;

	$: chartWidth = width - padding.left - padding.right - spaceForOutliers * 2;
	$: chartHeight = height - padding.top - padding.bottom;

	$: values = filteredBackgroundChartData.map((el) => [el.value]);

	$: furtherDistanceFromMedian = Math.max(
		...values.map((el) => Math.abs(el - selectedIndicatorCalculations.med))
	);

	$: madRange =
		indicator.code in madRangeLookup
			? madRangeLookup[indicator.code]['beeswarm-row']
			: madRangeLookup.default['beeswarm-row'];

	$: xDomain =
		madRange === 'minMax'
			? [
					selectedIndicatorCalculations.med - furtherDistanceFromMedian,
					parseFloat(selectedIndicatorCalculations.med) + furtherDistanceFromMedian
				]
			: [
					selectedIndicatorCalculations.med - madRange * selectedIndicatorCalculations.mad,
					parseFloat(selectedIndicatorCalculations.med) +
						madRange * selectedIndicatorCalculations.mad
				];

	$: mainAreaValue = filteredChartDataForVisibleAreas.find(
		(el) => el.areacd === combinedSelectableAreaTypesObject.selected.area.areacd
	).value;

	$: comparisonText =
		roundNumber(selectedIndicatorCalculations.med, indicator.metadata.decimalPlaces) ===
			roundNumber(mainAreaValue, indicator.metadata.decimalPlaces) ||
		Math.abs(mainAreaValue - selectedIndicatorCalculations.med) < selectedIndicatorCalculations.mad
			? 'Similar to'
			: mainAreaValue > selectedIndicatorCalculations.med
				? 'Higher than'
				: 'Lower than';
</script>

<div class="svg-container" bind:clientWidth={width}>
	<svg {width} {height}>
		<g transform="translate({padding.left + spaceForOutliers},{padding.top})">
			{#if chartWidth && chartHeight}
				<BeeswarmRow
					{topRow}
					{indicator}
					{combinedSelectableAreaTypesObject}
					{selectedIndicatorCalculations}
					{timePeriod}
					{visibleAreasWithData}
					{filteredBackgroundChartData}
					{filteredChartDataForVisibleAreas}
					bind:hoverId
					bind:hoverIndicatorId
					{spaceForOutliers}
					{chartWidth}
					{chartHeight}
					{xDomain}
				></BeeswarmRow>
			{/if}
		</g>
	</svg>

	<div class="robo-text-container">
		<span
			>{comparisonText}
			<span style="color: {colorsLookup.median.color}">average</span>
			in {timePeriod.label}</span
		>
	</div>
</div>

<style>
	svg {
		overflow: visible;
		padding: 0px;
		margin: 0px;
	}

	.robo-text-container {
		margin: 0px 0px 5px 0px;
		padding: 0px;
		text-align: center;
		font-size: 16px;
		line-height: 16px;
	}
</style>
