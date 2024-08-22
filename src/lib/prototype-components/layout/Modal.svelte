<script lang="ts">
	//based on https://svelte.dev/examples/modal
	import { Button } from '@onsvisual/svelte-components';
	import Icon from '$lib/components/Icon.svelte';

	export let showModal, accordionOpen;

	let dialog; // HTMLDialogElement

	$: if (dialog && showModal) dialog.showModal();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	on:close={() => ((showModal = false), (accordionOpen = false))}
	on:mousedown|self={() => dialog.close()}
	on:touchstart|self={() => dialog.close()}
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div on:click|stopPropagation>
		<div class="row-container title-exit-button-container">
			<slot name="title" />
			<Button on:click={() => dialog.close()} small={true} hideLabel variant="secondary">
				<div slot="icon" style:display="contents">
					<Icon type="close" />
				</div>
				Close
			</Button>
		</div>
		<div class="dialog-content">
			<slot name="content" />
		</div>
	</div>
</dialog>

<style>
	dialog {
		width: 760px;
		margin-top: 40px;
		min-height: 350px;
		max-height: calc(100vh - 80px);
		border-radius: 5px;
		border: none;
		padding: 0;
	}
	.dialog-content {
		max-height: calc(100vh - 175px);
		overflow-x: hidden;
		overflow-y: auto;
		padding: 0 12px;
		margin: 0 -12px;
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

	.row-container {
		margin: 0px 0px 20px 0px;
		padding: 0px;
		display: flex;
	}

	.title-exit-button-container {
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.modal-title {
		font-weight: bold;
		padding: 0px;
		margin: 0px;
	}
</style>
