<script lang="ts">
	import { Tabs, Tab, Select } from '@onsvisual/svelte-components';
	import SubtitleAdditionalDescription from '$lib/prototype-components/area-page/main-chart/SubtitleAdditionalDescription.svelte';
	import LineChartContainer from '$lib/prototype-components/area-page/main-chart/LineChartContainer.svelte';
	import BarChartContainer from '$lib/prototype-components/area-page/main-chart/BarChartContainer.svelte';
	import ChangeAreas from '$lib/prototype-components/change-areas/ChangeAreas.svelte';
	import ChartOptions from '$lib/prototype-components/ChartOptions.svelte';
	import ChartInfo from '$lib/prototype-components/area-page/indicator-rows/ChartInfo.svelte';

	import { mainChartOptionsArray } from '$lib/config';

	export let customLookup,
		selectionsObject,
		filteredIndicators,
		chartData,
		metadata,
		selectedArea,
		chosenIndicatorId,
		accordionArray;

	let chosenXDomain = [metadata.globalXDomainExtent[0], metadata.globalXDomainExtent[1]];

	let showConfidenceIntervals = false;

	$: indicator = metadata.indicatorsObject[chosenIndicatorId.code];
	$: indicatorCalculations = metadata.indicatorsCalculationsArray.find(
		(el) =>
			el.code === indicator.code &&
			el.period === indicator.maxXDomainNumb &&
			el.geog_level === 'lower'
	);

	$: console.log(indicator);

	/*$: chartOptionsArray = mainChartOptionsArray.filter(
		(el) => indicator.minXDomainNumb != indicator.maxXDomainNumb || el.multiYear != 'Yes'
	);*/
	$: chartOptionsArray = mainChartOptionsArray;
	$: chosenChartId =
		chartOptionsArray.find((el) => el.id === chosenChartId) === undefined
			? chartOptionsArray[0].id
			: chosenChartId;
	$: selectedChartType = chartOptionsArray.find((el) => el.id === chosenChartId);

	$: filteredChartData = chartData.combinedDataObject[indicator.code].filter((el) => el.value);

	$: filteredChartDataSelected = [
		...new Set(filteredChartData.filter((el) => el.areacd === selectedArea.areacd))
	];

	$: filteredChartDataAdditionals = filteredChartData.filter((el) =>
		selectionsObject['areas-single-additional-chosen'].includes(el.areacd)
	);
	$: filteredChartDataAreaGroup = selectionsObject['related-single-visible']
		? filteredChartData.filter(
				(el) =>
					selectionsObject['related-single-visible'].codes.includes(el.areacd) &&
					!selectionsObject['areas-single-additional-chosen'].includes(el.areacd) &&
					el.areacd != selectedArea.areacd
			)
		: [];

	$: console.log(filteredChartDataAreaGroup);

	$: visibleAreasPeriods = [
		...new Set(
			[
				...filteredChartDataAdditionals,
				...filteredChartDataAreaGroup,
				...filteredChartDataSelected
			].map((el) => el.xDomainNumb)
		)
	];
	$: visibleAreasXDomain = [Math.min(...visibleAreasPeriods), Math.max(...visibleAreasPeriods)];

	$: xDomainInit = [
		Math.min(
			chosenXDomain[1],
			chosenXDomain[0] > visibleAreasXDomain[0] ? chosenXDomain[0] : visibleAreasXDomain[0]
		),
		Math.max(
			chosenXDomain[0],
			chosenXDomain[1] < visibleAreasXDomain[1] ? chosenXDomain[1] : visibleAreasXDomain[1]
		)
	];

	$: xDomain = [
		Math.min(...visibleAreasPeriods.filter((el) => el >= xDomainInit[0])),
		Math.max(...visibleAreasPeriods.filter((el) => el <= xDomainInit[1]))
	];

	$: timePeriodsArray = metadata.periodsLookupArray.filter(
		(el) =>
			el.periodGroup === indicator.periodGroup &&
			el.xDomainNumb >= xDomain[0] &&
			el.xDomainNumb <= xDomain[1]
	);

	/*export let combinedSelectableAreaTypesObject,
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
	);*/
</script>

<Tabs border bind:selected={chosenChartId}>
	{#each chartOptionsArray as chart}
		<Tab title={chart.label} id={chart.id} hideTitle>
			<div class="row-container title-buttons-container">
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

				<div class="row-container buttons-container">
					<ChangeAreas {selectedArea} {accordionArray} bind:selectionsObject {customLookup}
					></ChangeAreas>

					<ChartOptions {metadata} bind:chosenXDomain bind:showConfidenceIntervals></ChartOptions>
				</div>
			</div>

			<SubtitleAdditionalDescription
				selectedIndicator={indicator}
				{xDomain}
				{timePeriodsArray}
				selectedChartType={chart}
			></SubtitleAdditionalDescription>

			<div class="chart-container">
				{#if timePeriodsArray.length === 0}
					<div class="no-chart-container">
						<p>No data for selected areas over time period</p>
					</div>
				{:else if chart.label === 'Time series'}
					{#if timePeriodsArray.length > 1}
						<LineChartContainer
							{indicator}
							{metadata}
							{timePeriodsArray}
							filteredChartDataSelected={filteredChartDataSelected.filter(
								(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
							)}
							filteredChartDataAdditionals={filteredChartDataAdditionals.filter(
								(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
							)}
							filteredChartDataAreaGroup={filteredChartDataAreaGroup.filter(
								(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
							)}
							{selectionsObject}
							{selectedArea}
							{indicatorCalculations}
							{xDomain}
							{customLookup}
							{showConfidenceIntervals}
							additionalID="areas-single-additional"
							relatedID="related-single"
						></LineChartContainer>
					{:else}
						<div class="no-chart-container">
							<p>No data for selected areas prior to {timePeriodsArray[0].label}</p>
						</div>
					{/if}

					<!-- <LineChartContainer
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
					></LineChartContainer> -->
				{:else if chart.label === 'Bar chart'}
					<BarChartContainer
						{indicator}
						{metadata}
						latestPeriod={timePeriodsArray.find((el) => el.xDomainNumb === xDomain[1])}
						filteredChartDataSelected={filteredChartDataSelected.filter(
							(el) => el.xDomainNumb === xDomain[1]
						)}
						filteredChartDataAdditionals={filteredChartDataAdditionals.filter(
							(el) => el.xDomainNumb === xDomain[1]
						)}
						filteredChartDataAreaGroup={filteredChartDataAreaGroup.filter(
							(el) => el.xDomainNumb === xDomain[1]
						)}
						{selectionsObject}
						{selectedArea}
						{indicatorCalculations}
						{xDomain}
						{customLookup}
						{showConfidenceIntervals}
						additionalID="areas-single-additional"
						relatedID="related-single"
					></BarChartContainer>

					<!-- <BarChartContainer
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
					></BarChartContainer> -->
				{/if}
			</div>
		</Tab>
	{/each}
</Tabs>

<!-- <Tabs border bind:selected={chosenChartId}>
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
</Tabs> -->

<style>
	:global(.ons-tabs) {
		margin-bottom: 0;
	}

	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 4px;
	}

	.title-buttons-container {
		justify-content: space-between;
	}

	.no-chart-container {
		height: 500px;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		font-weight: bold;
	}
</style>
