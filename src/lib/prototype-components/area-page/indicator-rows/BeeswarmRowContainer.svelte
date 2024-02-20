<script lang="ts">
	import { madRangeLookup, colorsLookup } from '$lib/config';
	import { roundNumber } from '$lib/utils';
	import BeeswarmRow from '$lib/prototype-components/data-vis/BeeswarmRow.svelte';
	import SelectComparisons from '$lib/prototype-components/SelectComparisons.svelte';

	export let metadata,
		indicator,
		topRow,
		areasGroupsObject,
		timePeriod,
		selectedAreaFilteredChartDataBeeswarm,
		comparisonAreaFilteredChartDataBeeswarm,
		backgroundChartDataBeeswarm,
		chosenComparisonMeasureOrArea;
	export let hoverId, hoverIndicatorId, selectedIndicatorCalculations;

	let width = 1000;
	$: height = topRow ? 80 : 80;

	$: padding = { top: topRow ? 45 : 45, right: 0, bottom: 5, left: 0 };

	$: spaceForOutliers = 40;

	$: chartWidth = width - padding.left - padding.right - spaceForOutliers * 2;
	$: chartHeight = height - padding.top - padding.bottom;

	$: madRange =
		indicator.code in madRangeLookup
			? madRangeLookup[indicator.code]['beeswarm-row']
			: madRangeLookup.default['beeswarm-row'];

	$: values = madRange === 'minMax' ? backgroundChartDataBeeswarm.map((el) => [el.value]) : null;

	$: furtherDistanceFromMedian =
		madRange === 'minMax'
			? Math.max(...values.map((el) => Math.abs(el - selectedIndicatorCalculations.med)))
			: null;

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

	$: selectedComparisonDifference = !comparisonAreaFilteredChartDataBeeswarm
		? 'No comparison'
		: !selectedAreaFilteredChartDataBeeswarm
			? 'No selected'
			: selectedAreaFilteredChartDataBeeswarm.value -
						comparisonAreaFilteredChartDataBeeswarm.value >
				  selectedIndicatorCalculations.mad
				? 'Higher'
				: selectedAreaFilteredChartDataBeeswarm.value -
							comparisonAreaFilteredChartDataBeeswarm.value <
					  -selectedIndicatorCalculations.mad
					? 'Lower'
					: 'Similar';

	$: goodBad =
		indicator.metadata.polarity == 1
			? selectedComparisonDifference === 'Higher'
				? 'Good'
				: selectedComparisonDifference === 'Lower'
					? 'Bad'
					: 'Neither'
			: indicator.metadata.polarity == -1
				? selectedComparisonDifference === 'Higher'
					? 'Bad'
					: selectedComparisonDifference === 'Lower'
						? 'Good'
						: 'Neither'
				: 'Neither';
	/*$: backgroundStyle =
		goodBad === 'Good'
			? 'background-color: #E6F5D0; box-shadow: 0 0 4px 3px #E6F5D0'
			: goodBad === 'Bad'
				? 'background-color: #FDE0EF; box-shadow: 0 0 4px 3px #FDE0EF'
				: '';*/

	$: backgroundStyle = '';
</script>

<div class="svg-container" bind:clientWidth={width}>
	<svg {width} {height}>
		{#if chartWidth && chartHeight}
			<g transform="translate({padding.left + spaceForOutliers},{padding.top})">
				{#if chartWidth && chartHeight}
					<BeeswarmRow
						{topRow}
						{metadata}
						{indicator}
						{selectedAreaFilteredChartDataBeeswarm}
						{comparisonAreaFilteredChartDataBeeswarm}
						{backgroundChartDataBeeswarm}
						{areasGroupsObject}
						{chosenComparisonMeasureOrArea}
						bind:hoverId
						bind:hoverIndicatorId
						{spaceForOutliers}
						{chartWidth}
						{chartHeight}
						{xDomain}
					></BeeswarmRow>
				{/if}
			</g>
		{/if}
	</svg>
</div>

<div class="robo-text-container" style="opacity: {hoverId ? 0 : 1};">
	<div class="robo-text-inline" style={backgroundStyle}>
		<span>
			{#if ['No comparison', 'No selected'].includes(selectedComparisonDifference)}
				No
			{:else}
				<span style="font-weight: bold">{selectedComparisonDifference}</span>
				{selectedComparisonDifference === 'Similar' ? 'to' : 'than'}
			{/if}
			<span style="font-weight: bold"
				>{selectedComparisonDifference === 'No selected'
					? areasGroupsObject.selected.area.areanm
					: 'areanm' in chosenComparisonMeasureOrArea
						? chosenComparisonMeasureOrArea.areanm
						: 'average'}
			</span>
			{#if ['No comparison', 'No selected'].includes(selectedComparisonDifference)}
				data for
			{:else}
				in
			{/if}

			<span style="font-weight: bold;">{timePeriod.label}</span>
		</span>
	</div>
</div>

<style>
	svg {
		overflow: visible;
		padding: 0px;
		margin: 0px;
	}

	.robo-text-container {
		margin: 2px 0px 2px 0px;
		padding: 0px;
		text-align: center;
		font-size: 16px;
		line-height: 16px;
		color: #222;
	}

	.robo-text-inline {
		padding: 0px 0px;
		margin: 0px 2px 0px 0px;
		display: inline-block;
	}
</style>
