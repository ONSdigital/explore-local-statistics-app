<script lang="ts">
	import TopicSection from '$lib/prototype-components/area-page/TopicSection.svelte';
	import SelectComparisons from '$lib/prototype-components/SelectComparisons.svelte';
	import EditTimePeriod from '$lib/prototype-components/EditTimePeriod.svelte';

	import { onMount } from 'svelte';

	export let metadata, areasGroupsObject, comparisonGroupsArray, chartData, filteredIndicatorsCodes;

	let chosenComparisonMeasureOrArea, chosenAdditionalComparisonAreasGroup;

	let startXDomainNumb = 'Earliest available data',
		endXDomainNumb = 'Latest available data';

	$: backgroundAreasCodes = chosenAdditionalComparisonAreasGroup
		? {
				'all-siblings': areasGroupsObject.sameGeogLevel.codes,
				'same-parent-siblings': areasGroupsObject.sameRegion.codes,
				'similar-siblings': areasGroupsObject.similar.codes,
				'local-authority-children': areasGroupsObject.children.laCodes,
				'region-children': areasGroupsObject.children.regionCodes
			}[chosenAdditionalComparisonAreasGroup.name]
		: null;
</script>

<div class="topic-sections-container">
	<!-- <EditTimePeriod {metadata} bind:startXDomainNumb bind:endXDomainNumb></EditTimePeriod> -->

	<SelectComparisons
		{metadata}
		{areasGroupsObject}
		{comparisonGroupsArray}
		bind:chosenComparisonMeasureOrArea
		bind:chosenAdditionalComparisonAreasGroup
	></SelectComparisons>

	{#each metadata.topicsArray as topic, i}
		<TopicSection
			{i}
			{topic}
			{areasGroupsObject}
			{chartData}
			{metadata}
			{chosenComparisonMeasureOrArea}
			{chosenAdditionalComparisonAreasGroup}
			{startXDomainNumb}
			{endXDomainNumb}
			{backgroundAreasCodes}
			{filteredIndicatorsCodes}
		></TopicSection>
	{/each}
</div>
