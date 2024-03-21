<script lang="ts">
	import { Button, Checkbox } from '@onsvisual/svelte-components';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/prototype-components/layout/Modal.svelte';
	import EditTimePeriod from '$lib/prototype-components/EditTimePeriod.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';

	export let metadata,
		chosenXDomainNumbStart,
		chosenXDomainNumbEnd,
		showConfidenceIntervals,
		timePeriodsArray,
		chosenTimePeriodDropdownLabel,
		showSlider = true;

	let showModal = false;

	const onClickEventOpen = () => {
		showModal = true;
	};

	let accordionOpen = null;
</script>

<div class="button-container">
	<Button on:click={onClickEventOpen} small={true} variant="secondary">
		<div slot="icon" style:display="contents">
			<Icon type="settings" />
		</div>
		Options
	</Button>
</div>

<Modal bind:showModal bind:accordionOpen>
	<div class="title-container row-container" slot="title">
		<span style="font-weight: bold">Chart options</span>
	</div>

	<div slot="content" class="column-container">
		<Checkbox bind:checked={showConfidenceIntervals} label="Show confidence intervals" compact />

		{#if showSlider}
			<Divider orientation="horizontal"></Divider>

			<EditTimePeriod
				{metadata}
				bind:chosenXDomainNumbStart
				bind:chosenXDomainNumbEnd
				{timePeriodsArray}
				bind:chosenTimePeriodDropdownLabel
			></EditTimePeriod>
		{/if}
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
