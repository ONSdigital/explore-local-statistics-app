<script lang="ts">
	import { onMount } from 'svelte';
	import { makeDataUrl, makeValueFormatter, makePeriodFormatter } from '$lib/utils';
	import { Observe, Icon } from '@onsvisual/svelte-components';
	import Line from '$lib/components/charts/Line.svelte';
	import Map from '$lib/components/charts/Map.svelte';
	import Bar from '$lib/components/charts/Bar.svelte';
	import Table from '$lib/components/charts/Table.svelte';
	import ChartActions from './ChartActions.svelte';
	import ChartDataLoader from './ChartDataLoader.svelte';
	import { pluralise } from '@onsvisual/robo-utils';
	import { getGeoLevel } from '$lib/config/geoLevels';
	import { isValidGeoLevel } from '$lib/util/validationHelpers';

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
		mode = 'default',
		noChartMessage = null
	} = $props();

	let visible = $state(false);
	let el = $state();
	let fullscreenMode = $state(false);
	let fullscreenHeightDiff = $state(null);
	let dataTimeRange = $state(timeRange);

	let selectedCodes = $derived(selected.map((d) => d.areacd));
	let formatPeriod = $derived(makePeriodFormatter(metadata?.periodFormat || 'year'));
	let formatValue = $derived(makeValueFormatter(metadata?.decimalPlaces));
	let hasTimeRange = $derived(
		['line', 'table'].includes(chartType) && timeRange[0] !== timeRange[1]
	);
	let geoLevelObj = $derived(
		getGeoLevel(
			geoLevel.geoCluster
				? 'ltla'
				: isValidGeoLevel(geoLevel?.geoLevel)
					? geoLevel.geoLevel
					: isValidGeoLevel(geoLevel?.id)
						? geoLevel.id
						: 'ltla'
		)
	);

	let dataUrl = $derived(
		makeDataUrl(
			indicator,
			hasTimeRange ? timeRange : timeRange[timeRange.length - 1],
			!hasTimeRange && String(timeRange[timeRange.length - 1]).length === 4 ? 'latest' : null,
			selectedCodes,
			geoLevelObj?.id,
			geoLevel?.geoExtent,
			geoLevel?.geoCluster
		)
	);

	function toggleFullscreen() {
		if (!fullscreenMode) {
			const contentHeight = el?.getBoundingClientRect?.()?.height;
			fullscreenHeightDiff =
				contentHeight && contentHeight < screen.height ? screen.height - contentHeight + 28 : null;
			fullscreenMode = true;
			el?.requestFullscreen?.();
		} else {
			fullscreenHeightDiff = null;
			fullscreenMode = false;
			document?.exitFullscreen?.();
		}
	}

	function updateTimeRange(data) {
		if (data?.period?.length) {
			const periods = [...new Set(data.period)].sort();
			dataTimeRange = [periods[0], periods[periods.length - 1]];
		} else {
			dataTimeRange = timeRange;
		}
	}

	onMount(() => {
		// If full screen mode is exited using the escape key
		document.addEventListener('fullscreenchange', () => {
			if (fullscreenMode && !document.fullscreenElement) {
				fullscreenMode = false;
				fullscreenHeightDiff = null;
			}
		});
	});
</script>

<div
	class="content-block"
	class:content-fullscreen={fullscreenMode}
	class:content-padding={mode === 'default'}
	class:content-border={mode === 'default' && !fullscreenMode}
	bind:this={el}
>
	{#if noChartMessage}
		<div class="no-chart-container">
			<p>
				{@html noChartMessage}
			</p>
		</div>
	{:else if chartType === 'line' && dataTimeRange[0] === dataTimeRange[1]}
		<div class="no-chart-container">
			<p>
				Line chart could not be displayed for <strong>{metadata.label}</strong>. Only one year of
				data selected.
			</p>
		</div>
	{:else}
		<h3 class="content-title">{metadata.label}</h3>
		<p class="content-subtitle">
			{metadata.subtitle},
			{pluralise(geoLevel.label).toLowerCase()},
			{#if hasTimeRange}{formatPeriod(dataTimeRange[0])} to{/if}
			{formatPeriod(dataTimeRange[dataTimeRange.length - 1])}
		</p>
		{#if mode === 'default'}
			<button
				class="fullscreen-toggle"
				title="{fullscreenMode ? 'Exit' : 'Enter'} full screen mode"
				onclick={toggleFullscreen}
			>
				<Icon type={fullscreenMode ? 'shrink' : 'expand'} size="l" />
				<span class="ons-u-vh">{fullscreenMode ? 'Exit' : 'Enter'} full screen mode</span>
			</button>
		{/if}
		<Observe bind:visible>
			<div class="indicator-chart">
				<ChartDataLoader
					id="{indicator} {chartType}"
					{dataUrl}
					{visible}
					filterExtremes={!['map', 'table'].includes(chartType)}
					onUpdate={updateTimeRange}
				>
					{#snippet chart(data)}
						{@const Component = chartComponents[chartType]}
						{@const selectedMissing = selected.filter((d) => !data.areacd.includes(d.areacd))}
						<Component
							{data}
							{metadata}
							{formatValue}
							selected={selectedCodes}
							bind:hovered
							{formatPeriod}
							geoLevel={geoLevelObj}
							{showIntervals}
							{mode}
							extendHeight={fullscreenHeightDiff}
						/>
						{#if selectedMissing.length}
							<p class="missing-data-note">
								<strong>Note:</strong>
								{#if selectedMissing.length === 1}
									Data for {selectedMissing[0].areanm} is not available.
								{:else}
									Data for some selected areas is not available.
								{/if}
							</p>
						{/if}
					{/snippet}
				</ChartDataLoader>
			</div>
		</Observe>
		{#if metadata.source.length > 0}
			<div class="source-notes">
				<strong>Source:</strong>
				{#each metadata.source as s, i}
					<a href={s.href} target="_blank"
						>{s.name}<span class="ons-u-vh"> (link opens in a new tab)</span></a
					><span class="inline-icon ons-u-ml-3xs"><Icon type="external" /></span>{i <
					metadata.source.length - 1
						? ' and '
						: ''}
				{/each}
			</div>
		{/if}
	{/if}
</div>
{#if mode === 'default'}
	<ChartActions
		{indicator}
		{metadata}
		{timeRange}
		selected={selectedCodes}
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
		display: flex;
		flex-direction: column;
		background: var(--ons-color-page-light);
	}
	.content-padding {
		padding: 12px;
	}
	.content-border {
		border: 1px solid #909090;
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
		min-height: 400px;
		align-items: center;
	}
	.missing-data-note {
		padding: 12px 0 4px;
		font-size: 16px;
		gap: 5px;
		line-height: 1.2;
		margin: 0px;
	}
	.source-notes {
		padding: 6px 0 4px;
		font-size: 16px;
		gap: 5px;
		line-height: 1.2;
		margin: auto 0 0;
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
</style>
