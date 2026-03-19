<script lang="ts">
	import { Button, analyticsEvent } from '@onsvisual/svelte-components';

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

	function setBodyOverflow(value) {
		const style = document?.body?.style;
		if (style) style.overflow = value;
	}

	function initDialog(el) {
		// Prevent areas dropdown from closing when scrollbar is clicked
		el.addEventListener('mousedown', (event) => {
			if (event.target.closest('.autocomplete__menu')) {
				event.preventDefault();
			}
		});

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

		return {
			destroy: () => setBodyOverflow('visible')
		};
	}

	function modalAnalyticsEvent(interactionValue) {
		const eventData = {
			event: 'interaction',
			interactionType: 'modal',
			interactionLabel: label,
			interactionValue
		};
		analyticsEvent(eventData);
	}
</script>

<Button
	variant="secondary"
	{icon}
	small
	on:click={() => {
		onOpen();
		dialog.showModal();
		setBodyOverflow('hidden');
		modalAnalyticsEvent('open');
	}}>{label}</Button
>

<dialog
	aria-labelledby={id}
	bind:this={dialog}
	use:initDialog
	onclose={() => setBodyOverflow('visible')}
>
	<h1 {id} tabindex="-1">{title}</h1>
	<div class="modal-contents">
		{@render children()}
	</div>
	<Button
		small
		on:click={() => {
			onConfirm();
			dialog.close();
			modalAnalyticsEvent('confirm');
		}}>Confirm changes</Button
	>
	<Button
		variant="secondary"
		small
		on:click={() => {
			dialog.close();
			onCancel();
			modalAnalyticsEvent('cancel');
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
