<script lang="ts">
	import BackgroundCircles from '$lib/prototype-components/data-vis/beeswarm-row/BackgroundCircles.svelte';
	import PrimaryCircles from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryCircles.svelte';
	import MedianLine from '$lib/prototype-components/data-vis/beeswarm-row/MedianLine.svelte';

	import { onMount } from 'svelte';
	import { scaleLinear } from 'd3-scale';

	export let topRow,
		indicator,
		combinedSelectableAreaTypesObject,
		selectedIndicatorCalculations,
		timePeriod,
		visibleAreasWithData,
		filteredBackgroundChartData,
		filteredChartDataForVisibleAreas;
	export let hoverId, hoverIndicatorId, spaceForOutliers, chartWidth, chartHeight, xDomain;

	$: x = scaleLinear().domain(xDomain).range([0, chartWidth]);

	let medianLabelRect;

	let mounted = false;

	onMount(() => {
		setTimeout(function () {
			mounted = true;
		}, 2000);
	});
</script>

{#if mounted}
	<BackgroundCircles
		{combinedSelectableAreaTypesObject}
		{indicator}
		{filteredBackgroundChartData}
		{x}
		{xDomain}
		{chartWidth}
		{chartHeight}
		{spaceForOutliers}
	></BackgroundCircles>
{/if}

<MedianLine
	{topRow}
	{indicator}
	{selectedIndicatorCalculations}
	{x}
	{chartHeight}
	bind:medianLabelRect
></MedianLine>

<PrimaryCircles
	{indicator}
	{combinedSelectableAreaTypesObject}
	{filteredChartDataForVisibleAreas}
	{x}
	{xDomain}
	{chartWidth}
	{chartHeight}
	{spaceForOutliers}
	{medianLabelRect}
	{selectedIndicatorCalculations}
></PrimaryCircles>
