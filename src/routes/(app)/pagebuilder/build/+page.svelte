<script lang="ts">
	import MarkdownIt from 'markdown-it';
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
		Icon
	} from '@onsvisual/svelte-components';
	import { makeDataUrl, makeValueFormatter, makePeriodFormatter } from '$lib/utils';
	import Table from '$lib/components/charts/Table.svelte';
	import Spinner from '$lib/components/visuals/Spinner.svelte';
	import { findNearestSharedParent } from '$lib/api/geo/helpers/findNearestSharedParent';
	import ComparisonRow from './ComparisonRow.svelte';

	let selection = $state({ areas: [], indicator: null });
	let sharedParent = $state(null);

	$effect(async () => {
		sharedParent = await findNearestSharedParent(selection.areas);
	});

	$effect(() => {
		const stored = sessionStorage.getItem('pagebuilder-selection');
		if (stored) selection = JSON.parse(stored);
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

	let comparisonUrl = $derived(
		selection.indicator && sharedParent && sharedParent.areacd
			? makeDataUrl(selection.indicator.slug, 'all', null, [sharedParent.areacd])
			: null
	);

	let metadata = $state(null);
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
	$effect(async () => await fetchComparisonData(comparisonUrl));

	let caveats = $derived(new MarkdownIt().render(metadata?.caveats[0]));
</script>

<Hero title="Multi area comparison" background="#eaeaea">
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
			<Container>
				<h2>{selection?.indicator?.label}</h2>
				<p class="content-subtitle">
					{metadata?.description}
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
					<div>
						Comparison area: {comparisonData?.areanm[0]}
					</div>
					<div>
						<!-- this will open selection palette for just comparison area -->
						<a>Change</a>
					</div>
				</div>
			</Container>
			<ComparisonRow {data} {metadata} {comparisonData} {formatValue} {formatPeriod} />
		{:else if data && data.message}
			<div class="no-data">
				<p>No {selection.indicator.label} data available for the selected areas.</p>
			</div>
		{:else}
			<Spinner message="Loading chart data" />
		{/if}
	</div>
	{#if data && !data.message}
		{#if metadata?.caveats.length > 0}
			<Container>
				<h2>Interpretation</h2>
				<p>{@html caveats}</p>
			</Container>
		{/if}

		<Container>
			<h2>Get the data</h2>
			<p>
				The original source data for this indicator can be found on the following
				{metadata?.source.length > 1 ? 'pages' : 'page'}:
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
		</Container>
	{/if}
</Container>

<style>
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
