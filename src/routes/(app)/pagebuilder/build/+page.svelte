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
	import { makeDataUrl, makePeriodFormatter } from '$lib/utils';
	import Table from '$lib/components/charts/Table.svelte';
	import Spinner from '$lib/components/visuals/Spinner.svelte';
	import { findNearestSharedParent } from '$lib/api/geo/helpers/findNearestSharedParent';
	import ComparisonPointrange from '$lib/components/charts/ComparisonPointrange.svelte';

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
			? makeDataUrl(selection.indicator.slug, 'latest', null, [sharedParent.areacd])
			: null
	);

	let formatPeriod = $derived(makePeriodFormatter(metadata?.periodFormat || 'year'));

	let metadata = $state(null);
	let metadataUrl = $derived(
		selection.indicator ? resolve(`/api/v1/metadata/indicators/${selection.indicator.slug}`) : null
	);

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

	function getLatestData(data) {
		const keys = Object.keys(data);
		const rowCount = data.period.length;

		const latestIndex = {};
		for (let i = 0; i < rowCount; i++) {
			const areacd = data.areacd[i];
			const period = data.period[i];

			if (!(areacd in latestIndex) || period > data.period[latestIndex[areacd]]) {
				latestIndex[areacd] = i;
			}
		}

		return Object.values(latestIndex).map((i) =>
			Object.fromEntries(keys.map((key) => [key, data[key][i]]))
		);
	}

	$effect(async () => await fetchData(dataUrl));
	$effect(async () => await fetchComparisonData(comparisonUrl));

	let caveats = $derived(new MarkdownIt().render(metadata?.caveats[0]));

	// to move into comparisonrow component:
	let latestData = $derived(data ? getLatestData(data) : null);
	let valueRange = $derived.by(() => {
		if (!latestData?.length) return null;

		const allValues = latestData.flatMap((d) =>
			[d.value, d.lci_95, d.uci_95].filter((v) => v != null)
		);

		if (!allValues.length) return null;

		return [Math.min(...allValues), Math.max(...allValues)];
	});
	$inspect(latestData);
	$inspect(valueRange);
</script>

<Hero title=""></Hero>

<Container>
	<Section>
		<div style:margin-bottom="20px" style:min-height="84px" style:position="relative">
			{#if data && !data.message}
				<h2>{selection?.indicator?.label}</h2>
				<p class="content-subtitle">
					{metadata?.subtitle},
					{formatPeriod(data.period[0])}
					<!-- {formatPeriod(dataTimeRange[dataTimeRange.length - 1])} -->
				</p>

				<p style:font-weight="bold">Comparison area: {sharedParent?.areanm}</p>
				{#if comparisonData}
					<Table data={comparisonData} extendHeight={-380}></Table>
				{/if}
				<Table {data}></Table>
				<ComparisonPointrange data={latestData[0]} xDomain={valueRange} />
			{:else if data && data.message}
				<div class="no-data">
					<p>No {selection.indicator.label} data available for the selected areas.</p>
				</div>
			{:else}
				<Spinner message="Loading chart data" />
			{/if}
		</div>
	</Section>
	{#if data && !data.message}
		{#if metadata?.caveats.length > 0}
			<Section title="Interpretation">
				<p>{@html caveats}</p>
			</Section>
		{/if}

		<Section title="Get the data">
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
		</Section>
	{/if}
</Container>
