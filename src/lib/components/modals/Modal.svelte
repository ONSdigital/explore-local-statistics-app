<script lang="ts">
	import { Button } from '@onsvisual/svelte-components';

	let {
		title,
		label,
		icon = null,
		children,
		onOpen = () => null,
		onConfirm = () => null,
		onCancel = () => null
	} = $props();

	let id = $derived(title.toLowerCase().replaceAll(' ', '-'));
	let dialog = $state();

	function clickOutsideToCancel(el) {
		el.addEventListener('pointerup', (event) => {
			const rect = el.getBoundingClientRect();
			const isInDialog =
				rect.top < event.clientY &&
				// event.clientY < rect.top + rect.height &&
				rect.left < event.clientX &&
				event.clientX < rect.left + rect.width;
			if (!isInDialog) {
				el.close();
				onCancel();
			}
		});
		el.addEventListener('keydown', (event) => {
			if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
				event.preventDefault();
			}
		});
	}
</script>

<Button
	variant="secondary"
	{icon}
	small
	on:click={() => {
		onOpen();
		dialog.showModal();
	}}>{label}</Button
>

<dialog aria-labelledby={id} bind:this={dialog} use:clickOutsideToCancel>
	<h1 {id} tabindex="-1">{title}</h1>
	<div class="modal-contents">
		{@render children()}
	</div>
	<Button
		small
		on:click={() => {
			onConfirm();
			dialog.close();
		}}>Confirm changes</Button
	>
	<Button
		variant="secondary"
		small
		on:click={() => {
			dialog.close();
			onCancel();
		}}>Cancel</Button
	>
</dialog>

<style>
	dialog {
		width: 760px;
		max-width: calc(100% - 2rem);
		overflow-x: hidden;
		overflow-y: auto;
	}
	dialog :global(.ons-btn__text) {
		text-align: left;
		white-space: initial;
	}
	.modal-contents {
		margin-bottom: 2rem;
	}
</style>
