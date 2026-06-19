<script lang="ts">
	import { resolve } from '$app/paths';
	import { makeCanonicalSlug } from '$lib/api/geo/helpers/areaSlugUtils';
	import { getName } from '@onsvisual/robo-utils';
	import { makeDataUrl } from '$lib/utils';
	import { Button } from '@onsvisual/svelte-components';
	import Spinner from '$lib/components/visuals/Spinner.svelte';

	let { areaProps } = $props();
	const indicators = ['population-count', 'median-age'];

	async function fetchData(url: string) {
		try {
			const data = await (await fetch(url)).json();
			if (!indicators.every((ind) => data[ind])) return null;
			return data;
		} catch {
			return null;
		}
	}
	let dataUrl = $derived(makeDataUrl(indicators.join(','), 'latest', null, [areaProps.areacd]));
</script>

<div class="local-indicators-card">
	<h2 class="ons-card__title ons-u-fs-m" style:margin-bottom="12px">
		Local data for {getName(areaProps, 'the')}
	</h2>
	<div style:margin-bottom="20px" style:min-height="84px" style:position="relative">
		{#await fetchData(dataUrl)}
			<Spinner />
		{:then data}
			{#if data}
				In {data['population-count'].period[0].slice(0, 4)}, {getName(areaProps, 'the')} had a total
				population of
				<strong>{data['population-count'].value[0].toLocaleString('en-GB')}</strong>
				and a median age of
				<strong>{data['median-age'].value[0].toLocaleString('en-GB')} years</strong>.
			{:else}
				Health, education, economy, life satisfaction and more.
			{/if}
		{/await}
	</div>
	<Button
		icon="arrow"
		iconPosition="after"
		variant="primary"
		href={resolve(`/areas/${makeCanonicalSlug(areaProps)}/indicators`)}
		rel={areaProps.end && areaProps.successor?.areacd ? 'nofollow' : null}
		small>Explore local indicators</Button
	>
</div>

<style>
	.local-indicators-card {
		color: var(--ons-color-page-light);
		background-color: var(--ons-color-branded);
	}
</style>
