<script lang="ts">
	import { makeDataUrl, makeValueFormatter, makePeriodFormatter } from '$lib/utils';
	import { Observe, Icon } from '@onsvisual/svelte-components';
	import Line from '$lib/components/charts/Line.svelte';
	import Map from '$lib/components/charts/Map.svelte';
	import Bar from '$lib/components/charts/Bar.svelte';
	import Table from '$lib/components/charts/Table.svelte';
	import ChartActions from './ChartActions.svelte';
	import ChartDataLoader from './ChartDataLoader.svelte';
	import { pluralise } from '@onsvisual/robo-utils';

	const chartComponents = {
		map: Map,
		line: Line,
		bar: Bar,
		table: Table
	};

	let {
		chartType,
		indicator,
		metadata,
		timeRange,
		selected = [],
		geoLevel = null,
		showIntervals = false,
		hovered = $bindable(),
		mode = 'default'
	} = $props();

	let visible = $state(false);
	let el = $state();
	let fullScreenMode = $state(false);

	let formatPeriod = $derived(makePeriodFormatter(metadata.periodFormat));
	let formatValue = $derived(makeValueFormatter(metadata.decimalPlaces));
	let hasTimeRange = $derived(
		['line', 'table'].includes(chartType) && timeRange[0] !== timeRange[1]
	);

	let dataUrl = $derived(
		makeDataUrl(
			indicator,
			hasTimeRange ? timeRange : timeRange[timeRange.length - 1],
			'latest',
			selected,
			geoLevel?.id
		)
	);

	function toggleFullScreen() {
		if (!fullScreenMode) {
			el?.requestFullscreen?.();
			fullScreenMode = true;
		} else {
			document?.exitFullscreen?.();
			fullScreenMode = false;
		}
	}
</script>

<div
	class="content-block"
	class:content-fullscreen={fullScreenMode}
	class:content-border={mode === 'default' && !fullScreenMode}
	bind:this={el}
>
	{#if chartType === 'line' && timeRange[0] === timeRange[1]}
		<div class="no-chart-container">
			<p>
				Time series not displayed as selected date range includes only one time period with
				<span style="font-weight: bold;">{metadata.label}</span> data.
			</p>
		</div>
	{:else}
		<h3 class="content-title">{metadata.label}</h3>
		<p class="content-subtitle">
			{metadata.subtitle},
			{pluralise(geoLevel.label).toLowerCase()},
			{#if hasTimeRange}{formatPeriod(timeRange[0])} to{/if}
			{formatPeriod(timeRange[timeRange.length - 1])}
		</p>
		{#if mode === 'default'}
			<button
				class="fullscreen-toggle"
				title="{fullScreenMode ? 'Exit' : 'Enter'} full screen mode"
				onclick={toggleFullScreen}
			>
				<Icon type={fullScreenMode ? 'shrink' : 'expand'} size="l" />
				<span class="ons-u-vh">{fullScreenMode ? 'Exit' : 'Enter'} full screen mode</span>
			</button>
		{/if}
		<Observe bind:visible>
			<div class="indicator-chart">
				<ChartDataLoader id="{indicator} {chartType}" {dataUrl} {visible}>
					{#snippet chart(data)}
						{@const Component = chartComponents[chartType]}
						<Component
							{data}
							{metadata}
							{formatValue}
							{selected}
							bind:hovered
							{formatPeriod}
							{geoLevel}
							{showIntervals}
							{mode}
						/>
					{/snippet}
				</ChartDataLoader>
			</div>
		</Observe>
		{#if metadata.source.length > 0}
			<div class="source-notes-container">
				<p class="source-container">
					<span style="font-weight: bold">Source:</span>
					{#each metadata.source as s, i}
						<a href={s.href} target="_blank">{s.name}</a>{i < metadata.source.length - 1
							? ' and '
							: ''}
					{/each}
				</p>
			</div>
		{/if}
	{/if}
</div>
{#if mode === 'default'}
	<ChartActions
		{indicator}
		{metadata}
		{timeRange}
		{selected}
		{geoLevel}
		{showIntervals}
		{chartType}
		chartDiv={el}
		{dataUrl}
	/>
{/if}

<style>
	.content-block {
		position: relative;
		background: var(--ons-color-page-light);
	}
	.content-border {
		border: 1px solid #909090;
		padding: 12px;
	}
	.fullscreen-toggle {
		position: absolute;
		cursor: pointer;
		top: 12px;
		right: 8px;
		color: var(--ons-color-text-link);
		background: none;
		border: none;
	}
	.fullscreen-toggle:hover {
		color: var(--ons-color-text-link-hover);
	}
	.fullscreen-toggle:hover :global(.ons-icon) {
		transform: scale(1.2);
	}
	.no-chart-container {
		display: flex;
		min-height: 160px;
		align-items: center;
	}
	.source-notes-container {
		padding: 8px 0 4px;
		font-size: 16px;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	.source-container {
		padding: 0px;
		margin: 0px;
		line-height: 1.2;
	}
	.content-title {
		margin: 0;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: baseline;
	}
	.indicator-chart {
		display: block;
		position: relative;
		min-height: 400px;
	}
	.content-fullscreen .indicator-chart {
		min-height: 100vh;
	}
</style>
