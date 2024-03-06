<script lang="ts">
	import ChangeAreas from '$lib/prototype-components/change-areas/ChangeAreas.svelte';
	import ChartOptions from '$lib/prototype-components/ChartOptions.svelte';
	import ChartInfo from '$lib/prototype-components/area-page/indicator-rows/ChartInfo.svelte';
	import AreaPanel from '$lib/prototype-components/AreaPanel.svelte';

	export let metadata,
		selectedArea,
		accordionArray,
		selectionsObject,
		customLookup,
		chosenXDomain,
		showConfidenceIntervals;

	$: visibleParentAreas = selectionsObject['areas-rows-additional-visible'].filter(
		(el) => el.role != 'custom'
	);
	$: visibleCustomAreas = selectionsObject['areas-rows-additional-visible'].filter(
		(el) => el.role === 'custom'
	);

	let maxAdditionalAreasOnKey = 4;
</script>

<div></div>

<div class="row-container sticky">
	<div class="visible-areas-key-container grid-container">
		<AreaPanel area={selectedArea} markerRadius="8" button={false} fontWeight="bold"></AreaPanel>
		{#each visibleParentAreas as area, i}
			<AreaPanel
				{area}
				markerShape={area.areacd === selectedArea.parentcd ? 'square' : 'diamond'}
				markerRadius="8"
				button={false}
				fontWeight="bold"
				{customLookup}
			></AreaPanel>
		{/each}
		{#each visibleCustomAreas as area, i}
			{#if visibleParentAreas.length + i < maxAdditionalAreasOnKey - 1 || (visibleParentAreas.length + i === maxAdditionalAreasOnKey - 1 && visibleParentAreas.length + visibleCustomAreas.length === maxAdditionalAreasOnKey)}
				<AreaPanel {area} markerRadius="8" button={false} fontWeight="bold" {customLookup}
				></AreaPanel>
			{/if}
		{/each}
		{#if selectionsObject['areas-rows-comparison-visible']}
			<AreaPanel
				area={selectionsObject['areas-rows-comparison-visible']}
				markerRadius="8"
				button={false}
				fontWeight="bold"
				markerShape="diamond"
			></AreaPanel>
		{/if}
		{#if selectionsObject['related-rows-visible'] || selectionsObject['areas-rows-additional-visible'].length > 0}
			<AreaPanel
				area={selectionsObject['related-rows-visible']}
				markerRadius="5"
				button={false}
				fontSize="16px"
				backgroundColor="white"
				textColor="#222"
			></AreaPanel>
			{#if visibleParentAreas.length + visibleCustomAreas.length > maxAdditionalAreasOnKey}
				<span style="font-size: 16px;"
					>and {visibleParentAreas.length +
						visibleCustomAreas.length -
						(maxAdditionalAreasOnKey - 1)}
					other areas</span
				>
			{/if}
		{/if}
	</div>

	<div class="row-container buttons-container">
		<ChangeAreas {selectedArea} {accordionArray} bind:selectionsObject {customLookup}></ChangeAreas>

		<ChartOptions {metadata} bind:chosenXDomain bind:showConfidenceIntervals></ChartOptions>
		<ChartInfo></ChartInfo>
	</div>
</div>

<style>
	.sticky {
		margin: 0px;
		width: 100%;
		background-color: white;
		padding: 10px 0px;
		position: sticky;
		top: 0px;
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: 10px;
		justify-content: space-between;
	}

	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 4px;
	}

	.grid-container {
		display: flex;
		flex-direction: column;
	}

	.col1 {
		white-space: nowrap; /* Prevent text in the first column from wrapping */
		text-align: end;
	}

	.col2 {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
	}

	.button-container {
		justify-content: flex-end;
	}
</style>
