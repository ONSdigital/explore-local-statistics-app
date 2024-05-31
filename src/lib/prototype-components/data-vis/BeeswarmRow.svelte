<script lang="ts">
	import BackgroundCircles from '$lib/prototype-components/data-vis/beeswarm-row/BackgroundCircles.svelte';
	import PrimaryCirclesAndLabels from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryCirclesAndLabels.svelte';

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
		observed,
		width;

	export let hoverAreaId, hoverIndicatorId, spaceForOutliers, chartWidth, chartHeight, xDomain;
</script>

{#if selectionsObject['related-rows-visible'] && observed}
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
		{width}
	></BackgroundCircles>
{/if}

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
	{width}
></PrimaryCirclesAndLabels>
