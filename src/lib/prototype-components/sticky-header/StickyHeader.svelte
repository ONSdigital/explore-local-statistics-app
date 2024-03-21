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
		chosenXDomainNumbStart,
		chosenXDomainNumbEnd,
		showConfidenceIntervals,
		backgroundColor = 'white';

	$: visibleParentAreas = selectionsObject['areas-rows-additional-visible'].filter(
		(el) => el.role != 'custom'
	);
	$: visibleCustomAreas = selectionsObject['areas-rows-additional-visible'].filter(
		(el) => el.role === 'custom'
	);

	let maxAdditionalAreasOnKey = 1;
	let showAllAreas = false;
</script>

<div></div>

<div class="row-container sticky control-panel">
	<div class="visible-areas-key-container grid-container">
		<AreaPanel area={selectedArea} markerRadius="8" button={false} fontWeight="bold"></AreaPanel>
		{#if selectionsObject['areas-rows-comparison-visible']}
			<AreaPanel
				area={selectionsObject['areas-rows-comparison-visible']}
				markerRadius="8"
				button={false}
				fontWeight="bold"
				markerShape="diamond"
			></AreaPanel>
		{/if}
		{#each showAllAreas ? visibleParentAreas : visibleParentAreas.slice(0, maxAdditionalAreasOnKey) as area, i}
			<AreaPanel
				{area}
				markerShape={area.areacd === selectedArea.parentcd ? 'square' : 'diamond'}
				markerRadius="8"
				button={false}
				backgroundColor="white"
				fontWeight="bold"
				{customLookup}
			></AreaPanel>
		{/each}
		{#each showAllAreas ? visibleCustomAreas : visibleCustomAreas.slice(0, Math.max(0, maxAdditionalAreasOnKey - visibleParentAreas.length)) as area, i}
			<AreaPanel
				{area}
				markerRadius="8"
				button={false}
				backgroundColor="white"
				fontWeight="bold"
				{customLookup}
			></AreaPanel>
		{/each}
		{#if selectionsObject['related-rows-visible'] || selectionsObject['areas-rows-additional-visible'].length > 0}
			<AreaPanel
				area={selectionsObject['related-rows-visible']}
				markerRadius="6"
				button={false}
				backgroundColor="white"
				color="#ddd"
				borderColor="#707070"
			></AreaPanel>
			{#if !showAllAreas && visibleParentAreas.length + visibleCustomAreas.length > maxAdditionalAreasOnKey}
				<button class="btn-link" on:click={() => (showAllAreas = true)}
					>Show {visibleParentAreas.length + visibleCustomAreas.length - maxAdditionalAreasOnKey} more
					{visibleParentAreas.length + visibleCustomAreas.length - maxAdditionalAreasOnKey === 1
						? 'area'
						: 'areas'}</button
				>
			{:else if showAllAreas}
				<button class="btn-link" on:click={() => (showAllAreas = false)}>Show fewer areas</button>
			{/if}
		{/if}
	</div>

	<div class="buttons-container">
		<ChangeAreas {selectedArea} {accordionArray} bind:selectionsObject {customLookup}></ChangeAreas>

		<ChartOptions
			{metadata}
			bind:showConfidenceIntervals
			bind:chosenXDomainNumbStart
			bind:chosenXDomainNumbEnd
		></ChartOptions>
		<ChartInfo></ChartInfo>
	</div>
</div>

<style>
	.control-panel {
		border-bottom: 1px solid var(--ons-color-grey-15);
	}
	.sticky {
		margin: 0px;
		width: 100%;
		background-color: white;
		padding: 10px 0;
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
		flex-wrap: wrap;
		gap: 10px;
	}

	.grid-container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		min-width: 200px;
	}

	.buttons-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: flex-end;
		gap: 4px;
	}

	.btn-link {
		text-align: left;
		font-size: 16px;
		padding-left: 24px;
	}
</style>
