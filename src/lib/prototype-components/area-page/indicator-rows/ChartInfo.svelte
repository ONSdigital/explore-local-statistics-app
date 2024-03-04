<script lang="ts">
	import Button from '$lib/prototype-components/modified-svelte-components/button/Button.svelte';
	import Modal from '$lib/prototype-components/layout/Modal.svelte';

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
		icon="question-mark"
		variant="secondary"
		strokeWidth="1.5px"
		stroke="currentcolor"
		fill="none"
	></Button>
</div>

<Modal bind:showModal bind:accordionOpen>
	<div class="title-container row-container" slot="title">
		<span style="font-weight: bold">How to read these charts</span>
	</div>

	<div slot="content" class="column-container">
		<p>
			Placeholder text - this section will contain an annotated example of the beeswarm and line
			charts to help users understand how to read the charts.
		</p>
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
		gap: 5px;
		align-items: center;
	}

	.column-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
</style>
