<script lang="ts">
	// @ts-nocheck
	import { base } from '$app/paths';
	import { Hero, NavSections, NavSection } from '@onsvisual/svelte-components';
	import { capitalise } from '@onsvisual/robo-utils';

	export let data;

	let datasetsCount = data.coreMetadata.indicatorsCodeLabelArray.length;
	let filteredCount = datasetsCount;
	const indicatorsObject = data.coreMetadata.indicatorsObject;

	let filterText;

	function filterTopics(filterText) {
		if (!filterText) {
			filteredCount = data.coreMetadata.indicatorsCodeLabelArray.length;
			return data.coreMetadata.topicsArray;
		}

		const regex = new RegExp(`\\b${filterText}`, 'i');
		const newTopics = JSON.parse(JSON.stringify(data.coreMetadata.topicsArray));

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

<Hero width="medium" title="Local indicators" cls="titleblock-transparent">
	<p class="ons-hero__text">
		Explore our {datasetsCount} local indicators, including <b>disposable household income</b>,
		<b>participation in further education</b>
		and
		<b>life satisfaction</b>.
	</p>
</Hero>

<!-- <Section marginTop marginBottom={false}>
	<Input label="Type to filter indicators" bind:value={filterText} />
</Section> -->

<NavSections contentsLabel="Topics">
	{#each filteredTopics as topic}
		<NavSection title={capitalise(topic.name)}>
			{#each topic.subTopics as subTopic}
				{#if topic.name != subTopic.name}
					<h3>{capitalise(subTopic.name)}</h3>
				{/if}
				{#each subTopic.indicatorCodes.map((code) => indicatorsObject[code]) as indicator}
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
