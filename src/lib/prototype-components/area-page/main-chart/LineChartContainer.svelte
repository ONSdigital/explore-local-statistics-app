<script lang="ts">
	import LineChart from '$lib/prototype-components/data-vis/LineChart.svelte';
	import { madRangeLookup } from '$lib/config';
	import { makeCurlyBrace } from '$lib/util/charts/makeCurlyBrace.js';

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
		height = 500;

	let yAxisMaxTickWidth = 0,
		xAxisFinalTickWidth = null,
		maxLabelWidth = null;

	$: padding = {
		top: 10,
		right: Math.max(0, xAxisFinalTickWidth / 2, maxLabelWidth + 20),
		bottom: 30,
		left: 10 + yAxisMaxTickWidth
	};

	$: chartWidth = width - padding.left - padding.right;
	$: chartHeight = height - padding.top - padding.bottom;

	$: labelSpace = Math.min(Math.max(150, width * 0.3), 250);

	$: madRange =
		indicator.code in madRangeLookup
			? madRangeLookup[indicator.code]['line-chart']
			: madRangeLookup.default['line-chart'];

	$: combinedChartData = [
		...filteredChartDataSelected,
		...filteredChartDataAdditionals,
		...filteredChartDataAreaGroup
	];

	//find max and min values for visible areas - so the y-scale can be determined
	$: values = showConfidenceIntervals
		? []
				.concat(...combinedChartData.map((el) => [el.value, el.lci, el.uci]))
				.filter((el) => el !== null && el !== undefined)
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
		<svg aria-hidden="true" {width} height="50" class="line-chart-legend">
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

	<svg
		role="img"
		aria-labelledby={indicator.metadata.slug + '-main-line-chart-description'}
		{width}
		{height}
	>
		<desc id={indicator.metadata.slug + '-main-line-chart-description'}
			>Line chart for {indicator.metadata.label}. The data is available to download below.</desc
		>
		<g aria-hidden="true" transform="translate({padding.left},{padding.top})">
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

	.line-chart-legend {
		forced-color-adjust: auto;
	}
</style>
