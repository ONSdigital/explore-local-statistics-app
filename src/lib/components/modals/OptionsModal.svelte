<script lang="ts">
	import { Checkbox, ButtonGroup, ButtonGroupItem } from '@onsvisual/svelte-components';
	import Modal from './Modal.svelte';
	import RangeSlider from './RangeSlider.svelte';
	import { cloneState } from './modalHelpers';

	let { data, pageState = $bindable(), hasIntervals = true, mode = 'default' } = $props();

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

	{#if mode === 'default'}
		<div class="mobile-only">
			<ButtonGroup
				name="primary"
				legend="Choose a chart type"
				value="beeswarm"
				visuallyHideLegend
				bind:selectedChartType={_pageState.selectedChartType}
			>
				<ButtonGroupItem value="beeswarm" label="Beeswarm" />
				<ButtonGroupItem value="line" label="Line chart" />
			</ButtonGroup>
		</div>
	{/if}
</Modal>

<style>
	.mobile-only {
		display: block;
	}

	@media (min-width: 768px) {
		.mobile-only {
			display: none;
		}
	}
</style>
