<script lang="ts">
	import Checkbox from '$lib/prototype-components/modified-svelte-components/Checkbox.svelte';
	import Radio from '$lib/prototype-components/modified-svelte-components/Radio.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';

	import { haveCommonElements } from '$lib/utils';

	export let combinedSelectableAreaTypesObject,
		areasCodesForAreasWithData,
		chosenParentAreasArray,
		chosenRelatedAreasId;

	$: parentAreasWithData = areasCodesForAreasWithData
		? combinedSelectableAreaTypesObject.parents.areas.filter((el) =>
				areasCodesForAreasWithData.includes(el.areacd)
			)
		: combinedSelectableAreaTypesObject.parents.areas;

	$: sameRegionAreasObject =
		!areasCodesForAreasWithData ||
		haveCommonElements(
			combinedSelectableAreaTypesObject.sameRegion.codes,
			areasCodesForAreasWithData
		)
			? { id: 'sameRegion', label: combinedSelectableAreaTypesObject.sameRegion.label }
			: undefined;

	$: similarAreasObject =
		!areasCodesForAreasWithData ||
		haveCommonElements(combinedSelectableAreaTypesObject.similar.codes, areasCodesForAreasWithData)
			? { id: 'similar', label: combinedSelectableAreaTypesObject.similar.label }
			: undefined;

	$: relatedAreasOptionsArray = [
		{ id: 'none', label: 'None' },
		sameRegionAreasObject,
		similarAreasObject
	].filter((el) => el);
</script>

{#if parentAreasWithData.length > 0 || relatedAreasOptionsArray.length > 0}
	<div class="row-container parent-related-checkboxes-container">
		{#if combinedSelectableAreaTypesObject.parents.areas.length > 0}
			<div class="column-container">
				<Checkbox
					title="Parent areas:"
					name="parent-areas-checkbox-selection"
					optionsArray={parentAreasWithData}
					bind:valueArray={chosenParentAreasArray}
					labelKey="areanm"
					idKey="areacd"
				></Checkbox>
			</div>
		{/if}
		{#if parentAreasWithData.length > 0 && relatedAreasOptionsArray.length > 0}
			<Divider orientation="vertical"></Divider>
		{/if}
		{#if relatedAreasOptionsArray.length > 0}
			<div class="column-container">
				<Radio
					title="Related areas:"
					name="related-areas-checkbox-selection"
					optionsArray={relatedAreasOptionsArray}
					bind:valueId={chosenRelatedAreasId}
					labelKey="label"
					idKey="id"
				></Radio>
			</div>
		{/if}
	</div>
	<Divider orientation="horizontal"></Divider>
{/if}

<style>
	.row-container {
		margin: 0px 0px 20px 0px;
		padding: 0px;
		display: flex;
	}

	.parent-related-checkboxes-container {
		gap: 20px;
	}

	.column-container {
		flex: 1;
		flex-shrink: 0;
	}
</style>
