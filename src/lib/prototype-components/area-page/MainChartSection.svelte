<script lang="ts">
	import MainChart from '$lib/prototype-components/area-page/main-chart/MainChart.svelte';
	import { mainChartOptionsArray } from '$lib/config';

	import { onMount } from 'svelte';

	export let combinedSelectableAreaTypesObject,
		chartData,
		metadata,
		visibleAreas,
		filteredIndicators;
	export let chosenParentAreasArray,
		chosenRelatedAreasId,
		chosenSameRegionArray,
		chosenCountriesArray,
		chosenRegionsArray,
		chosenAllOtherArray;

	let chosenIndicatorId;

	onMount(() => {
		chosenIndicatorId = filteredIndicators[0];
	});
</script>

<div class="main-chart-section-container">
	{#if chosenIndicatorId}
		<MainChart
			{combinedSelectableAreaTypesObject}
			{chartData}
			{metadata}
			{filteredIndicators}
			{visibleAreas}
			bind:chosenIndicatorId
			bind:chosenParentAreasArray
			bind:chosenRelatedAreasId
			bind:chosenSameRegionArray
			bind:chosenCountriesArray
			bind:chosenRegionsArray
			bind:chosenAllOtherArray
		></MainChart>
	{/if}
</div>

<style>
	.main-chart-section-container {
		margin: 20px 0px;
	}
</style>
