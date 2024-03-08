<script lang="ts">
	import { Button } from '@onsvisual/svelte-components';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/prototype-components/layout/Modal.svelte';
	import AccordionSection from '$lib/prototype-components/change-areas/AccordionSection.svelte';
	import AreaPanel from '$lib/prototype-components/AreaPanel.svelte';

	export let selectedArea, accordionArray, selectionsObject, customLookup;
	export let label = 'Change areas';

	let showModal = false;

	const onClickEventOpen = () => {
		showModal = true;
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

	<div slot="content" class="column-container">
		<div style:display="block">
			{#each accordionArray as accordionSection, index}
				{#each Array.isArray(selectionsObject[accordionSection.chosenKey + '-visible']) ? (selectionsObject[accordionSection.chosenKey + '-visible'].length > 0 ? selectionsObject[accordionSection.chosenKey + '-visible'] : [null]) : [selectionsObject[accordionSection.chosenKey + '-visible']] as area}
					<AreaPanel
						{area}
						bind:chosen={selectionsObject[accordionSection.chosenKey + '-chosen']}
						{customLookup}
						backgroundColor="color"
						color="contrast"
					></AreaPanel>
				{/each}
			{/each}
		</div>
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
		display: inline-block;
		font-weight: bold;
		transform: translateY(-2px);
		/* font-size: 20px; */
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
