<script lang="ts">
	import { Tabs, Tab, Select } from '@onsvisual/svelte-components';
	import SubtitleAdditionalDescription from '$lib/prototype-components/area-page/main-chart/SubtitleAdditionalDescription.svelte';
	import LineChartContainer from '$lib/prototype-components/area-page/main-chart/LineChartContainer.svelte';
	import BarChartContainer from '$lib/prototype-components/area-page/main-chart/BarChartContainer.svelte';

	import { mainChartOptionsArray } from '$lib/config';

	export let combinedSelectableAreaTypesObject,
		chartData,
		metadata,
		chosenIndicatorId,
		filteredIndicators;
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
			el.geog_level === 'lower'
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
	$: selectedChartType = chartOptionsArray.find((el) => el.id === chosenChartId);

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

<Tabs border bind:selected={chosenChartId}>
	{#each chartOptionsArray as chart}
		<Tab title={chart.label} id={chart.id} hideTitle>
			<Select
				id="select-indicator"
				options={filteredIndicators}
				idKey="code"
				labelKey="label"
				groupKey="topic"
				clusterByGroup
				clearable={false}
				bind:value={chosenIndicatorId}
			></Select>

			<SubtitleAdditionalDescription
				{selectedIndicator}
				{timePeriodsArray}
				selectedChartType={chart}
			></SubtitleAdditionalDescription>

			<div class="chart-container">
				{#if chart.label === 'Time series'}
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
				{:else if chart.label === 'Bar chart'}
					<BarChartContainer
						{selectedIndicator}
						{metadata}
						{combinedSelectableAreaTypesObject}
						{areasCodesForAreasWithData}
						{visibleAreasWithData}
						{timePeriodsArray}
						filteredChartDataForVisibleAreas={filteredChartDataForVisibleAreas.filter(
							(el) => el.xDomainNumb === timePeriodsArray[0].xDomainNumb
						)}
						{selectedIndicatorCalculations}
						bind:chosenParentAreasArray
						bind:chosenRelatedAreasId
						bind:chosenSameRegionArray
						bind:chosenCountriesArray
						bind:chosenRegionsArray
						bind:chosenAllOtherArray
					></BarChartContainer>
				{:else}
					{chart.label} not currently available.
				{/if}
			</div>
		</Tab>
	{/each}
</Tabs>

<style>
	:global(.ons-tabs) {
		margin-bottom: 0;
	}
</style>
