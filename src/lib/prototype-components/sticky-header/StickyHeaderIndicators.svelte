<script>
	import ChangeAreas from '$lib/prototype-components/change-areas/ChangeAreas.svelte';
	import AreaPanel from '$lib/prototype-components/AreaPanel.svelte';

	export let selectionsObject, customLookup, accordionArray;
</script>

<div class="row-container sticky">
	<div class="visible-areas-key-container">
		{#each selectionsObject['indicator-additional-visible'] as area}
			<AreaPanel
				{area}
				bind:chosen={selectionsObject['indicator-additional-chosen']}
				{customLookup}
				backgroundColor="color"
				color="contrast"
			/>
		{/each}
		{#if selectionsObject['indicator-additional-visible'].length === 0}
			<span class="no-selection">No areas selected</span>
		{/if}
	</div>
	<div class="row-container buttons-container">
		<ChangeAreas {accordionArray} bind:selectionsObject {customLookup}></ChangeAreas>
	</div>
</div>

<style>
	.no-selection {
		display: inline-block;
		color: #222;
		background: #ddd;
		padding: 6px;
		border-radius: 3px;
		line-height: 20px;
	}

	.sticky {
		margin: 0 0 24px;
		width: 100%;
		background-color: white;
		padding: 10px 0px;
		position: sticky;
		top: 0px;
		z-index: 100;
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
