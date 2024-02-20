<script lang="ts">
	import AddRemoveComparisonAreas from '$lib/prototype-components/AddRemoveComparisonAreas.svelte';
	import BarChart from '$lib/prototype-components/data-vis/BarChart.svelte';

	import { madRangeLookup } from '$lib/config';

	export let selectedIndicator,
		metadata,
		combinedSelectableAreaTypesObject,
		areasCodesForAreasWithData,
		visibleAreasWithData,
		timePeriodsArray,
		filteredChartDataForVisibleAreas,
		selectedIndicatorCalculations;
	export let chosenParentAreasArray,
		chosenRelatedAreasId,
		chosenSameRegionArray,
		chosenCountriesArray,
		chosenRegionsArray,
		chosenAllOtherArray;

	let width = 1000;
	$: height = filteredChartDataForVisibleAreas.length * 80 + 100;

	let xAxisFinalTickWidth = null,
		maxLabelWidth = null;

	$: padding = {
		top: 30,
		right: 20,
		bottom: 30,
		left: 10 + maxLabelWidth
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
		.filter((el) => el);

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

<AddRemoveComparisonAreas
	{metadata}
	{combinedSelectableAreaTypesObject}
	{visibleAreasWithData}
	{areasCodesForAreasWithData}
	bind:chosenParentAreasArray
	bind:chosenRelatedAreasId
	bind:chosenSameRegionArray
	bind:chosenCountriesArray
	bind:chosenRegionsArray
	bind:chosenAllOtherArray
></AddRemoveComparisonAreas>

<!-- {#if !isHoverLabelVisible && hoverId}
	<HoverKey {hoverAreaWithDataAdded}></HoverKey>
{:else}
	<RelatedAreasKey {visibleAreasWithData} {combinedSelectableAreaTypesObject}></RelatedAreasKey>
{/if} -->

<div class="svg-container" bind:clientWidth={width}>
	<svg {width} {height}>
		<g transform="translate({padding.left},{padding.top})">
			{#if chartWidth && chartHeight}
				<BarChart
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
					bind:maxLabelWidth
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
