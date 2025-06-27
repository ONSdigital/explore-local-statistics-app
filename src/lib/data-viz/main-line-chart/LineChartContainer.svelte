<script lang="ts">
	import LineChart from './LineChart.svelte';

	import { selectAnIndicatorChartSettings } from '../../../routes/(app)/areas/[slug]/indicators/config';
	import { makeCurlyBrace } from '$lib/util/charts/makeCurlyBrace';

	export let indicator,
		timePeriodsArray,
		filteredChartDataSelected,
		filteredChartDataAdditionals,
		filteredChartDataAreaGroup,
		filteredChartDataAreaGroupLatest,
		selectionsObject,
		selectedArea,
		indicatorCalculations,
		customLookup,
		xDomain,
		showConfidenceIntervals,
		additionalID,
		relatedID;

	let width = 1000,
		height = selectAnIndicatorChartSettings.lineChart.height;

	let yAxisMaxTickWidth = 0,
		xAxisFinalTickWidth = null,
		maxLabelWidth = null;

	$: padding = {
		top: selectAnIndicatorChartSettings.lineChart.padding.top,
		right:
			selectAnIndicatorChartSettings.lineChart.padding.right +
			Math.max(0, xAxisFinalTickWidth / 2, maxLabelWidth + 20),
		bottom: selectAnIndicatorChartSettings.lineChart.padding.bottom,
		left: selectAnIndicatorChartSettings.lineChart.padding.left + yAxisMaxTickWidth
	};

	$: chartWidth = width - padding.left - padding.right;
	$: chartHeight = height - padding.top - padding.bottom;

	//calculates the amount of space to leave for the label, based on the width of the screen
	$: labelSpace = Math.min(Math.max(150, width * 0.3), 250);

	$: madRange =
		indicator.metadata.beeswarmRowUseMinMax === 'T'
			? 'minMax'
			: selectAnIndicatorChartSettings.lineChart.defaultMadRange;

	$: combinedChartData = [
		...filteredChartDataSelected,
		...filteredChartDataAdditionals,
		...filteredChartDataAreaGroup
	];

	//find max and min values for visible areas - so the y-scale can be determined
	$: values = showConfidenceIntervals
		? [].concat(...combinedChartData.map((el) => [el.value, el.lci, el.uci])).filter((el) => el !== null && el !== undefined);
		: combinedChartData.map((el) => el.value).filter((el) => el !== null && el !== undefined);

	$: minValue = Math.min(...values);
	$: maxValue = Math.max(...values);

	$: yDomainRaw = [
		minValue - 0.05 * (maxValue - minValue),
		maxValue + 0.05 * (maxValue - minValue)
	];

	$: yDomainAdj =
		madRange === 'minMax'
			? yDomainRaw
			: [
					Math.min(yDomainRaw[0], indicatorCalculations.med - madRange * indicatorCalculations.mad),
					Math.max(
						yDomainRaw[1],
						parseFloat(indicatorCalculations.med) + madRange * indicatorCalculations.mad
					)
				];

	$: yDomainFloorCeiling = [
		indicator.metadata.canBeNegative === 'F' ? Math.max(0, yDomainAdj[0]) : yDomainAdj[0],
		indicator.metadata.unit === '%' ? Math.min(100, yDomainAdj[1]) : yDomainAdj[1]
	];

	$: yDomainFinal =
		indicator.metadata.zeroBaseline === 'T' ? [0, yDomainFloorCeiling[1]] : yDomainFloorCeiling;

	let hoverId;
	let isHoverLabelVisible;
</script>

<div class="svg-container" bind:clientWidth={width}>
	{#if showConfidenceIntervals && indicator.metadata.confidenceIntervals === 'T'}
		<svg {width} height="50">
			<path d="M10 15  L50 15 L50 45  L10 35" stroke="none" fill="#222" opacity="0.2"></path>
			<path d="M10 25  L50 30" stroke="#222" fill="none" stroke-width="2px"></path>
			<circle cx="10" cy="25" r="4" stroke="white" fill="#222" stroke-width="1px"></circle>
			<circle cx="50" cy="30" r="4" stroke="white" fill="#222" stroke-width="1px"></circle>
			<text x="70" y="35" font-size="18px" stroke="#222" fill="#222" stroke-width="0px"
				>95% confidence interval range</text
			>

			<path
				d={makeCurlyBrace(55, 15, 55, 45, -10, 0.5)}
				stroke="#222"
				fill="none"
				stroke-width="1px"
			></path>
		</svg>
	{/if}

	<svg {width} {height}>
		<g transform="translate({padding.left},{padding.top})">
			{#if chartWidth && chartHeight}
				<LineChart
					{width}
					{indicator}
					{timePeriodsArray}
					{chartWidth}
					{chartHeight}
					{filteredChartDataSelected}
					{filteredChartDataAdditionals}
					{filteredChartDataAreaGroup}
					{xDomain}
					{selectedArea}
					{selectionsObject}
					yDomain={yDomainFinal}
					bind:isHoverLabelVisible
					bind:hoverId
					bind:yAxisMaxTickWidth
					bind:xAxisFinalTickWidth
					bind:maxLabelWidth
					{customLookup}
					{showConfidenceIntervals}
					{additionalID}
					{relatedID}
					{labelSpace}
					{filteredChartDataAreaGroupLatest}
				></LineChart>
			{/if}
		</g>
	</svg>
</div>

<style>
	svg {
		overflow: visible;
	}
</style>
