<script lang="ts">
	import AddRemoveComparisonAreas from '$lib/prototype-components/AddRemoveComparisonAreas.svelte';
	import LineChart from '$lib/prototype-components/data-vis/LineChart.svelte';
	import HoverKey from '$lib/prototype-components/data-vis/line-chart/HoverKey.svelte';
	import RelatedAreasKey from '$lib/prototype-components/data-vis/line-chart/RelatedAreasKey.svelte';

	import { madRangeLookup } from '$lib/config';

	export let indicator,
		metadata,
		timePeriodsArray,
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
		relatedID;

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

	$: madRange =
		indicator.code in madRangeLookup
			? madRangeLookup[indicator.code]['line-chart']
			: madRangeLookup.default['line-chart'];

	$: combinedChartData = [
		...filteredChartDataSelected,
		...filteredChartDataAdditionals,
		...filteredChartDataAreaGroup
	];

	$: values = []
		.concat(...combinedChartData.map((el) => [el.value, el.lci, el.uci]))
		.filter((el) => el);

	$: console.log(values);

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

	/*export let indicator,
		metadata,
		combinedSelectableAreaTypesObject,
		areasCodesForAreasWithData,
		visibleAreasWithData,
		timePeriodsArray,
		filteredChartDataForVisibleAreas,
		indicatorCalculations;
	export let chosenParentAreasArray,
		chosenRelatedAreasId,
		chosenSameRegionArray,
		chosenCountriesArray,
		chosenRegionsArray,
		chosenAllOtherArray;

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
		indicator.code in madRangeLookup
			? madRangeLookup[indicator.code]['line-chart']
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
						indicatorCalculations.med - madRange * indicatorCalculations.mad
					),
					Math.max(
						yDomainRaw[1],
						parseFloat(indicatorCalculations.med) +
							madRange * indicatorCalculations.mad
					)
				];

	$: yDomainFloorCeiling = [
		indicator.metadata.canBeNegative === 'F' ? Math.max(0, yDomainAdj[0]) : yDomainAdj[0],
		indicator.metadata.unit === '%' ? Math.min(100, yDomainAdj[1]) : yDomainAdj[1]
	];

	$: yDomainFinal =
		indicator.metadata.zeroBaseline === 'T'
			? [0, yDomainFloorCeiling[1]]
			: yDomainFloorCeiling;

	let hoverId;
	let isHoverLabelVisible;
	let hoverAreaWithDataAdded;*/
</script>

<!-- {#if !isHoverLabelVisible && hoverId}
	<HoverKey {hoverAreaWithDataAdded}></HoverKey>
{:else}
	<RelatedAreasKey {visibleAreasWithData} {combinedSelectableAreaTypesObject}></RelatedAreasKey>
{/if} -->

<div class="svg-container" bind:clientWidth={width}>
	<svg {width} {height}>
		<g transform="translate({padding.left},{padding.top})">
			{#if chartWidth && chartHeight}
				<LineChart
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
