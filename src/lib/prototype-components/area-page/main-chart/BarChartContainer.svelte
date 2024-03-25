<script lang="ts">
	import BarChart from '$lib/prototype-components/data-vis/BarChart.svelte';

	import { madRangeLookup } from '$lib/config';

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
		left: 15 + (maxLabelWidth ? maxLabelWidth : 0)
	};

	$: chartWidth = width - padding.left - padding.right;
	$: chartHeight = height - padding.top - padding.bottom;

	$: labelSpace = Math.min(Math.max(200, width * 0.5), 250);

	$: madRange =
		indicator.code in madRangeLookup
			? madRangeLookup[indicator.code]['line-chart']
			: madRangeLookup.default['line-chart'];

	$: values = showConfidenceIntervals
		? [].concat(...combinedChartData.map((el) => [el.value, el.lci, el.uci])).filter((el) => el)
		: combinedChartData.map((el) => el.value).filter((el) => el);

	$: yDomainRaw = [0.95 * Math.min(...values), 1.05 * Math.max(...values)];

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
	<svg {width} {height}>
		<g transform="translate({padding.left},{padding.top})">
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
				></BarChart>
			{/if}
		</g>
	</svg>
</div>

<style>
	svg {
		overflow: visible;
	}
</style>
