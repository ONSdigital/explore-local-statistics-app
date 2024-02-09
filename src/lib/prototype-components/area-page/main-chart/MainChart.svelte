<script lang="ts">
	import Tabs from '$lib/prototype-components/modified-svelte-components/Tabs.svelte';
	import Dropdown from '$lib/prototype-components/modified-svelte-components/Dropdown.svelte';
	import SubtitleAdditionalDescription from '$lib/prototype-components/area-page/main-chart/SubtitleAdditionalDescription.svelte';
	import LineChartContainer from '$lib/prototype-components/area-page/main-chart/LineChartContainer.svelte';

	import { mainChartOptionsArray } from '$lib/config';

	export let combinedSelectableAreaTypesObject, chartData, metadata, chosenIndicatorId;
	export let chosenParentAreasArray,
		chosenRelatedAreasId,
		chosenSameRegionArray,
		chosenCountriesArray,
		chosenRegionsArray,
		chosenAllOtherArray;

	$: selectedIndicator = metadata.indicatorsObject[chosenIndicatorId.code];
	$: selectedIndicatorCalculations = metadata.indicatorsCalculationsArray.find(
		(el) =>
			el.code === selectedIndicator.code &&
			el.period === selectedIndicator.maxXDomainNumb &&
			el.geog_level === combinedSelectableAreaTypesObject.selected.area.geogLevel
	);

	////

	$: timePeriodsArray = metadata.periodsLookupArray.filter(
		(el) =>
			el.periodGroup === selectedIndicator.periodGroup &&
			el.xDomainNumb >= selectedIndicator.minXDomainNumb &&
			el.xDomainNumb <= selectedIndicator.maxXDomainNumb
	);

	////

	$: chartOptionsArray = mainChartOptionsArray.filter(
		(el) => timePeriodsArray.length > 1 || el.multiYear != 'Yes'
	);
	$: chosenChartId =
		chartOptionsArray.find((el) => el.id === chosenChartId) === undefined
			? chartOptionsArray[0].id
			: chosenChartId;
	$: selectedChartType = chartOptionsArray[chosenChartId];

	////

	$: filteredChartData = chartData.combinedDataObject[selectedIndicator.code].filter(
		(el) => el.value != 'NA'
	);

	////

	$: areasCodesForAreasWithData = [...new Set(filteredChartData.map((el) => el.areacd))];
	/*$: visibleAreasWithData = [
		...combinedSelectableAreaTypesObject.visible.primaryAreas,
		...combinedSelectableAreaTypesObject.visible.relatedAreas
	].filter((el) => areasCodesForAreasWithData.includes(el.areacd));*/

	$: visibleAreasWithData = [
		combinedSelectableAreaTypesObject.visible.primaryAreas,
		combinedSelectableAreaTypesObject.visible.relatedAreas
	].map((el) => el.filter((elm) => areasCodesForAreasWithData.includes(elm.areacd)));

	$: visibleAreasWithDataCodes = [...visibleAreasWithData[0], ...visibleAreasWithData[1]].map(
		(el) => el.areacd
	);

	////

	$: filteredChartDataForVisibleAreas = filteredChartData.filter((el) =>
		visibleAreasWithDataCodes.includes(el.areacd)
	);
</script>

<Tabs name="select-main-chart-type" optionsArray={chartOptionsArray} bind:chosenId={chosenChartId}
></Tabs>

<div class="main-chart-container">
	<Dropdown
		name="select-indicator"
		optionsArray={metadata.indicatorsCodeLabelArray}
		bind:chosenId={chosenIndicatorId}
	></Dropdown>

	<SubtitleAdditionalDescription {selectedIndicator} {timePeriodsArray} {selectedChartType}
	></SubtitleAdditionalDescription>

	<div class="chart-container">
		{#if selectedChartType.label === 'Time series'}
			<LineChartContainer
				{selectedIndicator}
				{metadata}
				{combinedSelectableAreaTypesObject}
				{areasCodesForAreasWithData}
				{visibleAreasWithData}
				{timePeriodsArray}
				{filteredChartDataForVisibleAreas}
				{selectedIndicatorCalculations}
				bind:chosenParentAreasArray
				bind:chosenRelatedAreasId
				bind:chosenSameRegionArray
				bind:chosenCountriesArray
				bind:chosenRegionsArray
				bind:chosenAllOtherArray
			></LineChartContainer>
		{/if}
	</div>
</div>

<style>
	.main-chart-container {
		margin: 0px;
		padding: 10px 10px 15px 10px;
		border-radius: 0px 5px 5px 5px;
		border-style: solid;
		border-width: 1px;
		border-color: rgb(128, 128, 128);
	}
</style>
