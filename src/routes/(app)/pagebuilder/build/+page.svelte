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

	let selection = $state({ areas: [], indicator: null });

	$effect(() => {
		const stored = sessionStorage.getItem('pagebuilder-selection');
		if (stored) selection = JSON.parse(stored);
	});

	let data: jsonDataCols | errorObject | null = $state.raw(null);
	async function fetchData(dataUrl: string) {
		try {
			data = await (await fetch(dataUrl)).json();
			return data;
		} catch {
			return null;
		}
	}

	let dataUrl = $derived(
		selection.indicator && selection.areas.length
			? makeDataUrl(selection.indicator.slug, 'latest', null, selection.areas)
			: null
	);

	let formatPeriod = $derived(makePeriodFormatter(metadata?.periodFormat || 'year'));
	$inspect(dataUrl);
	$inspect(selection);

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

	$effect(async () => await fetchData(dataUrl));

	let caveats = $derived(new MarkdownIt().render(metadata?.caveats[0]));
	$inspect(metadata);
</script>

<Hero title=""></Hero>

<Container>
	<Section>
		<div style:margin-bottom="20px" style:min-height="84px" style:position="relative">
			{#if data}
				<h2>{selection.indicator.label}</h2>
				<p class="content-subtitle">
					{metadata?.subtitle},
					{formatPeriod(data.period[0])}
					<!-- {formatPeriod(dataTimeRange[dataTimeRange.length - 1])} -->
				</p>
				<Table {data}></Table>
			{:else}
				<Spinner message="Loading chart data" />
			{/if}
		</div>
	</Section>
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
</Container>
