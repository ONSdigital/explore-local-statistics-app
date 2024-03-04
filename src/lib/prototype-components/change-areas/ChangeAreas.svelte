<script lang="ts">
	import Button from '$lib/prototype-components/modified-svelte-components/button/Button.svelte';
	import Modal from '$lib/prototype-components/layout/Modal.svelte';
	import AccordionSection from '$lib/prototype-components/change-areas/AccordionSection.svelte';
	import AreaPanel from '$lib/prototype-components/AreaPanel.svelte';

	export let selectedArea, accordionArray, selectionsObject, customLookup;

	let showModal = false;

	const onClickEventOpen = () => {
		showModal = true;
	};

	let accordionOpen = null;
</script>

<div class="button-container">
	<Button
		on:click={onClickEventOpen}
		small={true}
		icon="marker"
		variant="secondary"
		strokeWidth="1.5px"
		stroke="currentcolor"
		fill="none">Change areas</Button
	>
</div>

<Modal bind:showModal bind:accordionOpen>
	<div class="title-container row-container" slot="title">
		{#if selectedArea}
			<span>Comparing</span>
			<AreaPanel
				area={selectedArea}
				{customLookup}
				markerRadius="8"
				button={false}
				fontWeight="bold"
			></AreaPanel>
			<span>to:</span>
		{:else}
			<span style="font-weight: bold">Select areas</span>
		{/if}
	</div>

	<div slot="content" class="column-container">
		{#each accordionArray as accordionSection, index}
			<AccordionSection
				{accordionSection}
				{index}
				bind:chosen={selectionsObject[accordionSection.chosenKey + '-chosen']}
				bind:accordionOpen
				visibleAreas={selectionsObject[accordionSection.chosenKey + '-visible']}
				{customLookup}
			></AccordionSection>
		{/each}
	</div>
</Modal>

<style>
	.title-container span {
		font-weight: bold;
		font-size: 20px;
	}

	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: flex-start;
		gap: 5px;
		align-items: center;
	}

	.area-container {
		padding: 4px;
		display: inline-block;
		border-radius: 4px;
		border-style: solid;
		border-width: 1.5px;
		line-height: 20px;
	}

	.inline-row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		gap: 2px;
	}

	.column-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
</style>
