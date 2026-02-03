<script lang="ts">
	import { resolve } from '$app/paths';
	import { Observe, Em, ButtonGroup, ButtonGroupItem } from '@onsvisual/svelte-components';
	import { makeDataUrl, makeValueFormatter, makePeriodFormatter } from '$lib/utils';
	import Beeswarm from '$lib/components/charts/Beeswarm.svelte';
	import Sparkline from '$lib/components/charts/Sparkline.svelte';
	import Pyramid from '$lib/components/charts/Pyramid.svelte';
	import ChartDataLoader from '$lib/components/charts/ChartDataLoader.svelte';

	let {
		indicator,
		metadata,
		timeRange,
		selected = [],
		geoGroup,
		hovered = $bindable(),
		hidden = null
	} = $props();

	let visible = $state(false);
	let formatValue = $derived(makeValueFormatter(metadata.decimalPlaces));
	let formatPeriod = $derived(makePeriodFormatter(metadata.periodFormat));

	let chartMode = $state('simple');

	const chartTypes =
		indicator === 'population-by-age-and-sex' ? ['pyramid'] : ['beeswarm', 'sparkline'];

	let dataUrl = $derived(
		Object.fromEntries(
			chartTypes.map((key) => {
				const args =
					key === 'sparkline'
						? [indicator, timeRange, null, selected]
						: key === 'beeswarm'
							? [
									indicator,
									timeRange[1],
									'latest',
									selected,
									geoGroup.geoLevel,
									geoGroup.geoExtent,
									geoGroup.geoCluster
								]
							: chartMode === 'advanced'
								? [
										indicator,
										timeRange[1],
										'latest',
										selected,
										geoGroup.geoLevel,
										geoGroup.geoExtent,
										geoGroup.geoCluster,
										{ sex: ['female', 'male'] }
									]
								: [
										indicator,
										timeRange[1],
										'latest',
										selected,
										null,
										null,
										null,
										{ sex: ['female', 'male'] }
									];
				return [key, makeDataUrl(...args)];
			})
		)
	);
</script>

{#snippet downloadUrl(url, format, formatLabel = null)}
	{@const label = formatLabel || format.toUpperCase()}
	<a href={url?.replace?.('.cols.json', `.${format}`)} download="{indicator}.{format}">{label}</a>
{/snippet}

{#snippet downloadLinks(chartType)}
	{@render downloadUrl(dataUrl[chartType], 'csv')},
	{@render downloadUrl(dataUrl[chartType], 'csvw')},
	{@render downloadUrl(dataUrl[chartType], 'xlsx')} or
	{@render downloadUrl(dataUrl[chartType], 'json', 'JSON-Stat')}
{/snippet}

<Observe bind:visible rootMargin={200}>
	<div id={indicator} class="indicator-row">
		<details class="indicator-header">
			<summary class="indicator-title"
				><strong>{metadata.label}</strong>{metadata.subText ? `, ${metadata.subText}` : ''}</summary
			>
			<div class="indicator-description">
				{#if metadata.experimentalStatistic}
					<p>
						<Em color="#003c57">Official statistics in development</Em>
					</p>
				{/if}
				<p><strong>Definition:</strong> {metadata.description}</p>
				<p>
					<strong>{metadata.source.length > 1 ? 'Data sources' : 'Data source'}:</strong>
					{#each metadata.source as s, i}
						<a href={s.href} target="_blank">{s.name}</a>
						({s.date.split('-').reverse().join('/')}){i === metadata.source.length - 1 ? '' : ', '}
					{/each}
				</p>
				{#if indicator === 'population-by-age-and-sex'}
					<p><strong>Download data:</strong> {@render downloadLinks('pyramid')}.</p>
				{:else}
					<p><strong>Download data:</strong></p>
					<ul>
						<li>
							Beeswarm data as {@render downloadLinks('beeswarm')}.
						</li>
						<li>
							Line chart data as {@render downloadLinks('sparkline')}.
						</li>
					</ul>
				{/if}
				<p>
					For more data and charts, visit our page on <a
						href={resolve(`/indicators/${metadata.slug}`)}>{metadata.label}</a
					>.
				</p>
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
				<ChartDataLoader id="{indicator} pyramid" dataUrl={dataUrl['pyramid']} {visible}>
					{#snippet chart(data)}
						<Pyramid {data} {formatValue} {selected} bind:hovered />
					{/snippet}
				</ChartDataLoader>
			</div>
		{:else}
			<div class="indicator-charts">
				<div class="indicator-beeswarm">
					<ChartDataLoader id="{indicator} beeswarm" dataUrl={dataUrl['beeswarm']} {visible}>
						{#snippet chart(data)}
							<Beeswarm
								{data}
								{formatPeriod}
								{formatValue}
								valuePrefix={metadata.prefix}
								valueSuffix={metadata.suffix}
								{selected}
								bind:hovered
							/>
						{/snippet}
					</ChartDataLoader>
				</div>
				<div class="indicator-sparkline">
					<ChartDataLoader id="{indicator} sparkline" dataUrl={dataUrl['sparkline']} {visible}>
						{#snippet chart(data)}
							<Sparkline
								{data}
								{formatPeriod}
								{formatValue}
								valuePrefix={metadata.prefix}
								valueSuffix={metadata.suffix}
								{selected}
							/>
						{/snippet}
					</ChartDataLoader>
				</div>
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
		max-width: 470px;
	}
	.indicator-sparkline {
		flex-shrink: 1;
		width: 200px;
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
