<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import {
		Hero,
		Section,
		NavSection,
		Container,
		NavSections,
		Grid,
		List,
		Li,
		Icon,
		Tab,
		Tabs,
		Textarea,
		Button
	} from '@onsvisual/svelte-components';
	import { makeDataUrl, makeValueFormatter, makePeriodFormatter } from '$lib/utils';
	import Table from '$lib/components/charts/Table.svelte';
	import Spinner from '$lib/components/visuals/Spinner.svelte';
	import { findNearestSharedParent } from '$lib/api/geo/helpers/findNearestSharedParent';
	import syncedStore from '$lib/synced-store.svelte';
	import ComparisonRow from './ComparisonRow.svelte';
	import Line from '$lib/components/charts/Line.svelte';

	let selectedAreas = syncedStore('selectedAreas', []);
	let selectedIndicator = syncedStore('selectedIndicator', null);
	let selection = $derived({
		areas: $selectedAreas.map((area) => area.areacd),
		indicator: $selectedIndicator
	});
	let sharedParent = $state(null);

	$effect(async () => {
		sharedParent = await findNearestSharedParent(selection.areas);
	});

	let data: jsonDataCols | errorObject | null = $state.raw(null);
	async function fetchData(dataUrl: string) {
		try {
			if (dataUrl) data = await (await fetch(dataUrl)).json();
			return data;
		} catch {
			return null;
		}
	}

	async function fetchComparisonData(dataUrl: string) {
		try {
			if (dataUrl) comparisonData = await (await fetch(dataUrl)).json();
			return comparisonData;
		} catch {
			return null;
		}
	}

	let comparisonData: jsonDataCols | errorObject | null = $state.raw(null);

	let dataUrl = $derived(
		selection.indicator && selection.areas.length
			? makeDataUrl(selection.indicator.slug, 'all', null, selection.areas)
			: null
	);

	let metadata = $state(null);
	let comparisonUrl = $derived(
		metadata?.standardised && selection.indicator && sharedParent && sharedParent.areacd
			? makeDataUrl(selection.indicator.slug, 'all', null, [sharedParent.areacd])
			: null
	);
	let metadataUrl = $derived(
		selection.indicator ? resolve(`/api/v1/metadata/indicators/${selection.indicator.slug}`) : null
	);
	let formatPeriod = $derived(makePeriodFormatter(metadata?.periodFormat || 'year'));
	let formatValue = $derived(makeValueFormatter(metadata?.decimalPlaces));

	$effect(async () => {
		if (!metadataUrl) {
			metadata = null;
			return;
		}
		try {
			const res = await fetch(metadataUrl);
			metadata = res.ok ? await res.json() : null;
		} catch {
			metadata = null;
		}
	});

	$effect(async () => await fetchData(dataUrl));
	$effect(async () => {
		if (!comparisonUrl) {
			comparisonData = null;
			return;
		}
		await fetchComparisonData(comparisonUrl);
	});

	let caveats = $derived(new MarkdownIt().render(metadata?.caveats[0]));

	function makeShareUrl(areas, indicator, comparisonAreacd) {
		const chunks = [];
		if (areas.length) chunks.push({ key: 'areas', value: areas.join(',') });
		if (indicator?.slug) chunks.push({ key: 'indicator', value: indicator.slug });
		if (comparisonAreacd) chunks.push({ key: 'comparison', value: comparisonAreacd });

		return `${window.location.origin}${resolve('/pagebuilder/build')}#?${chunks
			.map((c) => `${c.key}=${c.value}`)
			.join('&')}`;
	}

	let shareUrl = $derived(
		browser ? makeShareUrl(selection.areas, selection.indicator, sharedParent?.areacd) : ''
	);

	$effect(() => {
		const hash = window.location.hash;
		if (!hash || hash === '#') return; // nothing to parse, fall through to IndexedDB state as normal

		const params = new URLSearchParams(hash.replace(/^#\??/, ''));
		const sharedAreas = params.get('areas')?.split(',').filter(Boolean);
		const sharedIndicatorSlug = params.get('indicator');

		if (sharedAreas?.length) {
			selectedAreas.set(sharedAreas.map((areacd) => ({ areacd, areanm: areacd, type: '' })));
		}
		if (sharedIndicatorSlug) {
			selectedIndicator.set({ slug: sharedIndicatorSlug });
		}
	});

	let clipped = $state(false);
	async function copyShareUrl() {
		await navigator.clipboard.writeText(shareUrl);
		clipped = true;
		setTimeout(() => (clipped = false), 2000);
	}
</script>

<Hero title="Compare areas" background="#eaeaea">
	<div class="hero-text">
		<p>{[...new Set(data?.areacd)].length} areas selected</p>
		<p>
			<a href="/pagebuilder"><Icon type="arrow" rotation="180"></Icon> Back to area selection</a>
		</p>
	</div>
</Hero>

<Container>
	<div
		style:margin-bottom="20px"
		style:margin-top="32px"
		style:min-height="84px"
		style:position="relative"
	>
		{#if data && !data.message}
			<div>
				<h2>{selection?.indicator?.label}</h2>
				<p class="content-subtitle">
					{metadata?.description}
					<a href="/indicators/{selection.indicator.slug}">Explore this indicator</a>
				</p>
				<p style:font-weight="bold">
					<!-- this will open indicator selection modal -->
					<a
						>Change indicator
						<Icon type="carret"></Icon></a
					>
				</p>
				<div class="header-details">
					{#if data.uci_95 && data.lci_95}
						<div>
							Blue band shows 95% confidence interval <a style:font-weight="bold">&#9432</a>
						</div>
					{/if}
					{#if comparisonData}
						<div>
							Comparison area: {comparisonData?.areanm[0]}
						</div>
						<div>
							<!-- this will open selection palette for just comparison area -->
							<a>Change</a>
						</div>
					{/if}
				</div>
			</div>
			<Tabs>
				<Tab title="Comparison chart">
					<ComparisonRow {data} {metadata} {comparisonData} {formatValue} {formatPeriod} /></Tab
				>
				<Tab title="Line chart">
					<!-- <Line {data} {metadata} {formatValue} {formatPeriod} showIntervals={true}></Line> -->
				</Tab>
				<Tab title="Bar chart"></Tab>
			</Tabs>
		{:else if data && data.message}
			<div class="no-data">
				<p>No {selection.indicator.label} data available for the selected areas.</p>
			</div>
		{:else}
			<Spinner message="Loading chart data" />
		{/if}
	</div>
	{#if data && !data.message}
		<!-- {#if metadata?.caveats.length > 0}
			<div class="caveats">
				<h2>Interpretation</h2>
				<p>{@html caveats}</p>
			</div>
		{/if} -->

		<div class="get data">
			<p>
				Source:
				{#each metadata?.source as s, i}
					<a href={s.href} target="_blank"
						>{s.name}<span class="ons-u-vh"> (opens in a new tab)</span></a
					><span class="inline-icon ons-u-ml-3xs"><Icon type="external" /></span>{i ===
					metadata?.source.length - 1
						? '.'
						: i === metadata?.source.length - 2
							? ' and '
							: ', '}
				{/each}
			</p>
		</div>
	{/if}
	<div class="share-link">
		<h4>Share this page</h4>
		<Textarea label="Shareable URL" value={shareUrl} hideLabel readonly rows="1" />
		<Button variant={clipped ? 'secondary' : 'primary'} on:click={copyShareUrl} small>
			{clipped ? 'Link copied' : 'Copy link'}
		</Button>
	</div>
</Container>

<style>
	.share-link :global(.ons-input--textarea) {
		margin: 0.5rem 0;
		font-size: 16px;
		line-height: 1.3;
		max-width: 100%;
		resize: none;
	}
	.hero-text {
		display: flex;
		align-items: center;
		margin-top: 20px;
		gap: 20px;
	}

	.header-details {
		display: flex;
		margin-top: 50px;
		margin-bottom: 20px;
		font-size: 16px;
		justify-content: flex-end;
		gap: 10px;
	}
</style>
