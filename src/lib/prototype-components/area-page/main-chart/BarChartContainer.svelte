<script lang="ts">
	import BarChart from '$lib/prototype-components/data-vis/BarChart.svelte';
	import { madRangeLookup } from '$lib/config';
	import { makeCurlyBrace } from '$lib/util/charts/makeCurlyBrace.js';

	export let indicator,
		metadata,
		latestPeriod,
		filteredChartDataSelected,
		filteredChartDataAdditionals,
		filteredChartDataAreaGroup,
		selectionsObject,
		selectedArea,
		indicatorCalculations,
		customLookup,
		xDomain,
		showConfidenceIntervals,
		additionalID,
		relatedID,
		combinedChartData;

	let dataArray = [];
	let width = 1000;
	$: height = Math.max(
		600,
		(filteredChartDataAdditionals.length + filteredChartDataSelected.length) * 20 +
			filteredChartDataAreaGroup.length * 1.5
	);

	let xAxisFinalTickWidth = null,
		maxLabelWidth = null;

	$: padding = {
		top: 30,
		right: 20 + (xAxisFinalTickWidth ? xAxisFinalTickWidth : 0),
		bottom: 30,
		left: 18 + (maxLabelWidth ? maxLabelWidth : 0)
	};

	$: chartWidth = width - padding.left - padding.right;
	$: chartHeight = height - padding.top - padding.bottom;

	$: labelSpace = Math.min(Math.max(200, width * 0.5), 250);

	$: madRange =
		indicator.code in madRangeLookup
			? madRangeLookup[indicator.code]['line-chart']
			: madRangeLookup.default['line-chart'];

	$: values = showConfidenceIntervals
		? []
				.concat(...combinedChartData.map((el) => [el.value, el.lci, el.uci]))
				.filter((el) => el != null)
		: combinedChartData.map((el) => el.value).filter((el) => el != null);

	$: yDomainRaw = [
		Math.min(...values) < 0 ? 1.05 * Math.min(...values) : 0.95 * Math.min(...values),
		Math.max(...values) < 0 ? 0.95 * Math.max(...values) : 1.05 * Math.max(...values)
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
	let hoverAreaWithDataAdded;
</script>

<div class="svg-container" bind:clientWidth={width}>
	{#if showConfidenceIntervals && indicator.metadata.confidenceIntervals === 'T'}
		<svg aria-hidden="true" {width} height="90" class="bar-chart-legend">
			<line x1="10" y1="15" x2="170" y2="15" stroke="#222" opacity="0.2" stroke-width="8px"></line>
			<rect x="8" width="4" y="7" height="16" fill="#222" stroke="white" stroke-width="1px"></rect>
			<rect x="168" width="4" y="7" height="16" fill="#222" stroke="white" stroke-width="1px"
			></rect>
			<rect x="87" width="6" y="3" height="24" fill="#222" stroke="white" stroke-width="1.5px"
			></rect>

			<path
				d={makeCurlyBrace(10, 30, 170, 30, 10, 0.5)}
				stroke="#222"
				fill="none"
				stroke-width="1.5px"
			></path>

			<text
				x="90"
				y="60"
				font-size="18px"
				stroke="#222"
				fill="#222"
				stroke-width="0px"
				text-anchor="middle">95% confidence</text
			>
			<text
				x="90"
				y="80"
				font-size="18px"
				stroke="#222"
				fill="#222"
				stroke-width="0px"
				text-anchor="middle">interval range</text
			>
		</svg>
	{/if}
	<svg
		role="img"
		aria-labelledby={indicator.metadata.slug + '-main-bar-chart-description'}
		{width}
		{height}
	>
		<desc id={indicator.metadata.slug + '-main-bar-chart-description'}
			>Bar chart for {indicator.metadata.label}. The data is available to download below.</desc
		>
		<g aria-hidden="true" transform="translate({padding.left},{padding.top})">
			{#if chartWidth && chartHeight}
				<BarChart
					{indicator}
					{latestPeriod}
					{chartWidth}
					{chartHeight}
					yDomain={yDomainFinal}
					bind:isHoverLabelVisible
					bind:hoverId
					bind:hoverAreaWithDataAdded
					bind:maxLabelWidth
					{filteredChartDataSelected}
					{filteredChartDataAdditionals}
					{filteredChartDataAreaGroup}
					{selectionsObject}
					{selectedArea}
					{customLookup}
					{showConfidenceIntervals}
					{additionalID}
					{relatedID}
					bind:dataArray
					{labelSpace}
					{width}
					bind:xAxisFinalTickWidth
				></BarChart>
			{/if}
		</g>
	</svg>
</div>

<style>
	svg {
		overflow: visible;
	}

	.bar-chart-legend {
		forced-color-adjust: auto;
	}
</style>
