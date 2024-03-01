<script lang="ts">
	// @ts-nocheck
	import { base } from '$app/paths';
	import {
		Breadcrumb,
		Titleblock,
		analyticsEvent,
		Section,
		Input
	} from '@onsvisual/svelte-components';
	import Lede from '$lib/components/Lede.svelte';
	import Indicators from '$lib/components/Indicators.svelte';
	import UKMap from '$lib/components/UKMap.svelte';

	export let data;

	let datasetsCount = data.metadata.indicatorsCodeLabelArray.length;
	let filteredCount = datasetsCount;

	let filterText;

	function filterTopics(filterText) {
		if (!filterText) {
			filteredCount = data.metadata.indicatorsCodeLabelArray.length;
			return data.metadata.topicsArray;
		}

		const regex = new RegExp(`\\b${filterText}`, 'i');
		const newTopics = JSON.parse(JSON.stringify(data.metadata.topicsArray));

		let count = 0;

		for (const topic of newTopics) {
			for (const subTopic of topic.subTopics) {
				subTopic.indicators = subTopic.indicators.filter(
					(ind) => ind.metadata.label.match(regex) || ind.metadata.subtitle.match(regex)
				);
				count += subTopic.indicators.length;
			}
			topic.subTopics = topic.subTopics.filter((sub) => sub.indicators.length > 0);
		}
		filteredCount = count;
		return newTopics.filter((topic) => topic.subTopics.length > 0);
	}

	$: filteredTopics = filterTopics(filterText);
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

<Section marginTop marginBottom={false}>
	<Input label="Type to filter datasets" bind:value={filterText} />
</Section>

{#if filteredCount > 0}
	<Indicators topics={filteredTopics} open />
{:else}
	<Section marginTop>
		<p>No results for {filterText}</p>
	</Section>
{/if}
