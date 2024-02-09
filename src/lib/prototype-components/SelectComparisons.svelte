<script lang="ts">
	import ComparisonMeasureOrAreaButton from '$lib/prototype-components/select-comparisons/ComparisonMeasureOrAreaButton.svelte';
	import AdditionalComparisonAreasButton from '$lib/prototype-components/select-comparisons/AdditionalComparisonAreasButton.svelte';
	import ModalComparisonMeasureOrArea from '$lib/prototype-components/select-comparisons/ModalComparisonMeasureOrArea.svelte';
	import ModalAdditionalComparisonAreaGroup from '$lib/prototype-components/select-comparisons/ModalAdditionalComparisonAreaGroup.svelte';

	import { colorsLookup } from '$lib/config.js';
	import { onMount } from 'svelte';

	export let metadata, areasGroupsObject, comparisonGroupsArray;
	export let chosenComparisonMeasureOrArea, chosenAdditionalComparisonAreasGroup;

	let filteredComparisonGroupsArray = comparisonGroupsArray.filter((el) => 'label1' in el);

	let showModalComparisonMeasureOrArea = false;
	let showModalAdditionalComparisonAreaGroup = false;

	onMount(() => {
		chosenComparisonMeasureOrArea = filteredComparisonGroupsArray[0];
		chosenAdditionalComparisonAreasGroup = comparisonGroupsArray[0];
	});

	$: console.log(chosenComparisonMeasureOrArea);
</script>

<div class="select-comparisons-container sticky">
	<div class="row-container">
		<span>Comparing</span>
		<div class="area-container" style="border-color: {colorsLookup.main.color}">
			<div class="inline-row-container">
				<svg width="20" height="20">
					<circle cx="10" cy="10" r="8" stroke="white" fill={colorsLookup.main.color}></circle>
				</svg>
				<span style="color: {colorsLookup.main.color}; font-weight: bold"
					>{areasGroupsObject.selected.area.areanm}</span
				>
			</div>
		</div>
		<span>to</span>
		{#if chosenComparisonMeasureOrArea}
			<ComparisonMeasureOrAreaButton
				{chosenComparisonMeasureOrArea}
				bind:showModalComparisonMeasureOrArea
			></ComparisonMeasureOrAreaButton>
		{/if}
	</div>
	<div class="additional-comparison-areas-group-container row-container">
		<span>Also showing</span>
		{#if chosenAdditionalComparisonAreasGroup}
			<AdditionalComparisonAreasButton
				{chosenAdditionalComparisonAreasGroup}
				bind:showModalAdditionalComparisonAreaGroup
			></AdditionalComparisonAreasButton>
		{/if}
	</div>
</div>

{#if showModalComparisonMeasureOrArea}
	<ModalComparisonMeasureOrArea
		bind:chosenComparisonMeasureOrArea
		{filteredComparisonGroupsArray}
		bind:showModalComparisonMeasureOrArea
		{areasGroupsObject}
	></ModalComparisonMeasureOrArea>
{/if}

{#if showModalAdditionalComparisonAreaGroup}
	<ModalAdditionalComparisonAreaGroup
		bind:chosenAdditionalComparisonAreasGroup
		{comparisonGroupsArray}
		bind:showModalAdditionalComparisonAreaGroup
		{areasGroupsObject}
	></ModalAdditionalComparisonAreaGroup>
{/if}

<style>
	.sticky {
		margin: 0px;
		width: 100%;
		background-color: white;
		padding: 10px 0px;
		position: sticky;
		top: 0px;
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: flex-start;
		gap: 10px;
		align-items: center;
	}

	.area-container {
		padding: 4px;
		display: inline-block;
		border-radius: 4px;
		border-style: solid;
		border-width: 1.5px;
		line-height: 20px;
	}

	.inline-row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		gap: 2px;
	}

	.additional-comparison-areas-group-container {
		font-size: 16px;
	}
</style>
