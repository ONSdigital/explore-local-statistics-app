<script lang="ts">
	import AddRemoveComparisonAreas from '$lib/prototype-components/AddRemoveComparisonAreas.svelte';
	import EditTimePeriod from '$lib/prototype-components/temporary/EditTimePeriod.svelte';
	import InfoButton from '$lib/prototype-components/modified-svelte-components/InfoButton.svelte';

	export let metadata,
		combinedSelectableAreaTypesObject,
		visibleAreasWithData,
		areasCodesForAreasWithData;
	export let chosenParentAreasArray,
		chosenRelatedAreasArray,
		chosenSameRegionArray,
		chosenCountriesArray,
		chosenRegionsArray,
		chosenAllOtherArray;
</script>

<div class="row-container-split">
	<div class="row-container">
		<AddRemoveComparisonAreas
			{metadata}
			{combinedSelectableAreaTypesObject}
			visibleAreasWithData={[
				combinedSelectableAreaTypesObject.visible.primaryAreas,
				combinedSelectableAreaTypesObject.visible.relatedAreas
			]}
			areasCodesForAreasWithData={null}
			bind:chosenParentAreasArray
			bind:chosenRelatedAreasArray
			bind:chosenSameRegionArray
			bind:chosenCountriesArray
			bind:chosenRegionsArray
			bind:chosenAllOtherArray
		></AddRemoveComparisonAreas>

		<EditTimePeriod></EditTimePeriod>
	</div>

	<div class="more-info-on-charts-button-container">
		<InfoButton fill="white"></InfoButton>
		<span>How to read these charts</span>
	</div>
</div>

<style>
	.row-container-split {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: space-between;
		align-items: center;
	}

	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 10px;
	}

	.more-info-on-charts-button-container {
		padding: 3px 10px 3px 0px;
		line-height: 20px;
		background-color: #003c57;
		color: white;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		width: 145px;
		gap: 0px;
		text-align: end;
		border-radius: 4px;
		cursor: pointer;
	}
</style>
