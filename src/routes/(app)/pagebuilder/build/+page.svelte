<script lang="ts">
	// @ts-nocheck
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
		Divider,
		Tooltip
	} from '@onsvisual/svelte-components';
	import { makeDataUrl, makeValueFormatter, makePeriodFormatter, parsePeriod } from '$lib/utils';
	import Spinner from '$lib/components/visuals/Spinner.svelte';
	import { findNearestSharedParent } from '$lib/api/geo/helpers/findNearestSharedParent';
	import { getContext, onMount } from 'svelte';
	import ComparisonRow from './ComparisonRow.svelte';
	import Line from '$lib/components/charts/Line.svelte';
	import { getAreaType } from '$lib/utils';
	import AreasModal from '$lib/components/modals/AreasModal.svelte';

	let taxData = $props();
	let areas = $derived(
		taxData?.data.areas.map((area) => ({ ...area, type: getAreaType(area) || '' }))
	);

	let selectedAreas = getContext('selectedAreas')();
	let selectedIndicator = getContext('selectedIndicator')();
	let chosenComparisonArea = getContext('chosenComparisonArea')();
	let selection = $derived({
		areas: $selectedAreas.map((area) => area.areacd),
		indicator: $selectedIndicator
	});

	let modalPageState = $state({
		selectedAreas: $selectedAreas,
		selectedComparisonArea: $chosenComparisonArea
	});

	$effect(() => {
		chosenComparisonArea.set(modalPageState.selectedComparisonArea);
	});

	async function getData(indicator, areas, chosenComparisonArea = null) {
		const comparisonArea =
			chosenComparisonArea != null ? chosenComparisonArea : await findNearestSharedParent(areas);
		const dataUrl =
			indicator && areas.length
				? makeDataUrl(indicator.slug, 'all', null, [
						...new Set([...areas, ...(comparisonArea?.areacd ? [comparisonArea.areacd] : [])])
					])
				: null;
		const data = dataUrl ? await (await fetch(dataUrl)).json() : null;
		const metadataUrl = indicator ? resolve(`/api/v1/metadata/indicators/${indicator.slug}`) : null;
		const metadata = metadataUrl ? await (await fetch(metadataUrl)).json() : null;

		return { data, dataUrl, comparisonArea, metadata };
	}

	let { data, dataUrl, comparisonArea, metadata } = $derived(
		await getData(selection.indicator, selection.areas, $chosenComparisonArea)
	);

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
		browser ? makeShareUrl(selection.areas, selection.indicator, comparisonArea?.areacd) : ''
	);

	async function getSharedFromHash() {
		const hash = window.location.hash;
		if (!hash || hash === '#') return;

		const params = new URLSearchParams(hash.replace(/^#\??/, ''));
		const sharedAreaCodes = params.get('areas')?.split(',').filter(Boolean);
		const sharedIndicatorSlug = params.get('indicator');
		const sharedComparisonCode = params.get('comparison');

		const lookupUrl = resolve('/api/v1/geo/list?asLookup=true');
		const lookup = await (await fetch(lookupUrl)).json();

		let hashValid = false;

		if (sharedAreaCodes?.length) {
			const sharedAreas = sharedAreaCodes
				.map((areacd) => lookup[areacd])
				.filter(Boolean)
				.map((area) => ({ ...area, type: getAreaType(area) || 'null' }));

			if (sharedAreas.length) {
				selectedAreas.set(sharedAreas);
				hashValid = true;
			}
		}

		if (sharedComparisonCode) {
			const sharedComparison = sharedComparisonCode
				.map((areacd) => lookup[areacd])
				.fitler(Boolean)
				.map((area) => ({ ...area, type: getAreaType(area) || 'null' }));
			if (sharedComparison) {
				chosenComparisonArea.set(sharedComparison);
			}
		}

		if (sharedIndicatorSlug) {
			const sharedIndicator = indicators.find((ind) => ind.slug === sharedIndicatorSlug);
			if (sharedIndicator) {
				selectedIndicator.set(sharedIndicator);
				hashValid = true;
			}
		}

		if (!hashIsValid) {
			history.replaceState(null, '', window.location.pathname + window.location.search);
		}
	}

	onMount(async () => {
		if (!$selectedIndicator) $selectedIndicator = indicators[1];
		await getSharedFromHash();
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

	function selectIndicator(indicator) {
		$selectedIndicator = indicator;
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
		[...new Set([...(data?.period ?? [])])].sort(
			(a, b) => parsePeriod(a).getTime() - parsePeriod(b).getTime()
		)
	);
	$inspect(data);
</script>

<Hero title="Compare areas" background="#eaeaea" height="200px">
	<div class="hero-text">
		<h4>Select areas</h4>
		<p>{selection.areas?.length} areas selected</p>
		<p><a href="/pagebuilder">Change areas</a></p>
	</div>
</Hero>

<Container>
	<div class="indicator-select">
		<h4>Select an indicator</h4>
		<div class="select-container">
			<Select
				label=""
				placeholder="Search for an indicator"
				labelKey="label"
				groupKey="topic"
				autoClear={false}
				options={indicators}
				on:change={(e) => selectIndicator(e.detail)}
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
							bind:value={$selectedIndicator}
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
				{metadata?.subtitle}, {formatPeriod(uniquePeriods[0])}
				{#if uniquePeriods.length > 1}
					to {formatPeriod(uniquePeriods[uniquePeriods.length - 1])}{/if}.
				<a href="/indicators/{selection.indicator.slug}">Explore this indicator</a>
			</p>
		</div>

		<div class="header-details">
			{#if data.uci_95 && data.lci_95}
				<div>
					Shaded bands show 95% confidence interval <a style:font-weight="bold">&#9432</a>
				</div>
			{/if}
			<div class="legend-modals">
				{#if metadata.standardised}
					<AreasModal mode="comparison" {data} bind:pageState={modalPageState} areaslist={areas} />
				{:else}
					<p>Comparison area disabled for non-standardised indicator.</p>
				{/if}
			</div>
		</div>

		{#if ![...new Set(data?.areacd)].includes(comparisonArea.areacd)}
			<div class="missing-data-message">
				<!-- Comparison data unavailable for {comparisonArea.areanm} -->
				Data unavailable for selected comparison area.
			</div>
		{/if}
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
			{#key selection.indicator?.slug}
				<ComparisonRow
					{data}
					{metadata}
					selectedAreas={$selectedAreas}
					{comparisonArea}
					{formatValue}
					{formatPeriod}
				/>
			{/key}
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

	.missing-data-message {
		font-size: 16px;
		gap: 10px;
		font-weight: bold;
		float: right;
		margin-top: -10px;
		margin-bottom: 10px;
	}

	.header-details {
		display: flex;
		margin-top: 10px;
		margin-bottom: 20px;
		font-size: 16px;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
	}

	.legend-modals {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-left: auto;
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
