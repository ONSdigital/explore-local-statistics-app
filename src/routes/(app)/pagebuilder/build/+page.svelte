<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import {
		Hero,
		Details,
		Container,
		Icon,
		Tab,
		Tabs,
		Textarea,
		Select,
		Button,
		Radios,
		Grid,
		GridCell,
		Divider
	} from '@onsvisual/svelte-components';
	import { makeDataUrl, makeValueFormatter, makePeriodFormatter, parsePeriod } from '$lib/utils';
	import Table from '$lib/components/charts/Table.svelte';
	import Spinner from '$lib/components/visuals/Spinner.svelte';
	import { findNearestSharedParent } from '$lib/api/geo/helpers/findNearestSharedParent';
	import syncedStore from '$lib/synced-store.svelte';
	import ComparisonRow from './ComparisonRow.svelte';
	import Line from '$lib/components/charts/Line.svelte';

	let taxData = $props();
	let selectedAreas = syncedStore('selectedAreas', []);
	let selectedIndicatorStore = syncedStore('selectedIndicator', null);
	let selection = $derived({
		areas: $selectedAreas.map((area) => area.areacd),
		indicator: $selectedIndicatorStore
	});
	let sharedParent = $derived(await findNearestSharedParent(selection.areas));

	let metadataUrl = $derived(
		selection.indicator ? resolve(`/api/v1/metadata/indicators/${selection.indicator.slug}`) : null
	);
	let metadata = $derived(metadataUrl ? await (await fetch(metadataUrl)).json() : null);

	let dataUrl = $derived(
		selection.indicator && selection.areas.length
			? makeDataUrl(selection.indicator.slug, 'all', null, selection.areas)
			: null
	);
	let data = $derived(dataUrl ? await (await fetch(dataUrl)).json() : null);

	let comparisonUrl = $derived(
		metadata?.standardised && selection.indicator && sharedParent && sharedParent.areacd
			? makeDataUrl(selection.indicator.slug, 'all', null, [sharedParent.areacd])
			: null
	);
	let comparisonData = $derived(comparisonUrl ? await (await fetch(comparisonUrl)).json() : null);

	let caveats = $derived(new MarkdownIt().render(metadata?.caveats[0]));
	let formatPeriod = $derived(makePeriodFormatter(metadata?.periodFormat || 'year'));
	let formatValue = $derived(makeValueFormatter(metadata?.decimalPlaces));

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
			selectedIndicatorStore.set({ slug: sharedIndicatorSlug });
		}
	});

	let clipped = $state(false);
	async function copyShareUrl() {
		await navigator.clipboard.writeText(shareUrl);
		clipped = true;
		setTimeout(() => (clipped = false), 2000);
	}

	let indicators = $derived(
		taxData.data.taxonomy.data.filter((ind) => ind.slug !== 'population-by-age-and-sex')
	);

	$effect(() => {
		if (!indicators.length) return;

		selectedIndicatorStore.ready.then(() => {
			if ($selectedIndicatorStore) return;
			$selectedIndicatorStore =
				indicators.find((indicator) => indicator.standardised) ?? indicators[0]; // this should(!?) select the first standardised indicator. we can discuss
		});
	});

	function selectIndicator(indicator) {
		$selectedIndicatorStore = indicator;
	}

	function removeIndicator() {
		$selectedIndicatorStore = null;
	}

	let selectedTheme = $state();
	let themeOptions = $derived(
		taxData.data.taxonomyNested.data.map((theme) => ({ ...theme, id: theme.slug }))
	);
	let indicatorOptions = $derived(
		selectedTheme?.children?.flatMap((child) =>
			child.description
				? [{ id: child.slug, label: child.label, slug: child.slug }]
				: (child.children ?? []).map((indicator) => ({
						id: indicator.slug,
						label: indicator.label,
						slug: indicator.slug
					}))
		) ?? []
	);
	let uniquePeriods = $derived(
		[...new Set([...(data?.period ?? []), ...(comparisonData?.period ?? [])])].sort(
			(a, b) => parsePeriod(a).getTime() - parsePeriod(b).getTime()
		)
	);
</script>

<Hero title="Compare areas" background="#eaeaea" height="200px">
	<div class="hero-text">
		<h4>Select areas</h4>
		<p>{[...new Set(data?.areacd)].length} areas selected</p>
		<p><a href="/pagebuilder">Change areas</a></p>
	</div>
</Hero>

<Container>
	<div class="indicator-select">
		<h4>Select an indicator</h4>
		<!-- <p>Search or browse for an indicator to compare across your selected areas.</p> -->
		<div class="select-container">
			<Select
				label=""
				placeholder="Search for an indicator"
				labelKey="label"
				groupKey="topic"
				autoClear={false}
				clearable={false}
				options={indicators}
				on:change={(e) => selectIndicator(e.detail)}
				on:clear={removeIndicator}
			></Select>
		</div>
		<Details title="Show all indicators">
			<Grid width="wide" colWidth="wide">
				<GridCell>
					<Radios
						label="Select a theme"
						id="themes"
						items={themeOptions}
						bind:value={selectedTheme}
						compact
					></Radios>
				</GridCell>
				{#if selectedTheme}
					<GridCell>
						<Radios
							label="Select an indicator"
							id="indicators"
							items={indicatorOptions}
							bind:value={$selectedIndicatorStore}
							compact
						></Radios>
					</GridCell>
				{/if}
			</Grid>
		</Details>
	</div>
	<Divider margin-top={false}></Divider>
	{#if data && !data.message}
		<div class="indicator-info">
			<h2>{selection?.indicator?.label}</h2>
			<p class="content-subtitle">
				{metadata?.subtitle}, {formatPeriod(uniquePeriods[0])}{#if uniquePeriods.length > 1}to {formatPeriod(
						uniquePeriods[uniquePeriods.length - 1]
					)}{/if}.
				<a href="/indicators/{selection.indicator.slug}">Explore this indicator</a>
			</p>
		</div>
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
	{/if}

	<div
		style:margin-bottom="20px"
		style:margin-top="32px"
		style:min-height="84px"
		style:position="relative"
	>
		{#if data && !data.message}
			<!-- <Tabs>
				<Tab title="Comparison chart"> -->
			<ComparisonRow {data} {metadata} {comparisonData} {formatValue} {formatPeriod} />
			<!-- </Tab> -->
			<!-- <Tab title="Line chart"> -->
			<!-- <Line {data} {metadata} {formatValue} {formatPeriod} showIntervals={true}></Line> -->
			<!-- </Tab> -->
			<!-- <Tab title="Bar chart"></Tab> -->
			<!-- </Tabs> -->
		{:else if data && data.message}
			<div class="no-data">
				<p>No {selection.indicator.label} data available for the selected areas.</p>
			</div>
		{:else}
			<Spinner message="Loading chart data" />
		{/if}
	</div>
	{#if data && !data.message}
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
	.indicator-select {
		margin-top: 20px;
	}
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
		/* margin-top: 20px; */
		gap: 20px;
		justify-content: space-around;
	}

	.header-details {
		display: flex;
		margin-top: 10px;
		margin-bottom: 20px;
		font-size: 16px;
		justify-content: flex-end;
		gap: 10px;
	}

	.indicator-info {
		margin-top: 20px;
	}
	.select-container {
		margin-top: 1em;
		margin-bottom: 20px;
		width: 500px;
	}
</style>
