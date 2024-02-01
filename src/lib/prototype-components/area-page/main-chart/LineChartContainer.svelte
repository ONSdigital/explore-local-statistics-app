<script lang="ts">
	import LineChart from '$lib/prototype-components/data-vis/LineChart.svelte';

	import { madRangeLookup } from '$lib/config';

	export let selectedIndicator,
		visibleAreasWithData,
		timePeriodsArray,
		filteredChartDataForVisibleAreas,
		selectedIndicatorCalculations,
		hoverId;

	let width = 1000,
		height = 500;

	let yAxisMaxTickWidth = 0,
		xAxisFinalTickWidth = null,
		maxLabelWidth = null;

	$: padding = {
		top: 10,
		right: Math.max(0, xAxisFinalTickWidth / 2, maxLabelWidth + 17),
		bottom: 30,
		left: 10 + yAxisMaxTickWidth
	};

	$: chartWidth = width - padding.left - padding.right;
	$: chartHeight = height - padding.top - padding.bottom;

	////

	$: visibleAreasWithDataAdded = visibleAreasWithData.map((el) =>
		el.map((elm) => ({
			...elm,
			data: filteredChartDataForVisibleAreas.filter((elmt) => elmt.areacd === elm.areacd)
		}))
	);

	////

	$: xDomain = [
		timePeriodsArray[timePeriodsArray.length - 1].xDomainNumb,
		timePeriodsArray[0].xDomainNumb
	];

	////

	$: madRange =
		selectedIndicator.code in madRangeLookup
			? madRangeLookup[selectedIndicator.code]
			: madRangeLookup.default;

	$: values = []
		.concat(...filteredChartDataForVisibleAreas.map((el) => [el.value, el.lci, el.uci]))
		.filter((el) => el != 'NA');

	$: yDomainRaw = [0.95 * Math.min(...values), 1.05 * Math.max(...values)];

	$: yDomainAdj =
		madRange === 'minMax'
			? yDomainRaw
			: [
					Math.min(
						yDomainRaw[0],
						selectedIndicatorCalculations.med - madRange * selectedIndicatorCalculations.mad
					),
					Math.max(
						yDomainRaw[1],
						parseFloat(selectedIndicatorCalculations.med) +
							madRange * selectedIndicatorCalculations.mad
					)
				];

	$: yDomainFloorCeiling = [
		selectedIndicator.metadata.canBeNegative === 'F' ? Math.max(0, yDomainAdj[0]) : yDomainAdj[0],
		selectedIndicator.metadata.unit === '%' ? Math.min(100, yDomainAdj[1]) : yDomainAdj[1]
	];

	$: yDomainFinal =
		selectedIndicator.metadata.zeroBaseline === 'T'
			? [0, yDomainFloorCeiling[1]]
			: yDomainFloorCeiling;
</script>

<div class="svg-container" bind:clientWidth={width}>
	<svg {width} {height}>
		<g transform="translate({padding.left},{padding.top})">
			{#if chartWidth && chartHeight}
				<LineChart
					{selectedIndicator}
					{timePeriodsArray}
					{chartWidth}
					{chartHeight}
					{visibleAreasWithDataAdded}
					{xDomain}
					yDomain={yDomainFinal}
					bind:hoverId
					bind:yAxisMaxTickWidth
					bind:xAxisFinalTickWidth
					bind:maxLabelWidth
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
