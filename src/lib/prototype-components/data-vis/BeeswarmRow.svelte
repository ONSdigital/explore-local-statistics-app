<script lang="ts">
	import BackgroundCircles from '$lib/prototype-components/data-vis/beeswarm-row/BackgroundCircles.svelte';
	import PrimaryCirclesAndLabels from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryCirclesAndLabels.svelte';
	import { Observe } from '@onsvisual/svelte-components';

	import { onMount } from 'svelte';
	import { scaleLinear } from 'd3-scale';
	import BackgroundCircle from './beeswarm-row/BackgroundCircle.svelte';

	export let metadata,
		indicator,
		selectedFilteredChartDataBeeswarmWithRole,
		comparisonFilteredChartDataBeeswarmWithRole,
		additionalFilteredChartDataBeeswarm,
		selectedArea,
		selectionsObject,
		filteredChartDataBeeswarm,
		customLookup,
		showConfidenceIntervals,
		observed;

	export let hoverAreaId, hoverIndicatorId, spaceForOutliers, chartWidth, chartHeight, xDomain;

	$: x = scaleLinear().domain(xDomain).range([0, chartWidth]);

	let mounted = false;

	onMount(() => {
		setTimeout(function () {
			mounted = true;
		}, 200);
	});
</script>

{#if mounted && selectionsObject['related-rows-visible'] && observed}
	<BackgroundCircles
		{metadata}
		{x}
		{xDomain}
		{chartWidth}
		{chartHeight}
		{spaceForOutliers}
		{indicator}
		{filteredChartDataBeeswarm}
		{selectionsObject}
		{selectedArea}
		bind:hoverAreaId
		bind:hoverIndicatorId
	></BackgroundCircles>
{/if}

<!-- <BackgroundCircles
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
></BackgroundCircles> -->

<PrimaryCirclesAndLabels
	{metadata}
	{indicator}
	{selectedFilteredChartDataBeeswarmWithRole}
	{comparisonFilteredChartDataBeeswarmWithRole}
	{additionalFilteredChartDataBeeswarm}
	{x}
	{xDomain}
	{chartWidth}
	{chartHeight}
	{spaceForOutliers}
	{customLookup}
	{selectionsObject}
	bind:hoverAreaId
	bind:hoverIndicatorId
	{showConfidenceIntervals}
></PrimaryCirclesAndLabels>
