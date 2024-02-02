<script lang="ts">
	import LineChartRow from '$lib/prototype-components/data-vis/LineChartRow.svelte';

	import { madRangeLookup, colorsLookup } from '$lib/config';

	export let selectedIndicator,
		metadata,
		combinedSelectableAreaTypesObject,
		areasCodesForAreasWithData,
		visibleAreasWithData,
		timePeriodsArray,
		filteredChartDataForVisibleAreas,
		selectedIndicatorCalculations;

	let width = 1000,
		height = 100;

	let yAxisMaxTickWidth = 0,
		xAxisFinalTickWidth = null,
		maxLabelWidth = 80;

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
			? madRangeLookup[selectedIndicator.code]['line-chart']
			: madRangeLookup.default['line-chart'];

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

	let hoverId;
	let isHoverLabelVisible;
	let hoverAreaWithDataAdded;
</script>

<div class="svg-container" bind:clientWidth={width}>
	<svg {width} {height}>
		<g transform="translate({padding.left},{padding.top})">
			{#if chartWidth && chartHeight}
				<LineChartRow
					{selectedIndicator}
					{timePeriodsArray}
					{chartWidth}
					{chartHeight}
					{visibleAreasWithDataAdded}
					{xDomain}
					yDomain={yDomainFinal}
					bind:isHoverLabelVisible
					bind:hoverId
					bind:hoverAreaWithDataAdded
					bind:yAxisMaxTickWidth
					bind:xAxisFinalTickWidth
					bind:maxLabelWidth
				></LineChartRow>
			{/if}
		</g>
	</svg>

	<div class="robo-text-container">
		<span>Increased since {timePeriodsArray[timePeriodsArray.length - 1].xDomainNumb}</span>
	</div>
</div>

<style>
	svg {
		overflow: visible;
	}

	.robo-text-container {
		margin: 0px 0px 5px 0px;
		padding: 0px;
		text-align: center;
		font-size: 16px;
		line-height: 16px;
	}
</style>
