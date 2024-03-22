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
		showSlider = true,
		includeNotes = false,
		disableConfidenceIntervals = false;

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
		<div class="confidence-intervals-container">
			<Checkbox
				bind:checked={showConfidenceIntervals}
				label="Show confidence intervals"
				compact
				disabled={disableConfidenceIntervals}
			/>

			{#if disableConfidenceIntervals}
				<span class="note"
					>Confidence interval data is not available for the selected indicator.</span
				>
			{/if}

			{#if includeNotes}
				<span class="note">Note: Confidence interval data is not available for all indicators.</span
				>
				<span class="note"
					>Comparison areas are hidden when 'Show confidence intervals' is selected. Confidence
					intervals for multiple areas can be viewed in the 'Select an indicator' section below.</span
				>
			{/if}
		</div>

		{#if showSlider}
			<Divider orientation="horizontal"></Divider>

			<EditTimePeriod
				{metadata}
				bind:chosenXDomainNumbStart
				bind:chosenXDomainNumbEnd
				{timePeriodsArray}
				bind:chosenTimePeriodDropdownLabel
				{includeNotes}
			></EditTimePeriod>
		{/if}
	</div>
</Modal>

<style>
	.note {
		font-size: 16px;
		line-height: 24px;
	}

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

	.confidence-intervals-container {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
</style>
