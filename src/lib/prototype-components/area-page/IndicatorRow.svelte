<script lang="ts">
	import TitleAdditionalDescription from '$lib/prototype-components/area-page/indicator-rows/TitleAdditionalDescription.svelte';
	import BeeswarmRowContainer from '$lib/prototype-components/area-page/indicator-rows/BeeswarmRowContainer.svelte';
	import LineChartRowContainer from '$lib/prototype-components/area-page/indicator-rows/LineChartRowContainer.svelte';

	export let topRow, indicator, metadata, filteredChartData, combinedSelectableAreaTypesObject;
	export let hoverId, hoverIndicatorId;

	$: selectedIndicatorCalculations = metadata.indicatorsCalculationsArray.find(
		(el) =>
			el.code === indicator.code &&
			el.period === indicator.maxXDomainNumb &&
			el.geog_level === combinedSelectableAreaTypesObject.selected.area.geogLevel
	);

	$: timePeriodsArray = metadata.periodsLookupArray.filter(
		(el) =>
			el.periodGroup === indicator.periodGroup &&
			el.xDomainNumb >= indicator.minXDomainNumb &&
			el.xDomainNumb <= indicator.maxXDomainNumb
	);

	$: areasCodesForAreasWithData = [...new Set(filteredChartData.map((el) => el.areacd))];

	$: visibleAreasWithData = [
		combinedSelectableAreaTypesObject.visible.primaryAreas,
		combinedSelectableAreaTypesObject.visible.relatedAreas
	].map((el) => el.filter((elm) => areasCodesForAreasWithData.includes(elm.areacd)));

	$: visibleAreasWithDataCodes = [...visibleAreasWithData[0], ...visibleAreasWithData[1]].map(
		(el) => el.areacd
	);

	$: filteredChartDataForPrimaryVisibleAreas = filteredChartData.filter((el) =>
		combinedSelectableAreaTypesObject.visible.primaryCodes.includes(el.areacd)
	);

	$: filteredChartDataForVisibleAreas = filteredChartData.filter((el) =>
		visibleAreasWithDataCodes.includes(el.areacd)
	);
</script>

<div class="indicator-row-container">
	<TitleAdditionalDescription
		titleText={indicator.metadata.label}
		unitDescriptionText={indicator.metadata.subText}
		additionalText={(
			indicator.metadata.subtitle +
			'|' +
			indicator.metadata.additionalDescription
		).split('|')}
	></TitleAdditionalDescription>

	<div class="visuals-container">
		<div class="beeswarm-container">
			<BeeswarmRowContainer
				{combinedSelectableAreaTypesObject}
				{topRow}
				{indicator}
				{selectedIndicatorCalculations}
				timePeriod={timePeriodsArray[0]}
				{visibleAreasWithData}
				filteredBackgroundChartData={filteredChartData.filter(
					(el) =>
						el.xDomainNumb === timePeriodsArray[0].xDomainNumb &&
						combinedSelectableAreaTypesObject.sameGeogLevel.codes.includes(el.areacd)
				)}
				filteredChartDataForVisibleAreas={filteredChartDataForPrimaryVisibleAreas.filter(
					(el) => el.xDomainNumb === timePeriodsArray[0].xDomainNumb
				)}
				bind:hoverId
				bind:hoverIndicatorId
			></BeeswarmRowContainer>
		</div>

		<div class="line-chart-container">
			{#if timePeriodsArray.length > 1}
				<LineChartRowContainer
					selectedIndicator={indicator}
					{metadata}
					{combinedSelectableAreaTypesObject}
					{areasCodesForAreasWithData}
					{visibleAreasWithData}
					{timePeriodsArray}
					{filteredChartDataForVisibleAreas}
					{selectedIndicatorCalculations}
				></LineChartRowContainer>
			{:else}
				<span>No historical data</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.indicator-container {
		display: flex;
		flex-direction: column;
	}

	.visuals-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 2%;
	}

	.beeswarm-container {
		width: 65%;
	}

	.line-chart-container {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		justify-content: center;
		width: 33%;
	}

	span {
		text-align: center;
	}
</style>
