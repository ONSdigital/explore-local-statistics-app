<script lang="ts">
	import { getName } from '@onsvisual/robo-utils';
	import { getChartTypesForIndicator } from '$lib/components/charts/chartHelpers';
	import { Select, ButtonGroup, ButtonGroupItem } from '@onsvisual/svelte-components';
	import IndicatorChart from '$lib/components/charts/IndicatorChart.svelte';

	let { pageState, areaProps, indicators } = $props();

	const chartTypes = getChartTypesForIndicator();

	let selectedIndicator = $state(indicators[0]);
	let selectedChartTypeKey = $state(chartTypes[0].key);
</script>

<div class="select-an-indicator">
	<Select
		options={indicators}
		bind:value={selectedIndicator}
		label="Choose an indicator to compare {getName(areaProps)}"
		groupKey="subTopic"
		clearable={false}
	/>

	<ButtonGroup legend="Select a chart type" visuallyHideLegend bind:value={selectedChartTypeKey}>
		{#each chartTypes as chartType}
			<ButtonGroupItem value={chartType.key} label={chartType.label} />
		{/each}
	</ButtonGroup>

	{#key selectedChartTypeKey}
		<IndicatorChart
			chartType={selectedChartTypeKey}
			indicator={selectedIndicator.slug}
			metadata={selectedIndicator}
			timeRange={pageState.selectedPeriodRange.map((t) => String(t))}
			selected={[areaProps.areacd, ...pageState.selectedAreas.map((a) => a.areacd)]}
			geoLevel={pageState.selectedGeoGroup}
			showIntervals={pageState.showConfidenceIntervals}
		/>
	{/key}
</div>

<style>
	.select-an-indicator :global(.button-group) {
		margin: 0.5rem 0;
	}
</style>
