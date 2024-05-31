<script lang="ts">
	import SelectAnIndicatorChart from './SelectAnIndicatorSection/SelectAnIndicatorChart.svelte';

	export let customLookup,
		selectionsObject,
		filteredIndicators,
		chartData,
		metadata,
		selectedArea,
		accordionArray,
		chosenIndicatorId;
</script>

<div class="main-chart-section-container">
	{#if chosenIndicatorId}
		<SelectAnIndicatorChart
			{customLookup}
			bind:selectionsObject
			{filteredIndicators}
			{chartData}
			{metadata}
			{selectedArea}
			{accordionArray}
			bind:chosenIndicatorId
		></SelectAnIndicatorChart>
	{/if}
</div>

<style>
	.main-chart-section-container {
		margin: 20px 0px;
	}
</style>
