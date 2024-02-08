<script>
	//based on https://svelte.dev/examples/modal

	import Button from '$lib/prototype-components/modified-svelte-components/button/Button.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';
	import ModalVisibleAreasKey from '$lib/prototype-components/add-remove-comparison-areas/modal-visible-areas-key/ModalVisibleAreasKey.svelte';
	import ParentRelatedAreasCheckboxes from '$lib/prototype-components/add-remove-comparison-areas/ParentRelatedAreasCheckboxes.svelte';
	import CustomAreasSearch from '$lib/prototype-components/add-remove-comparison-areas/CustomAreasSearch.svelte';

	export let showModal,
		metadata,
		combinedSelectableAreaTypesObject,
		areasCodesForAreasWithData,
		visibleAreasWithData;
	export let chosenParentAreasArray,
		chosenRelatedAreasArray,
		chosenSameRegionArray,
		chosenCountriesArray,
		chosenRegionsArray,
		chosenAllOtherArray;

	let dialog; // HTMLDialogElement

	$: if (dialog && showModal) dialog.showModal();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	on:close={() => (showModal = false)}
	on:click|self={() => dialog.close()}
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div on:click|stopPropagation>
		<div class="add-comparison-areas-container">
			<div class="row-container title-exit-button-container">
				<p class="modal-title">Add/remove comparison areas</p>

				<Button
					on:click={() => dialog.close()}
					small={true}
					icon="cross"
					variant="secondary"
					stroke="currentcolor"
					fill="none"
					strokeWidth="2.5px"
				></Button>
			</div>
		</div>
		<Divider orientation="horizontal" margin={[10, 0, 10, 0]}></Divider>

		<ModalVisibleAreasKey
			{visibleAreasWithData}
			{combinedSelectableAreaTypesObject}
			bind:chosenParentAreasArray
			bind:chosenRelatedAreasArray
			bind:chosenSameRegionArray
			bind:chosenCountriesArray
			bind:chosenRegionsArray
			bind:chosenAllOtherArray
		></ModalVisibleAreasKey>

		<Divider orientation="horizontal" margin={[10, 0, 10, 0]}></Divider>

		<ParentRelatedAreasCheckboxes
			{combinedSelectableAreaTypesObject}
			{areasCodesForAreasWithData}
			bind:chosenParentAreasArray
			bind:chosenRelatedAreasArray
		></ParentRelatedAreasCheckboxes>

		<CustomAreasSearch
			{metadata}
			{combinedSelectableAreaTypesObject}
			{areasCodesForAreasWithData}
			bind:chosenSameRegionArray
			bind:chosenCountriesArray
			bind:chosenRegionsArray
			bind:chosenAllOtherArray
		></CustomAreasSearch>
	</div>
</dialog>

<style>
	dialog {
		width: 760px;
		max-height: 700px;
		border-radius: 5px;
		border: none;
		padding: 0;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.title-exit-button-container {
		justify-content: space-between;
		align-items: center;
	}

	.row-container {
		margin: 0px 0px 20px 0px;
		padding: 0px;
		display: flex;
	}

	.modal-title {
		font-weight: bold;
		padding: 0px;
		margin: 0px;
	}
</style>
