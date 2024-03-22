<script lang="ts">
	import { madRangeLookup, colorsLookup } from '$lib/config';
	import BeeswarmRow from '$lib/prototype-components/data-vis/BeeswarmRow.svelte';

	export let metadata,
		indicator,
		latestTimePeriod,
		latestIndicatorCalculations,
		selectionsObject,
		selectedArea,
		hoverAreaId,
		hoverIndicatorId,
		selectedFilteredChartDataBeeswarmWithRole,
		comparisonFilteredChartDataBeeswarmWithRole,
		additionalFilteredChartDataBeeswarm,
		filteredChartDataBeeswarm,
		showConfidenceIntervals,
		customLookup,
		indicatorCalculations,
		observed,
		noMoreRecentDataForSelectedArea;

	let width = 1000;
	$: height = 80;

	$: padding = { top: 45, right: 0, bottom: 5, left: 0 };

	$: spaceForOutliers = 40;

	$: chartWidth = width - padding.left - padding.right - spaceForOutliers * 2;
	$: chartHeight = height - padding.top - padding.bottom;

	$: madRange =
		indicator.code in madRangeLookup
			? madRangeLookup[indicator.code]['beeswarm-row']
			: madRangeLookup.default['beeswarm-row'];

	$: includeComparisonText =
		!['country', 'region', 'combined'].includes(selectedArea.geogLevel) &&
		selectedArea.geogLevel in latestIndicatorCalculations.calcsByGeogLevel &&
		latestIndicatorCalculations.calcsByGeogLevel[selectedArea.geogLevel].count >= 10;

	$: furtherDistanceFromMedian =
		madRange != 'minMax'
			? null
			: Math.max(
					indicatorCalculations.med - indicatorCalculations.min,
					indicatorCalculations.max - indicatorCalculations.med
				);

	$: xDomain =
		madRange != 'minMax'
			? [
					indicatorCalculations.med - madRange * indicatorCalculations.mad,
					indicatorCalculations.med + madRange * indicatorCalculations.mad
				]
			: [
					indicatorCalculations.med - furtherDistanceFromMedian,
					indicatorCalculations.med + furtherDistanceFromMedian
				];

	$: selectedComparisonDifference = !comparisonFilteredChartDataBeeswarmWithRole
		? 'No comparison'
		: !selectedFilteredChartDataBeeswarmWithRole
			? 'No selected'
			: selectedFilteredChartDataBeeswarmWithRole.value -
						comparisonFilteredChartDataBeeswarmWithRole.value >
				  indicatorCalculations.mad
				? 'Higher'
				: selectedFilteredChartDataBeeswarmWithRole.value -
							comparisonFilteredChartDataBeeswarmWithRole.value <
					  -indicatorCalculations.mad
					? 'Lower'
					: 'Similar';

	$: backgroundStyle = '';
</script>

<div class="svg-container" bind:clientWidth={width}>
	<svg {width} {height}>
		{#if chartWidth && chartHeight}
			<g transform="translate({padding.left + spaceForOutliers},{padding.top})">
				{#if chartWidth && chartHeight}
					<BeeswarmRow
						{metadata}
						{indicator}
						{selectedFilteredChartDataBeeswarmWithRole}
						{comparisonFilteredChartDataBeeswarmWithRole}
						{additionalFilteredChartDataBeeswarm}
						{filteredChartDataBeeswarm}
						{selectedArea}
						{selectionsObject}
						bind:hoverAreaId
						bind:hoverIndicatorId
						{spaceForOutliers}
						{chartWidth}
						{chartHeight}
						{xDomain}
						{customLookup}
						{showConfidenceIntervals}
						{observed}
						{width}
					></BeeswarmRow>
				{/if}
			</g>
		{/if}
	</svg>
</div>

<div class="robo-text-container" style="opacity: {hoverAreaId ? 0 : 1};">
	<div class="robo-text-inline" style={backgroundStyle}>
		<span>
			{#if selectionsObject['areas-rows-comparison-visible'] && includeComparisonText}
				{#if ['No comparison', 'No selected'].includes(selectedComparisonDifference)}
					No
				{:else}
					<span style="font-weight: bold">{selectedComparisonDifference}</span>
					{selectedComparisonDifference === 'Similar' ? 'to' : 'than'}
				{/if}
				<span
					>{selectedComparisonDifference === 'No selected'
						? selectedArea.areanm
						: 'label' in selectionsObject['areas-rows-comparison-visible']
							? 'average'
							: selectionsObject['areas-rows-comparison-visible'].areanm}
				</span>
				{#if ['No comparison', 'No selected'].includes(selectedComparisonDifference)}
					value for
				{:else}
					in
				{/if}
			{:else}<span>Values for</span>{/if}

			<span>{latestTimePeriod.label}</span>
		</span>
	</div>
	<!-- {#if noMoreRecentDataForSelectedArea}
		<div class="robo-text-inline">
			<span>(No {selectedArea.areanm} data for more recent time periods)</span>
		</div>
	{/if} -->
</div>

<style>
	svg {
		overflow: visible;
		padding: 0px;
		margin: 0px;
	}

	.robo-text-container {
		margin: 15px 0px 2px 0px;
		padding: 0px;
		text-align: center;
		font-size: 16px;
		line-height: 16px;
		color: #414042;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.robo-text-inline {
		padding: 0px 0px;
		margin: 0px 2px 0px 0px;
		display: inline-block;
	}
</style>
