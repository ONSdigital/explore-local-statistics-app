<script lang="ts">
	import { resolve } from '$app/paths';
	import snapdom from '@zumer/snapdom';
	import { Icon, Textarea, Button } from '@onsvisual/svelte-components';

	let {
		indicator,
		metadata,
		timeRange,
		selected = [],
		geoLevel = null,
		showIntervals = false,
		chartType,
		chartDiv,
		dataUrl
	} = $props();

	let showEmbed = $state(false);
	let embedCode = $derived(
		makeEmbedCode(indicator, metadata, timeRange, selected, geoLevel, chartType, showIntervals)
	);
	let clipped = $state(false);

	function makeEmbedCode(
		indicator: string,
		metadata: any,
		timeRange: [string, string],
		selected: string[],
		geoLevel: object | string | null,
		chartType: string,
		showIntervals: boolean
	) {
		const multiTime = ['line', 'table'].includes(chartType) && timeRange[0] !== timeRange[1];

		const chunks = [];
		if (geoLevel) chunks.push({ key: 'geo', value: geoLevel?.id || geoLevel });
		if (selected.length) chunks.push({ key: 'areas', value: selected.join(',') });
		chunks.push({
			key: 'years',
			value: timeRange
				.slice(multiTime ? 0 : 1)
				.map((t) => t.slice(0, 10))
				.join(',')
		});
		if (showIntervals) chunks.push({ key: 'intervals', value: 'true' });
		const url = `https://www.ons.gov.uk/explore-local-statistics/indicators/${indicator}/embed?type=${chartType}&${chunks.map((c) => `${c.key}=${c.value}`).join('&')}`;
		const id = `${chartType}-${indicator}`;
		return (
			`<div id="${id}"></div>
<scr` +
			`ipt src="https://cdn.ons.gov.uk/vendor/pym/1.3.2/pym.min.js"></scr` +
			`ipt>
<scr` +
			`ipt>var pymParent = new pym.Parent("${id}", "${url}", {name: "${id}", title: "${metadata.label}"});</scr` +
			`ipt>`
		);
	}

	async function copyEmbedCode() {
		await navigator.clipboard.writeText(embedCode);
		clipped = true;
	}

	async function downloadPNG(e) {
		e.preventDefault();
		const result = await snapdom(chartDiv);
		await result.download({ format: 'png', filename: `${indicator}-${chartType}.png` });
	}
</script>

{#snippet downloadUrl(url: string, format: string, formatLabel: string | null = null)}
	{@const label = formatLabel || format.toUpperCase()}
	<a href={url?.replace?.('.cols.json', `.${format}`)} download="{indicator}-{chartType}.{format}"
		>{label}</a
	>
{/snippet}

{#snippet downloadLinks(url: string)}
	{@render downloadUrl(url, 'csv')},
	{@render downloadUrl(url, 'csvw')},
	{@render downloadUrl(url, 'xlsx')} or
	{@render downloadUrl(url, 'json', 'JSON-Stat')}
{/snippet}

<div class="chart-actions">
	<h4 class="chart-actions-label">Use and share</h4>
	<ul class="chart-actions-list">
		<li>
			<Icon type="download" />
			Download as
			{#if chartDiv && chartType !== 'table'}
				<a href="#0" onclick={downloadPNG}>PNG</a>,
			{/if}
			{@render downloadLinks(dataUrl)}
		</li>
		<li>
			<Icon type="code" />
			<button
				class="ons-btn-link"
				aria-controls="{chartType}-embed"
				aria-expanded={showEmbed ? 'false' : 'true'}
				onclick={() => (showEmbed = !showEmbed)}
				>{showEmbed ? 'Hide embed code' : 'Show embed code'}</button
			>
		</li>
	</ul>
	<div
		id="{chartType}-embed"
		class="chart-embed"
		style:display={showEmbed ? 'block' : 'none'}
		spellcheck="false"
	>
		<Textarea label="Embed code" value={embedCode} hideLabel />
		<Button variant={clipped ? 'secondary' : 'primary'} on:click={copyEmbedCode} small
			>{clipped ? 'Code copied' : 'Copy embed code'}</Button
		>
	</div>
</div>

<style>
	.chart-actions {
		background: var(--ons-color-banner-bg);
		padding: 0.5rem;
		margin-bottom: 1rem;
	}
	.chart-actions-label {
		margin: 0;
		font-size: 16px;
	}
	.chart-actions-list {
		list-style-type: none;
		margin: 0;
		padding: 0;
		font-size: 16px;
	}
	.chart-actions-list > li {
		margin: 0;
		display: inline-block;
	}
	.chart-actions-list > li + li {
		margin-left: 0.75rem;
	}
	.chart-embed :global(.ons-input--textarea) {
		margin: 0.5rem 0;
		font-size: 16px;
		line-height: 1.3;
		max-width: 100%;
		resize: none;
	}
</style>
