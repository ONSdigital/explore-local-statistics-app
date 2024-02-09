<script lang="ts">
	//based on https://svelte.dev/examples/modal
	import Button from '$lib/prototype-components/modified-svelte-components/button/Button.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';
	import Radio from '$lib/prototype-components/modified-svelte-components/Radio.svelte';

	export let chosenAdditionalComparisonAreasGroup,
		comparisonGroupsArray,
		showModalAdditionalComparisonAreaGroup,
		areasGroupsObject;

	let dialog; // HTMLDialogElement

	$: if (dialog && showModalAdditionalComparisonAreaGroup) dialog.showModal();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	on:close={() => (showModalAdditionalComparisonAreaGroup = false)}
	on:click|self={() => dialog.close()}
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div on:click|stopPropagation>
		<div class="add-comparison-areas-container">
			<div class="row-container title-exit-button-container">
				<p class="modal-title">Select a group of areas</p>

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

		<Radio
			title={null}
			name="additional-comparison-areas-options"
			optionsArray={comparisonGroupsArray}
			bind:valueId={chosenAdditionalComparisonAreasGroup}
			labelKey="label2"
			idKey={null}
		></Radio>
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
