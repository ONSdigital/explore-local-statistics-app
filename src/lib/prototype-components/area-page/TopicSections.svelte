<script lang="ts">
	import { NavSection } from '@onsvisual/svelte-components';
	import TopicSection from '$lib/prototype-components/area-page/TopicSection.svelte';
	import SelectComparisons from '$lib/prototype-components/SelectComparisons.svelte';
	import EditTimePeriod from '$lib/prototype-components/EditTimePeriod.svelte';
	import ChangeAreas from '$lib/prototype-components/change-areas/ChangeAreas.svelte';

	import { onMount } from 'svelte';

	export let metadata,
		areasGroupsObject,
		comparisonGroupsArray,
		chartData,
		filteredIndicatorsCodes,
		testChosen;

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

	$: chosenArray = new Array(3);

	$: console.log(chosenArray);

	$: accordionArray = [
		{
			label: 'Primary comparison area/measure',
			type: 'radio',
			options: [
				{ data: [{ label: 'None', id: 'none' }], accordion: false, labelKey: 'label', idKey: 'id' },
				{
					//label: 'Average of group of areas',
					data: comparisonGroupsArray,
					accordion: false,
					labelKey: 'label1',
					idKey: 'name'
				},
				{
					//label: 'Parent areas',
					data: areasGroupsObject.parents.areas,
					accordion: false
				},
				{
					label: areasGroupsObject.sameRegion.label,
					data: areasGroupsObject.sameRegion.areas,
					accordion: true
				},
				{
					label: 'Countries',
					data: areasGroupsObject.options.countries.areas,
					accordion: true
				},
				{ label: 'Regions', data: areasGroupsObject.options.regions.areas, accordion: true },
				{
					label: 'Upper-tier local authorities',
					data: areasGroupsObject.options.upperTier.areas,
					accordion: true
				},
				{
					label: 'Lower-tier local authorities',
					data: areasGroupsObject.options.lowerTier.areas,
					accordion: true
				}
			]
		},
		{
			label: 'Related areas',
			type: 'radio',
			search: null,
			options: [
				{ data: [{ label: 'None', id: 'none' }], accordion: false, labelKey: 'label', idKey: 'id' },
				{ data: comparisonGroupsArray, accordion: false, labelKey: 'label2', idKey: 'name' }
			]
		},
		{
			label: 'Additional areas',
			type: 'checkbox',
			options: [
				{
					//label: 'Parent areas',
					data: areasGroupsObject.parents.areas,
					accordion: false
				},
				{
					label: areasGroupsObject.sameRegion.label,
					data: areasGroupsObject.sameRegion.areas,
					accordion: true
				},
				{
					label: 'Countries',
					data: areasGroupsObject.options.countries.areas,
					accordion: true
				},
				{ label: 'Regions', data: areasGroupsObject.options.regions.areas, accordion: true },
				{
					label: 'Upper-tier local authorities',
					data: areasGroupsObject.options.upperTier.areas,
					accordion: true
				},
				{
					label: 'Lower-tier local authorities',
					data: areasGroupsObject.options.lowerTier.areas,
					accordion: true
				}
			]
		}
	];
</script>

<div class="topic-sections-container">
	<!-- <EditTimePeriod {metadata} bind:startXDomainNumb bind:endXDomainNumb></EditTimePeriod> -->

	<!-- <SelectComparisons
		{metadata}
		{areasGroupsObject}
		{comparisonGroupsArray}
		bind:chosenComparisonMeasureOrArea
		bind:chosenAdditionalComparisonAreasGroup
	></SelectComparisons> -->

	<ChangeAreas
		selectedArea={areasGroupsObject.selected.area}
		{accordionArray}
		bind:chosenArray
		bind:testChosen
		visiblePrimaryAreas={areasGroupsObject.visible.primaryAreas}
	></ChangeAreas>

	{#each metadata.topicsArray as topic, i}
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
