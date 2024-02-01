<script lang="ts">
	import Select from '$lib/prototype-components/modified-svelte-components/Select.svelte';
	import Checkbox from '$lib/prototype-components/modified-svelte-components/Checkbox.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';

	export let metadata, combinedSelectableAreaTypesObject, areasCodesForAreasWithData;
	export let chosenSameRegionArray, chosenCountriesArray, chosenRegionsArray, chosenAllOtherArray;

	let searchText = '';

	$: regex = searchText ? new RegExp(searchText, 'i') : null;

	$: areasWithData = metadata.areasArray.filter((el) =>
		areasCodesForAreasWithData.includes(el.areacd)
	);

	$: searchedForAreasWithData = regex
		? areasWithData.filter((e) => regex.test(e.areanm))
		: areasWithData;
	$: searchedForAreasWithDataCodes = searchedForAreasWithData.map((el) => el.areacd);

	$: console.log(searchedForAreasWithData);

	$: sameRegionAreasWithData = combinedSelectableAreaTypesObject.sameRegion.areas.filter((el) =>
		searchedForAreasWithDataCodes.includes(el.areacd)
	);

	$: regionsWithData = combinedSelectableAreaTypesObject.regions.areas.filter((el) =>
		searchedForAreasWithDataCodes.includes(el.areacd)
	);

	$: countriesWithData = combinedSelectableAreaTypesObject.countries.areas.filter((el) =>
		searchedForAreasWithDataCodes.includes(el.areacd)
	);

	$: allOtherAreasWithData = metadata.areasArray.filter(
		(el) =>
			['upper', 'lower'].includes(el.geogLevel) &&
			!combinedSelectableAreaTypesObject.parents.codes.includes(el.areacd) &&
			!combinedSelectableAreaTypesObject.sameRegion.codes.includes(el.areacd) &&
			searchedForAreasWithDataCodes.includes(el.areacd)
	);
</script>

<div class="sticky-container">
	<div class="sticky">
		<Select bind:searchText></Select>
	</div>

	{#if sameRegionAreasWithData.length > 0}
		<div class="checkbox-grid-container">
			<Checkbox
				title={combinedSelectableAreaTypesObject.sameRegion.label + ':'}
				name="parent-areas-checkbox-selection"
				optionsArray={sameRegionAreasWithData}
				bind:valueArray={chosenSameRegionArray}
				labelKey="areanm"
				idKey="areacd"
				columns="2"
			></Checkbox>
		</div>

		<Divider orientation="horizontal"></Divider>
	{/if}

	{#if countriesWithData.length > 0 && combinedSelectableAreaTypesObject.selected.area.geogLevel != 'country'}
		<div class="checkbox-grid-container">
			<Checkbox
				title="Countries:"
				name="parent-areas-checkbox-selection"
				optionsArray={countriesWithData}
				bind:valueArray={chosenCountriesArray}
				labelKey="areanm"
				idKey="areacd"
				columns="2"
			></Checkbox>
		</div>

		<Divider orientation="horizontal"></Divider>
	{/if}

	{#if regionsWithData.length > 0 && combinedSelectableAreaTypesObject.selected.area.geogLevel != 'region'}
		<div class="checkbox-grid-container">
			<Checkbox
				title="Regions of England:"
				name="parent-areas-checkbox-selection"
				optionsArray={regionsWithData}
				bind:valueArray={chosenRegionsArray}
				labelKey="areanm"
				idKey="areacd"
				columns="2"
			></Checkbox>
		</div>

		<Divider orientation="horizontal"></Divider>
	{/if}
	{#if allOtherAreasWithData.length > 0}
		<div class="checkbox-grid-container">
			<Checkbox
				title="All other areas:"
				name="parent-areas-checkbox-selection"
				optionsArray={allOtherAreasWithData}
				bind:valueArray={chosenAllOtherArray}
				labelKey="areanm"
				idKey="areacd"
				columns="2"
			></Checkbox>
		</div>

		<Divider orientation="horizontal"></Divider>
	{/if}
</div>

<style>
	.sticky-container {
		height: 300px;
		overflow: auto;
	}

	.sticky {
		padding: 5px 0px;
		position: sticky;
		top: 0px;
		background-color: white;
	}

	.checkbox-grid-container {
		margin: 20px 0px;
	}
</style>
