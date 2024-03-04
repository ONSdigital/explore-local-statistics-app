<script lang="ts">
	import { NavSection } from '@onsvisual/svelte-components';
	import TopicSection from '$lib/prototype-components/area-page/TopicSection.svelte';
	import SelectComparisons from '$lib/prototype-components/SelectComparisons.svelte';
	import EditTimePeriod from '$lib/prototype-components/EditTimePeriod.svelte';
	import StickyHeader from '$lib/prototype-components/sticky-header/StickyHeader.svelte';

	import { onMount } from 'svelte';

	export let selectedArea,
		metadata,
		chartData,
		filteredIndicatorsCodes,
		selectionsObject,
		accordionArray,
		customLookup;

	let startXDomainNumb = 'Earliest available data',
		endXDomainNumb = 'Latest available data';

	let showConfidenceIntervals = false;

	let hoverAreaId, hoverIndicatorId;

	$: console.log(startXDomainNumb, endXDomainNumb, showConfidenceIntervals);
</script>

<div class="sticky-container">
	<h3>Selected areas</h3>

	<StickyHeader
		{metadata}
		{selectedArea}
		{accordionArray}
		bind:selectionsObject
		{customLookup}
		bind:startXDomainNumb
		bind:endXDomainNumb
		bind:showConfidenceIntervals
	></StickyHeader>

	<div class="topic-sections-container">
		{#each metadata.topicsArray as topic, i}
			<TopicSection
				{metadata}
				{topic}
				{filteredIndicatorsCodes}
				bind:hoverAreaId
				bind:hoverIndicatorId
				{selectedArea}
				{selectionsObject}
				{chartData}
				{startXDomainNumb}
				{endXDomainNumb}
			></TopicSection>
			<!-- <TopicSection
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
		></TopicSection> -->
		{/each}
	</div>
</div>

<style>
	.topic-sections-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
</style>
