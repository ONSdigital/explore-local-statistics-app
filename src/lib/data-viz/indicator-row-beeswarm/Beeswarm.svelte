<script lang="ts">
	import Background from './Background.svelte';
	import Primary from './Primary.svelte';

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
		width,
		x;

	export let hoverAreaId, hoverIndicatorId, spaceForOutliers, chartWidth, chartHeight, xDomain;
</script>

{#if selectionsObject['related-rows-visible'] && observed}
	<Background
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
	></Background>
{/if}

<Primary
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
></Primary>
