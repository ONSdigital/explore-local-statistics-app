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
		Radio,
		Radios,
		Grid,
		GridCell,
		Divider,
		Tooltip,
		Section,
		Accordion,
		AccordionItem
	} from '@onsvisual/svelte-components';
	import { makeDataUrl, makeValueFormatter, makePeriodFormatter, parsePeriod } from '$lib/utils';
	import Spinner from '$lib/components/visuals/Spinner.svelte';
	import { findNearestSharedParent } from '$lib/api/geo/helpers/findNearestSharedParent';
	import { getContext, onMount } from 'svelte';
	import ComparisonRow from './ComparisonRow.svelte';
	import Line from '$lib/components/charts/Line.svelte';
	import { getAreaType } from '$lib/utils';
	import AreasModal from '$lib/components/modals/AreasModal.svelte';
	import OptionsModal from '$lib/components/modals/OptionsModal.svelte';
	import { Checkbox } from '@onsvisual/svelte-components';
	import SidebarLayout from '$lib/components/SidebarLayout.svelte';
	import { geoLevels } from '$lib/config/geoLevels.ts';
	import { pluralise } from '@onsvisual/robo-utils';

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

	let modalPageState = $state({
		selectedAreas: $selectedAreas,
		selectedComparisonArea: $chosenComparisonArea
	});

	let timePageState = $state({
		selectedPeriodRange: [null, null],
		formatPeriod: () => formatPeriod
	});

	$effect(() => {
		chosenComparisonArea.set(modalPageState.selectedComparisonArea);
	});

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
			const area = lookup[sharedComparisonCode];
			if (area) {
				const sharedComparison = { ...area, type: getAreaType(area) || 'null' };
				chosenComparisonArea.set(sharedComparison);
				modalPageState.selectedComparisonArea = sharedComparison;
			}
		}

		if (sharedIndicatorSlug) {
			const sharedIndicator = indicators.find((ind) => ind.slug === sharedIndicatorSlug);
			if (sharedIndicator) {
				selectedIndicator.set(sharedIndicator);
				hashValid = true;
			}
		}

		if (!hashValid) {
			history.replaceState(null, '', window.location.pathname + window.location.search);
		}
	}
	onMount(async () => {
		$selectedIndicator =
			indicators.find((indicator) => indicator.slug === $selectedIndicator?.slug) ?? indicators[1];
		await getSharedFromHash();
	});

	let clipped = $state(false);
	async function copyShareUrl() {
		await navigator.clipboard.writeText(shareUrl);
		clipped = true;
		setTimeout(() => (clipped = false), 2000);
	}

	let indicators = $derived(
		taxData.data.taxonomy.data
			.filter((ind) => ind.slug !== 'population-by-age-and-sex')
			.map((ind) => ({ ...ind, id: ind.slug }))
	);

	function selectIndicator(indicator) {
		$selectedIndicator = indicator;
	}

	let openTheme = $state(null);
	let openSubtopic = $state(null);

	// add id into taxdata to be used by radios
	let themeOptions = $derived(
		taxData.data.taxonomyNested.data.map((theme) => ({
			...theme,
			id: theme.slug,
			children: theme.children.map((child) => ({
				...child,
				id: child.slug,
				children: child.children?.map((indicator) => ({
					...indicator,
					id: indicator.slug
				}))
			}))
		}))
	);

	const toRadioItems = (items) => items.map(({ id, label }) => ({ id, label }));

	let indicatorLookup = $derived(
		Object.fromEntries(
			themeOptions.flatMap((theme) =>
				theme.children.flatMap((child) =>
					child.children ? child.children.map((i) => [i.slug, i]) : [[child.slug, child]]
				)
			)
		)
	);
	const setSelected = (slug) => ($selectedIndicator = indicatorLookup[slug]);

	let uniquePeriods = $derived(
		[...new Set([...(data?.period ?? [])])].sort(
			(a, b) => parsePeriod(a).getTime() - parsePeriod(b).getTime()
		)
	);
	let hasSelectedAreaData = $derived(
		data?.areacd?.some(
			(areacd, index) => selection.areas.includes(areacd) && data.value?.[index] != null
		) ?? false
	);
	let comparisonHasSelectedPeriodData = $derived.by(() => {
		const sel = timePageState.selectedPeriodRange?.[1];
		if (!data?.areacd || !sel || !comparisonArea?.areacd) return true;

		const selectedLabel = formatPeriod(sel);

		return data.areacd.some(
			(cd, i) =>
				cd === comparisonArea.areacd &&
				data.value?.[i] != null &&
				formatPeriod(data.period[i]) === selectedLabel
		);
	});

	$effect(() => {
		if (!uniquePeriods.length) return;
		if (!uniquePeriods.includes(timePageState.selectedPeriodRange[1])) {
			timePageState.selectedPeriodRange = [
				uniquePeriods[0],
				uniquePeriods[uniquePeriods.length - 1]
			];
		}
	});

	let filteredData = $derived.by(() => {
		if (!data || data.message || !data.period) return data;

		const end = timePageState.selectedPeriodRange?.[1];
		if (!end) return data;

		const endTime = parsePeriod(end).getTime();
		const endLabel = formatPeriod(end);

		const keep = data.period.map(
			(p) => parsePeriod(p).getTime() <= endTime || formatPeriod(p) === endLabel
		);

		const out = {};
		for (const [key, val] of Object.entries(data)) {
			out[key] =
				key !== 'periods' && Array.isArray(val) && val.length === data.period.length
					? val.filter((_, i) => keep[i])
					: val;
		}
		return out;
	});

	let sidebarOpen = $state(true);

	const periodLabels = {
		'1-year': '1-year period',
		'2-year': '2-year period',
		'3-year': '3-year period',
		'4-year': '4-year period',
		'academic-year': 'academic year',
		'financial-year': 'financial year'
	};

	// const geographyLevelLabels = $derived.by(() => {
	// 	const labels = metadata.geography.levels.map(
	// 		(level) => pluralise(geoLevels[level]?.label.toLowerCase()) ?? level
	// 	);

	// 	return [labels.slice(0, -1).join(', '), labels.slice(-1)[0]].join(
	// 		labels.length < 2 ? '' : ', and '
	// 	);
	// });
	const geographyLevelLabels = $derived(
		new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(
			metadata.geography.levels.map(
				(level) => pluralise(geoLevels[level]?.label.toLowerCase()) ?? level
			)
		)
	);

	const countryLookup = {
		E: { label: 'England' },
		S: { label: 'Scotland' },
		N: { label: 'Northern Ireland' },
		W: { label: 'Wales' }
	};

	const countryLevelLabels = $derived(
		new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(
			metadata.geography.countries.map((country) => countryLookup[country]?.label ?? country)
		)
	);

	let highlightedArea = $state(null);
</script>

{#snippet indicatorRadios(id, items)}
	<Radios
		cls={'indicator-radios'}
		{id}
		items={toRadioItems(items)}
		value={$selectedIndicator}
		on:change={(e) => setSelected(e.detail.value.id)}
		compact
	/>
{/snippet}
<!-- <Section width={'wider'} cls={'fake-hero'}> -->
<div class="fake-hero">
	<Container width={'wider'}>
		<div class="hero-text">
			<h1>Compare areas</h1>
			<div class="hero-area-details">
				<h4>{selection.areas?.length} areas selected</h4>
				<p><a href="/pagebuilder">Change areas</a></p>
			</div>
		</div>
	</Container>
</div>
<!-- </Section> -->

<Container width={'wider'}>
	<SidebarLayout bind:open={sidebarOpen} label="indicator">
		{#snippet sidebarTop()}
			<div class="indicator-select">
				<h3>Select an indicator</h3>
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
			</div>
		{/snippet}
		{#snippet sidebar()}
			<h4>Browse by category</h4>
			{#each themeOptions as theme}
				<div class="twisty">
					<Details
						title={theme.label}
						id={theme.slug}
						cls="twisty"
						bind:open={
							() => openTheme === theme.slug,
							(v) => {
								openTheme = v ? theme.slug : openTheme === theme.slug ? null : openTheme;
								if (v) openSubtopic = null;
							}
						}
					>
						{#if openTheme === theme.slug}
							{#if theme.children.some((c) => c.children)}
								{#each theme.children as subtopic}
									{@const key = `${theme.slug}/${subtopic.slug}`}
									<div class="twisty">
										<Details
											title={subtopic.label}
											cls="twisty subtopic-details"
											bind:open={
												() => openSubtopic === key,
												(v) => {
													openSubtopic = v ? key : openSubtopic === key ? null : openSubtopic;
												}
											}
										>
											{#if openSubtopic === key}
												{@render indicatorRadios(key, subtopic.children)}
											{/if}
										</Details>
									</div>
								{/each}
							{:else}
								{@render indicatorRadios(theme.slug, theme.children)}
							{/if}
						{/if}
					</Details>
				</div>
			{/each}
		{/snippet}
		<div class="above-table">
			<div class="indicator-info">
				<h2>{selection?.indicator?.label}</h2>
				<p class="content-subtitle">
					{metadata?.subtitle}, {formatPeriod(uniquePeriods[0])}
					{#if uniquePeriods.length > 1}
						to {formatPeriod(uniquePeriods[uniquePeriods.length - 1])}{/if}.
					<a href="/indicators/{selection.indicator.slug}">Explore this indicator</a>
				</p>
			</div>
			{#if data && !data.message && hasSelectedAreaData}
				{@const showCi = data.uci_95 && data.lci_95}
				<div class="header-details">
					<!-- only render when non-empty: an empty div still claims its flex-basis and forces a wrap -->
					{#if showCi || !metadata.standardised}
						<div class="header-notes">
							{#if !metadata.standardised}
								<p>Comparison area disabled for non-standardised indicator.</p>
							{/if}
							{#if showCi}
								<p>
									Shaded bands show 95% confidence interval <a style:font-weight="bold">&#9432</a>
								</p>
							{/if}
						</div>
					{/if}
					<div class="legend-modals">
						{#if metadata.standardised}
							<AreasModal
								mode="comparison"
								{data}
								bind:pageState={modalPageState}
								areaslist={areas}
							/>
						{/if}
						<OptionsModal
							mode="comparison"
							data={{ periods: uniquePeriods }}
							hasIntervals="null"
							bind:pageState={timePageState}
							{formatPeriod}
							changeText={periodLabels[metadata.periodFormat] ?? metadata.periodFormat}
						/>
					</div>
				</div>
			{/if}
		</div>
		<!-- -->

		<div class="table">
			{#if data && !data.message && hasSelectedAreaData}
				{#key selection.indicator?.slug}
					<ComparisonRow
						{data}
						{filteredData}
						{metadata}
						selectedAreas={$selectedAreas}
						{comparisonArea}
						{formatValue}
						{formatPeriod}
						selectedPeriod={timePageState.selectedPeriodRange[1]}
						{uniquePeriods}
						bind:highlightedArea
					/>
				{/key}
			{:else if data && (data.message || !hasSelectedAreaData)}
				<div class="no-data">
					<p>No {selection.indicator.label} data available for the selected areas.</p>
				</div>
				<div class="no-data-geographies">
					<p>
						This indicator has data available for the following geography levels: <strong
							>{geographyLevelLabels}</strong
						>
						in the following countries: <strong>{countryLevelLabels}</strong>.
					</p>
				</div>
			{:else if !selectedAreas.length}
				<div class="no-data">
					<p>No areas selected for comparison. <a href="/pagebuilder">Select areas</a></p>
				</div>
			{:else}
				<Spinner message="Loading chart data" />
			{/if}
		</div>
		{#if data && !data.message && hasSelectedAreaData}
			<div class="get-data">
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
			<div class="share-link">
				<h4>Share this page</h4>
				<Textarea label="Shareable URL" value={shareUrl} hideLabel readonly rows="2" />
				<Button variant="secondary" on:click={copyShareUrl} small>
					{clipped ? 'Link copied' : 'Copy link'}
				</Button>
			</div>
		{/if}
	</SidebarLayout>
</Container>

<style>
	.table {
		margin-bottom: 20px;
	}
	.share-link {
		margin-top: 20px;
	}

	.above-table {
		/* background-color: var(--ons-color-grey-5); */
	}

	.table {
		margin-bottom: 20px;
		margin-top: 10px;
		min-height: 84px;
		position: relative;
	}

	.no-data {
		min-height: 84px;
		margin-top: 40px;
		font-size: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.no-data-geographies {
		font-size: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.no-data p {
		margin: 0;
	}

	.twisty {
		margin-bottom: 10px;
	}

	:global(.indicator-radios .ons-radios__items) {
		margin-left: -1.5rem;
		font-size: 16px;
	}

	:global(.indicator-radios .ons-radio.ons-radio--no-border > .ons-radio__input) {
		width: 1rem;
		height: 1rem;
		top: 0.4rem;
		border-width: 1.5px;
	}

	.fake-hero {
		background-color: #e9eff4;
		margin-bottom: 5px !important;
		display: flex;
		align-items: center;
		padding-bottom: 20px;
	}
	.hero-text {
		margin-top: 30px;
	}
	.hero-area-details {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		column-gap: 20px;
		row-gap: 3px;
	}
	.hero-area-details h4,
	.hero-area-details p {
		white-space: nowrap;
		margin: 0;
	}

	:global(.twisty .ons-details--open .ons-details__content) {
		border-left: 0px !important;
		margin-top: 10px !important;
	}

	:global(.ons-input--textarea) {
		word-wrap: break-word !important;
	}

	:global(.twisty .ons-details--initialised .ons-details__title) {
		font-weight: 400 !important;
		color: black;
		font-size: 16px;
	}
	:global(.twisty .ons-details--initialised .ons-details__heading) {
		padding-left: 1.5rem;
	}

	:global(.twisty .ons-details--initialised .ons-details__icon) {
		fill: black !important;
		color: black !important;
	}
	:global(.twisty .ons-details__icon .ons-icon) {
		transform: scale(0.75);
	}

	:global(.twisty details.subtopic-details:not([open]) .ons-details__icon) {
		top: -0.1rem !important;
		transform: rotate(0deg) !important;
	}
	:global(.twisty details.subtopic-details[open] .ons-details__icon) {
		top: 0.2rem !important;
		transform: rotate(90deg) !important;
	}

	:global(.ons-hero__details) {
		padding-bottom: 2rem;
	}

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

	.header-details {
		display: flex;
		/* wrap-reverse: once wrapped, the notes (first in DOM) sit below the buttons */
		flex-wrap: wrap-reverse;
		align-items: center;
		gap: 10px 24px;
		margin-top: 10px;
		font-size: 16px;
		padding: 0.5em 0;
		margin-bottom: 10px;
	}

	.header-notes {
		/* basis sets how narrow the notes get before dropping below the buttons */
		flex: 1 1 18rem;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.header-notes p {
		margin: 0;
	}

	.legend-modals {
		flex: 0 1 auto;
		max-width: 100%;
		margin-left: auto;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		/* only takes effect once stacked, when the group spans the full line */
		justify-content: flex-start;
		gap: 10px;
	}
	.legend-modals :global(.ons-btn) {
		flex: 0 1 auto;
		width: auto;
	}
	.select-container {
		margin-top: 1em;
		margin-bottom: 20px;
		width: 100%;
		max-width: 500px;
		min-width: 0;
		box-sizing: border-box;
	}
	.select-container :global(.the-list-class) {
		max-height: min(60vh, 400px) !important;
	}
</style>
