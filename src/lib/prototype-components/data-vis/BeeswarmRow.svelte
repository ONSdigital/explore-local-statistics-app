<script lang="ts">
	import BackgroundCircles from '$lib/prototype-components/data-vis/beeswarm-row/BackgroundCircles.svelte';
	import PrimaryCirclesAndLabels from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryCirclesAndLabels.svelte';

	import { onMount } from 'svelte';
	import { scaleLinear } from 'd3-scale';

	export let topRow,
		metadata,
		indicator,
		selectedAreaFilteredChartDataBeeswarm,
		comparisonAreaFilteredChartDataBeeswarm,
		areasGroupsObject,
		chosenComparisonMeasureOrArea,
		backgroundChartDataBeeswarm;
	export let hoverId, hoverIndicatorId, spaceForOutliers, chartWidth, chartHeight, xDomain;

	$: x = scaleLinear().domain(xDomain).range([0, chartWidth]);

	let mounted = false;

	onMount(() => {
		setTimeout(function () {
			mounted = true;
		}, 2000);
	});
</script>

{#if mounted}
	<BackgroundCircles
		{metadata}
		{backgroundChartDataBeeswarm}
		{x}
		{xDomain}
		{chartWidth}
		{chartHeight}
		{spaceForOutliers}
		{indicator}
		bind:hoverId
		bind:hoverIndicatorId
	></BackgroundCircles>
{/if}

<g opacity={hoverId ? 0 : 1}>
	<PrimaryCirclesAndLabels
		{topRow}
		{indicator}
		{comparisonAreaFilteredChartDataBeeswarm}
		{selectedAreaFilteredChartDataBeeswarm}
		{areasGroupsObject}
		{chosenComparisonMeasureOrArea}
		{x}
		{xDomain}
		{chartWidth}
		{chartHeight}
		{spaceForOutliers}
	></PrimaryCirclesAndLabels>
</g>
