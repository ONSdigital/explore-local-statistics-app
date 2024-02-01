<script lang="ts">
	import MainChart from '$lib/prototype-components/area-page/main-chart/MainChart.svelte';
	import { mainChartOptionsArray } from '$lib/config';

	import { onMount } from 'svelte';

	export let combinedSelectableAreaTypesObject, chartData, metadata, visibleAreas;
	export let chosenParentAreasArray,
		chosenRelatedAreasArray,
		chosenSameRegionArray,
		chosenCountriesArray,
		chosenRegionsArray,
		chosenAllOtherArray;

	let chosenIndicatorId;

	onMount(() => {
		chosenIndicatorId = metadata.indicatorsCodeLabelArray[6];
	});
</script>

<div class="main-chart-section-container">
	{#if chosenIndicatorId}
		<MainChart
			{combinedSelectableAreaTypesObject}
			{chartData}
			{metadata}
			{visibleAreas}
			bind:chosenIndicatorId
			bind:chosenParentAreasArray
			bind:chosenRelatedAreasArray
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
