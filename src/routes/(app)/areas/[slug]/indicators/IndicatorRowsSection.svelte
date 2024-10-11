<script lang="ts">
	import { NavSection } from '@onsvisual/svelte-components';
	import TopicSection from './IndicatorRowsSection/TopicSection.svelte';
	import StickyHeader from './IndicatorRowsSection/StickyHeader.svelte';

	export let selectedArea,
		metadata,
		chartData,
		filteredIndicatorsCodes,
		selectionsObject,
		accordionArray,
		customLookup,
		stickyZIndex,
		toggle,
		indicatorChartsWidth;

	// tracks the selected start and end years based on the time periods slider - the initial values are based on a calculation made in data:generate of the min and max time periods across all indicators included in the app
	let chosenXDomainNumbStart = metadata.globalXDomainExtent[0];
	let chosenXDomainNumbEnd = metadata.globalXDomainExtent[1];
	$: chosenXDomain = [chosenXDomainNumbStart, chosenXDomainNumbEnd];

	let showConfidenceIntervals = false;

	// hoverAreaId tracks which area is being hovered over, hoverIndicatorId tracks which chart is being hovered over (since the label name appears on this chart)
	let hoverAreaId, hoverIndicatorId;

	$: console.log(toggle);
</script>

<div class="sticky-container">
	<NavSection title="Topics" hideTitle></NavSection>

	<StickyHeader
		{metadata}
		{selectedArea}
		{accordionArray}
		bind:toggle
		bind:selectionsObject
		bind:indicatorChartsWidth
		{customLookup}
		bind:chosenXDomainNumbStart
		bind:chosenXDomainNumbEnd
		bind:showConfidenceIntervals
		bind:stickyZIndex
	></StickyHeader>
	<div class="topic-sections-container">
		{#each metadata.topicsArray as topic, i}
			<TopicSection
				{metadata}
				{topic}
				{filteredIndicatorsCodes}
				bind:toggle
				bind:hoverAreaId
				bind:hoverIndicatorId
				bind:indicatorChartsWidth
				{selectedArea}
				{selectionsObject}
				{chartData}
				{customLookup}
				chosenXDomain={[
					isNaN(chosenXDomain[0]) ? 0 : chosenXDomain[0],
					isNaN(chosenXDomain[1]) ? 9999 : chosenXDomain[1]
				]}
				{showConfidenceIntervals}
			></TopicSection>
		{/each}
	</div>
</div>

<style>
	.control-panel {
		background-color: #e2e2e3;
	}
	.topic-sections-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	.selected-areas {
		color: #999;
		text-transform: uppercase;
	}
</style>
