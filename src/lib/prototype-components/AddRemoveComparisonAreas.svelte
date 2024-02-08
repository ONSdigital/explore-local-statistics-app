<script lang="ts">
	import Button from '$lib/prototype-components/modified-svelte-components/button/Button.svelte';
	import Modal from '$lib/prototype-components/add-remove-comparison-areas/Modal.svelte';

	export let metadata,
		combinedSelectableAreaTypesObject,
		visibleAreasWithData,
		areasCodesForAreasWithData;
	export let chosenParentAreasArray,
		chosenRelatedAreasArray,
		chosenSameRegionArray,
		chosenCountriesArray,
		chosenRegionsArray,
		chosenAllOtherArray;

	let showModal = false;

	const onClickEventOpen = () => {
		showModal = true;
	};
</script>

<div class="button-container">
	<Button
		on:click={onClickEventOpen}
		small={true}
		icon="edit"
		variant="secondary"
		strokeWidth="1.5px"
		stroke="currentcolor"
		fill="none">Add/remove comparison areas</Button
	>
</div>

{#if showModal}
	<Modal
		bind:showModal
		{metadata}
		{combinedSelectableAreaTypesObject}
		{visibleAreasWithData}
		{areasCodesForAreasWithData}
		bind:chosenParentAreasArray
		bind:chosenRelatedAreasArray
		bind:chosenSameRegionArray
		bind:chosenCountriesArray
		bind:chosenRegionsArray
		bind:chosenAllOtherArray
	></Modal>
{/if}

<style>
	.button-container {
		margin: 0px 0px 10px 0px;
	}
</style>
