<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Observe, Em, ButtonGroup, ButtonGroupItem, Icon } from '@onsvisual/svelte-components';
	import { makeDataUrl, makeValueFormatter, makePeriodFormatter, downloadEvent } from '$lib/utils';
	import { timeRangesOverlap } from '$lib/api/data/helpers/dataFilters';
	import Beeswarm from '$lib/components/charts/Beeswarm.svelte';
	import Sparkline from '$lib/components/charts/Sparkline.svelte';
	import Pyramid from '$lib/components/charts/Pyramid.svelte';
	import ChartDataLoader from '$lib/components/charts/ChartDataLoader.svelte';

	let {
		indicator,
		metadata,
		timeRange,
		showIntervals = false,
		selectedChart = 'beeswarm',
		selected = [],
		geoGroup,
		hovered = $bindable(),
		hidden = null
	} = $props();

	let isMobile = $state(false);

	onMount(() => {
		const mq = window.matchMedia('(max-width: 767px)');
		isMobile = mq.matches;
		mq.addEventListener('change', (e) => (isMobile = e.matches));
	});

	let visible = $state(false);
	let expanded = $state(false);
	let valueDomain = $derived(metadata?.valueDomain);
	let formatValue = $derived(makeValueFormatter(metadata.decimalPlaces));
	let formatPeriod = $derived(makePeriodFormatter(metadata.periodFormat));

	let chartTypes = $derived(
		indicator === 'population-by-age-and-sex' ? ['pyramid'] : ['beeswarm', 'sparkline']
	);
	let chartMode = $state('simple');

	function makeChartArgs(
		chartType: string,
		chartMode: string,
		indicator: string,
		timeRange: string[],
		geoGroup: { [key: string]: string },
		selected: string[]
	) {
		const adv = chartMode === 'advanced';
		return chartType === 'beeswarm'
			? [
					indicator,
					timeRange[1],
					'latest',
					selected,
					geoGroup.geoLevel,
					geoGroup.geoExtent,
					geoGroup.geoCluster
				]
			: chartType === 'pyramid'
				? [
						indicator,
						timeRange[1],
						'latest',
						selected,
						adv ? geoGroup.geoLevel : null,
						adv ? geoGroup.geoExtent : null,
						adv ? geoGroup.geoCluster : null,
						{ sex: ['female', 'male'] }
					]
				: [indicator, timeRange, null, selected];
	}

	let dataUrl = $derived(
		Object.fromEntries(
			timeRangesOverlap(metadata.periodDomain, timeRange)
				? chartTypes.map((key) => {
						const args = makeChartArgs(key, chartMode, indicator, timeRange, geoGroup, selected);
						return [key, makeDataUrl(...args)];
					})
				: chartTypes.map((key) => [key, null])
		)
	);
</script>

{#snippet downloadUrl(chartType: string, format: string, formatLabel: string | null = null)}
	{@const label = formatLabel || format.toUpperCase()}
	{@const chartName =
		chartType === 'beeswarm' ? 'distribution' : chartType === 'sparkline' ? 'line' : chartType}
	{@const url = dataUrl[chartType]}
	<a
		href={url?.replace?.('.cols.json', `.${format}`)}
		aria-label="Download the {metadata.label} {chartName} chart data as a {label} file"
		download="{indicator}.{format === 'csvw' ? 'csv-metadata.json' : format}"
		onclick={() => downloadEvent(format, metadata, chartType)}>{label}</a
	>
{/snippet}

{#snippet downloadLinks(chartType: string)}
	{@render downloadUrl(chartType, 'csv')},
	{@render downloadUrl(chartType, 'csvw')},
	{@render downloadUrl(chartType, 'xlsx')} or
	{@render downloadUrl(chartType, 'json', 'JSON-Stat')}
{/snippet}

<Observe bind:visible rootMargin={200}>
	<div id={indicator} class="indicator-row">
		<details class="indicator-header" bind:open={expanded}>
			<summary
				class="indicator-title"
				aria-controls="{indicator}-description"
				aria-expanded={expanded ? 'true' : 'false'}
			>
				<strong>{metadata.label}</strong>{metadata.subText ? `, ${metadata.subText}` : ''}
				<span class="ons-u-vh">Expand to show details and data for this indicator</span>
			</summary>
			<div id="{indicator}-description" class="indicator-description">
				{#if metadata.experimentalStatistic}
					<p>
						<Em color="#003c57">Official statistics in development</Em>
					</p>
				{/if}
				<p><strong>Definition:</strong> {metadata.description}</p>
				<p>
					<strong>{metadata.source.length > 1 ? 'Data sources' : 'Data source'}:</strong>
					{#each metadata.source as s, i}
						<a href={s.href} target="_blank"
							>{s.name}<span class="ons-u-vh"> (opens in a new tab)</span></a
						><span class="inline-icon ons-u-ml-3xs"><Icon type="external" /></span>
						({s.date.split('-').reverse().join('/')}){i === metadata.source.length - 1 ? '' : ', '}
					{/each}
				</p>
				{#if dataUrl.pyramid}
					<p><strong>Download data:</strong> {@render downloadLinks('pyramid')}.</p>
				{:else if dataUrl.beeswarm || dataUrl.sparkline}
					<p><strong>Download data:</strong></p>
					<ul>
						{#if dataUrl.beeswarm}
							<li>
								Distribution chart data as {@render downloadLinks('beeswarm')}.
							</li>
						{/if}
						{#if dataUrl.sparkline}
							<li>
								Line chart data as {@render downloadLinks('sparkline')}.
							</li>
						{/if}
					</ul>
				{/if}
				{#if !metadata.isMultivariate}
					<p>
						For more data and charts, visit our page on <a
							href={resolve(`/indicators/${metadata.slug}`)}>{metadata.label}</a
						>.
					</p>
				{/if}
			</div>
		</details>
		{#if indicator === 'population-by-age-and-sex'}
			{@const dataArgs = [
				visible && !hidden,
				indicator,
				timeRange,
				selected,
				geoGroup.geoLevel,
				geoGroup.geoExtent,
				geoGroup.geoCluster
			].slice(0, chartMode === 'simple' ? 4 : undefined)}
			<div class="indicator-pyramid">
				<ButtonGroup
					legend="Select areas to show on chart"
					visuallyHideLegend
					bind:value={chartMode}
				>
					<ButtonGroupItem value="simple" label="Show selected areas" />
					<ButtonGroupItem value="advanced" label="Show all areas" />
				</ButtonGroup>
				<ChartDataLoader
					id="{indicator} pyramid"
					dataUrl={dataUrl['pyramid']}
					noDataMessage="Chart data not available."
					{visible}
				>
					{#snippet chart(data)}
						<Pyramid {data} {formatValue} {formatPeriod} {selected} bind:hovered {valueDomain} />
					{/snippet}
				</ChartDataLoader>
			</div>
		{:else}
			<div class="indicator-charts">
				{#if !isMobile || selectedChart === 'beeswarm'}
					<div class="indicator-beeswarm">
						<ChartDataLoader
							id="{indicator} beeswarm"
							dataUrl={dataUrl['beeswarm']}
							noDataMessage="Chart data not available."
							{visible}
						>
							{#snippet chart(data)}
								<Beeswarm
									{data}
									{metadata}
									{formatPeriod}
									{formatValue}
									valuePrefix={metadata.prefix}
									valueSuffix={metadata.suffix}
									{showIntervals}
									{selected}
									bind:hovered
								/>
							{/snippet}
						</ChartDataLoader>
					</div>
				{/if}

				{#if !isMobile || selectedChart === 'sparkline'}
					<div class="indicator-sparkline">
						<ChartDataLoader
							id="{indicator} sparkline"
							dataUrl={dataUrl['sparkline']}
							noDataMessage="Time series data not available."
							{visible}
						>
							{#snippet chart(data)}
								<Sparkline
									{data}
									{metadata}
									{formatPeriod}
									{formatValue}
									valuePrefix={metadata.prefix}
									valueSuffix={metadata.suffix}
									{showIntervals}
									{selected}
								/>
							{/snippet}
						</ChartDataLoader>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</Observe>

<style>
	.indicator-charts {
		display: flex;
		flex-direction: row;
		gap: 2rem;
		width: 100%;
		height: 150px;
	}
	.indicator-beeswarm,
	.indicator-sparkline,
	.indicator-pyramid {
		position: relative;
	}
	.indicator-pyramid {
		min-height: 412px;
	}
	.indicator-pyramid :global(.button-group) {
		margin-top: 0.25rem;
	}
	.indicator-beeswarm {
		flex-grow: 1;
		max-width: 350px;
	}
	.indicator-sparkline {
		flex-shrink: 1;
		width: 300px;
	}

	@media (min-width: 768px) {
		.indicator-beeswarm {
			max-width: 470px;
		}
		.indicator-sparkline {
			width: 200px;
		}
	}
	.indicator-row :global(svg) {
		overflow: visible;
	}
	.indicator-title {
		cursor: pointer;
		list-style-type: none;
	}
	.indicator-title::after {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		content: 'i';
		width: 20px;
		height: 20px;
		margin-left: 6px;
		font-weight: bold;
		font-size: 14px;
		color: var(--ons-color-text-link);
		border: 2px solid currentColor;
		border-radius: 50%;
	}
	.indicator-title:focus::after,
	.indicator-title:hover::after {
		transform: scale(1.2);
		color: var(--ons-color-text-hover);
	}
	.indicator-description {
		margin: 10px 5px 20px;
		padding: 10px;
		background-color: var(--ons-color-banner-bg);
		border-left: solid;
		border-left-color: var(--ons-color-borders);
		border-left-width: 4px;
		line-height: 20px;
	}
	.indicator-description > p,
	.indicator-description > ul {
		font-size: 16px;
		margin: 0;
	}
	.indicator-description > p + p,
	.indicator-description > ul + p {
		margin-top: 1rem;
	}
	.indicator-description > p + ul {
		margin-top: 0.5em;
	}
	.indicator-header {
		scroll-margin-top: 116px;
	}
</style>
