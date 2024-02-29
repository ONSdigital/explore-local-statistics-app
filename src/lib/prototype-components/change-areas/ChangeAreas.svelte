<script lang="ts">
	import Button from '$lib/prototype-components/modified-svelte-components/button/Button.svelte';
	import Modal from '$lib/prototype-components/layout/Modal.svelte';
	import AccordionSection from '$lib/prototype-components/change-areas/AccordionSection.svelte';

	import { colorsLookup } from '$lib/config.js';

	export let selectedArea, accordionArray, chosenArray, visiblePrimaryAreas, testChosen;

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

<Modal bind:showModal>
	<div class="title-container row-container" slot="title">
		{#if selectedArea}
			<span>Comparing</span>
			<div class="area-container" style="border-color: {colorsLookup.main.color}">
				<div class="inline-row-container">
					<svg width="20" height="20">
						<circle cx="10" cy="10" r="8" stroke="white" fill={colorsLookup.main.color}></circle>
					</svg>
					<span style="color: {colorsLookup.main.color}; font-weight: bold"
						>{selectedArea.areanm}</span
					>
				</div>
			</div>
			<span>to:</span>
		{:else}
			<span style="font-weight: bold">Select visualised areas</span>
		{/if}
	</div>

	<div slot="content">
		{#each accordionArray as accordionSection, index}
			<AccordionSection
				{accordionSection}
				{index}
				bind:chosen={testChosen.aaaa}
				bind:accordionOpen
				{visiblePrimaryAreas}
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
		gap: 10px;
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
</style>
