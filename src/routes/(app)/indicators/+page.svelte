<script lang="ts">
	// @ts-nocheck
	import { base } from '$app/paths';
	import { Breadcrumb, Titleblock, NavSections, NavSection } from '@onsvisual/svelte-components';
	import { capitalise } from '@onsvisual/robo-utils';
	import Lede from '$lib/components/Lede.svelte';

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
		{ label: 'Local indicators' }
	]}
/>
<Titleblock title="Local indicators">
	<Lede
		>Explore our {datasetsCount} local indicators, including <b>life satisfaction</b>,
		<b>4G coverage</b>
		and
		<b>employment rate</b>.
	</Lede>
</Titleblock>

<!-- <Section marginTop marginBottom={false}>
	<Input label="Type to filter indicators" bind:value={filterText} />
</Section> -->

<NavSections contentsLabel="Topics">
	{#each filteredTopics as topic}
		<NavSection title={capitalise(topic.name)}>
			{#each topic.subTopics as subTopic}
				<h3>{capitalise(subTopic.name)}</h3>
				{#each subTopic.indicators as indicator}
					<p>
						<a href="{base}/indicators/{indicator.metadata.slug}">{indicator.metadata.label}</a><br
						/>
						{indicator.metadata.subtitle}
					</p>
				{/each}
			{/each}
			<div class="horizontal-divider"></div>
		</NavSection>
	{/each}
</NavSections>

<style>
	.horizontal-divider {
		border-bottom: 1px solid var(--ons-color-grey-15);
	}
	.sticky {
		position: -webkit-sticky; /* For Safari */
		position: sticky;
		top: 0; /* Value that defines the threshold at which the element becomes sticky */
	}
</style>
