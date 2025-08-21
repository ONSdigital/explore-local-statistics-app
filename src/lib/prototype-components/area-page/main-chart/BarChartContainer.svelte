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
		? [].concat(...combinedChartData.map((el) => [el.value, el.lci, el.uci])).filter((el) => el)
		: combinedChartData.map((el) => el.value).filter((el) => el);

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

	function makeCurlyBrace(x1, y1, x2, y2, w, q) {
		//Calculate unit vector
		var dx = x1 - x2;
		var dy = y1 - y2;
		var len = Math.sqrt(dx * dx + dy * dy);
		dx = dx / len;
		dy = dy / len;

		//Calculate Control Points of path,
		var qx1 = x1 + q * w * dy;
		var qy1 = y1 - q * w * dx;
		var qx2 = x1 - 0.25 * len * dx + (1 - q) * w * dy;
		var qy2 = y1 - 0.25 * len * dy - (1 - q) * w * dx;
		var tx1 = x1 - 0.5 * len * dx + w * dy;
		var ty1 = y1 - 0.5 * len * dy - w * dx;
		var qx3 = x2 + q * w * dy;
		var qy3 = y2 - q * w * dx;
		var qx4 = x1 - 0.75 * len * dx + (1 - q) * w * dy;
		var qy4 = y1 - 0.75 * len * dy - (1 - q) * w * dx;

		return (
			'M ' +
			x1 +
			' ' +
			y1 +
			' Q ' +
			qx1 +
			' ' +
			qy1 +
			' ' +
			qx2 +
			' ' +
			qy2 +
			' T ' +
			tx1 +
			' ' +
			ty1 +
			' M ' +
			x2 +
			' ' +
			y2 +
			' Q ' +
			qx3 +
			' ' +
			qy3 +
			' ' +
			qx4 +
			' ' +
			qy4 +
			' T ' +
			tx1 +
			' ' +
			ty1
		);
	}
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
