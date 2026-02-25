<script lang="ts">
	import { resolve } from '$app/paths';
	import { makeCanonicalSlug } from '$lib/api/geo/helpers/areaSlugUtils';
	import { getName } from '@onsvisual/robo-utils';
	import { makeDataUrl } from '$lib/utils';
	import { Button } from '@onsvisual/svelte-components';
	import Spinner from '$lib/components/visuals/Spinner.svelte';

	let { areaProps } = $props();

	async function fetchData(urls: string[]) {
		try {
			const data = await Promise.all(urls.map(async (url) => (await fetch(url)).json()));
			if (data?.[0]?.message) return null;
			return data;
		} catch {
			return null;
		}
	}
	let dataUrls = $derived(
		['population-count', 'median-age'].map((key) =>
			makeDataUrl(key, 'latest', null, [areaProps.areacd])
		)
	);
</script>

<div class="local-indicators-card">
	<h2 class="ons-card__title ons-u-fs-m" style:margin-bottom="12px">
		Local data for {getName(areaProps, 'the')}
	</h2>
	<p style:margin-bottom="20px" style:min-height="80px" style:position="relative">
		{#await fetchData(dataUrls)}
			<Spinner />
		{:then data}
			{#if data}
				In {data[0].period[0].slice(0, 4)}, {getName(areaProps, 'the')} had a total population of
				<strong>{data[0].value[0].toLocaleString('en-GB')}</strong>
				and a median age of <strong>{data[1].value[0].toLocaleString('en-GB')} years</strong>.
			{:else}
				Health, education, economy, life satisfaction and more.
			{/if}
		{/await}
	</p>
	<Button
		icon="arrow"
		iconPosition="after"
		variant="primary"
		href={resolve(`/areas/${makeCanonicalSlug(areaProps)}/indicators`)}
		small>Explore local indicators</Button
	>
</div>

<style>
	.local-indicators-card {
		color: var(--ons-color-page-light);
		background-color: var(--ons-color-branded);
	}
</style>
