<script>
	import VisibleArea from '$lib/prototype-components/add-remove-comparison-areas/modal-visible-areas-key/VisibleArea.svelte';
	import VisibleRelatedAreas from './VisibleRelatedAreas.svelte';

	export let visibleAreasWithData, combinedSelectableAreaTypesObject;
	export let chosenParentAreasArray,
		chosenRelatedAreasId,
		chosenSameRegionArray,
		chosenCountriesArray,
		chosenRegionsArray,
		chosenAllOtherArray;

	$: console.log(visibleAreasWithData[1]);
</script>

<div class="visible-areas-container">
	{#each visibleAreasWithData[0].filter((el) => el.role != 'main') as area}
		<VisibleArea
			{area}
			bind:chosenParentAreasArray
			bind:chosenSameRegionArray
			bind:chosenCountriesArray
			bind:chosenRegionsArray
			bind:chosenAllOtherArray
		></VisibleArea>
	{/each}
	{#if visibleAreasWithData[1].some((el) => el.role === 'sameRegion')}
		<VisibleRelatedAreas
			role="sameRegion"
			label={combinedSelectableAreaTypesObject.sameRegion.label}
			bind:chosenRelatedAreasId
		></VisibleRelatedAreas>
	{/if}
	{#if visibleAreasWithData[1].some((el) => el.role === 'similar')}
		<VisibleRelatedAreas
			role="similar"
			label={combinedSelectableAreaTypesObject.similar.label}
			bind:chosenRelatedAreasId
		></VisibleRelatedAreas>
	{/if}
</div>

<style>
	.visible-areas-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		min-height: 36px;
	}
</style>
