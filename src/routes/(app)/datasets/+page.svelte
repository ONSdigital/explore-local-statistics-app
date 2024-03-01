<script lang="ts">
	// @ts-nocheck
	import { base } from '$app/paths';
	import { Breadcrumb, Titleblock, analyticsEvent } from '@onsvisual/svelte-components';
	import Lede from '$lib/components/Lede.svelte';
	import Indicators from '$lib/components/Indicators.svelte';
	import UKMap from '$lib/components/UKMap.svelte';

	export let data;

	const datasetsCount = data.metadata.indicatorsCodeLabelArray.length;
</script>

<Breadcrumb
	links={[
		{ label: 'Home', href: 'https://www.ons.gov.uk/', refresh: true },
		{ label: 'Explore local statistics', href: `${base}/` },
		{ label: 'Find a local dataset' }
	]}
	background="#e9eff4"
/>
<Titleblock title="Find a local dataset" background="#e9eff4">
	<UKMap />
	<Lede
		>Discover patterns and trends in {datasetsCount} datasets, including employment rate, 4G coverage
		and life satisfaction.</Lede
	>
	<div style:height="32px" />
</Titleblock>

<Indicators topics={data.metadata.topicsArray} open />
