<script lang="ts">
	import TopicSection from '$lib/prototype-components/area-page/TopicSection.svelte';
	import SelectComparisons from '$lib/prototype-components/SelectComparisons.svelte';
	import EditTimePeriod from '$lib/prototype-components/EditTimePeriod.svelte';

	import { onMount } from 'svelte';

	export let metadata, areasGroupsObject, comparisonGroupsArray, chartData;

	let chosenComparisonMeasureOrArea, chosenAdditionalComparisonAreasGroup;

	let startXDomainNumb = 'Earliest available data',
		endXDomainNumb = 'Latest available data';
</script>

<div class="topic-sections-container">
	<EditTimePeriod {metadata} bind:startXDomainNumb bind:endXDomainNumb></EditTimePeriod>

	<SelectComparisons
		{metadata}
		{areasGroupsObject}
		{comparisonGroupsArray}
		bind:chosenComparisonMeasureOrArea
		bind:chosenAdditionalComparisonAreasGroup
	></SelectComparisons>

	{#each metadata.topicsArray as topic, i}
		<TopicSection
			{topic}
			{areasGroupsObject}
			{chartData}
			{metadata}
			{chosenComparisonMeasureOrArea}
			{chosenAdditionalComparisonAreasGroup}
			{startXDomainNumb}
			{endXDomainNumb}
		></TopicSection>
	{/each}
</div>
