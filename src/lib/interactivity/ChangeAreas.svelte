<script lang="ts">
	import { Button } from '@onsvisual/svelte-components';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/layout/Modal.svelte';
	import AccordionSection from './AccordionSection.svelte';
	import AreaPanel from './AreaPanel.svelte';

	import { getSelectedAreas } from '$lib/util/interactivity/getSelectedAreas';

	export let selectedArea, accordionArray, selectionsObject, customLookup;
	export let label = 'Change areas';

	let colContainer;

	let showModal = false;
	const onClickEventOpen = () => {
		showModal = true;
		const firstTwisty = colContainer.getElementsByTagName('summary')[0];
		firstTwisty.focus();

		console.log('open modal', firstTwisty);
	};

	let accordionOpen = null;
</script>

<div class="button-container">
	<Button on:click={onClickEventOpen} small={true} variant="secondary">
		<div slot="icon" style:display="contents">
			<Icon type="marker" />
		</div>
		{label}
	</Button>
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

	<div slot="content" class="column-container" bind:this={colContainer}>
		{#each accordionArray as accordionSection, index}
			<div
				style:display="block"
				style:margin="-2px 0 -10px"
				style:padding-top={index !== 0 ? '12px' : ''}
				style:border-top={index !== 0 ? '1px solid #cbd5e1' : ''}
			>
				{#if getSelectedAreas(selectionsObject, accordionSection).length > 0}
					{#each getSelectedAreas(selectionsObject, accordionSection) as area}
						<AreaPanel
							{area}
							bind:chosen={selectionsObject[accordionSection.chosenKey + '-chosen']}
							{customLookup}
							backgroundColor="color"
							color="contrast"
						></AreaPanel>
					{/each}
				{:else}
					<div class="no-selection">None selected</div>
				{/if}
			</div>
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
		display: inline-block;
		font-weight: bold;
		transform: translateY(-2px);
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

	.no-selection {
		display: inline-flex;
		background: #eee;
		margin: 0 4px 4px 0;
		line-height: 20px;
		padding: 7px 6px 6px;
		border-radius: 3px;
	}
</style>
