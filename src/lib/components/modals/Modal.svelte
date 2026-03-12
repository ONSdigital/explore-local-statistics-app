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

	function initDialog(el) {
		el.addEventListener('mousedown', (event) => {
			if (event.target.closest('.autocomplete__menu')) {
				event.preventDefault();
			}
		});
		el.addEventListener('close', () => (document.body.style.overflow = 'visible'));

		// Click outside to close dialog
		el.addEventListener('pointerup', (event) => {
			const rect = el.getBoundingClientRect();
			const isInDialog =
				rect.top < event.clientY &&
				rect.left < event.clientX &&
				event.clientX < rect.left + rect.width;
			if (!isInDialog) {
				el.close();
				onCancel();
			}
		});
		// Re-enable background scroll
		el.addEventListener('close', () => (document.body.style.overflow = 'visible'));
	}
</script>

<Button
	variant="secondary"
	{icon}
	small
	on:click={() => {
		onOpen();
		dialog.showModal();
		// Prevent background scroll
		document.body.style.overflow = 'hidden';
	}}>{label}</Button
>

<dialog aria-labelledby={id} bind:this={dialog} use:initDialog>
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
		overflow: visible;
	}

	dialog :global(.ons-btn__text) {
		text-align: left;
		white-space: initial;
	}

	.modal-contents {
		margin-bottom: 2rem;
	}

	:global(.autocomplete__dropdown-arrow-down-wrapper) {
		pointer-events: none;
	}
</style>
