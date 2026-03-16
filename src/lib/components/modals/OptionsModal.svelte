<script lang="ts">
	import { Checkbox, ButtonGroup, ButtonGroupItem } from '@onsvisual/svelte-components';
	import Modal from './Modal.svelte';
	import RangeSlider from './RangeSlider.svelte';
	import { cloneState } from './modalHelpers';

	let { data, pageState = $bindable(), hasIntervals = true, mode = 'indicator' } = $props();

	let _pageState = $state(cloneState(pageState));
	let formatTick = $derived(pageState?.formatPeriod?.() || ((d) => d));
</script>

<Modal
	title="Chart options"
	label="Chart options"
	icon="cog"
	onOpen={() => (_pageState = cloneState(pageState))}
	onConfirm={() => (pageState = cloneState(_pageState))}
	onCancel={() => (_pageState = cloneState(pageState))}
>
	<RangeSlider
		label="Selected time range"
		options={data.periods}
		{formatTick}
		bind:selectedRange={_pageState.selectedPeriodRange}
	/>

	{#if mode === 'area'}
		<div class="mobile-only">
			<ButtonGroup
				name="primary"
				legend="Select chart type"
				bind:value={_pageState.selectedChartType}
			>
				<ButtonGroupItem value="beeswarm" label="Distribution chart" />
				<ButtonGroupItem value="sparkline" label="Line chart" />
			</ButtonGroup>
		</div>
	{/if}

	<Checkbox
		id="ci-checkbox"
		bind:checked={_pageState.showConfidenceIntervals}
		label="Show confidence intervals"
		disabled={!hasIntervals}
		compact
	/>
	{#if !hasIntervals}
		<p class="ons-chart__caption">Note: Confidence intervals not available for this indicator</p>
	{/if}
</Modal>

<style>
	.mobile-only {
		display: block;
		margin-top: 0.15rem;
		margin-bottom: 1.25rem;
	}

	@media (min-width: 768px) {
		.mobile-only {
			display: none;
		}
	}
	.mobile-only :global(legend) {
		margin-bottom: 0.25rem;
		font-weight: normal;
	}
</style>
