<script lang="ts">
	import TitleAdditionalDescription from '$lib/prototype-components/area-page/indicator-rows/TitleAdditionalDescription.svelte';

	export let topRow, indicator, metadata, indicatorChartData, areasGroupsObject;
	export let hoverId,
		hoverIndicatorId,
		chosenComparisonMeasureOrArea,
		chosenAdditionalComparisonAreasGroup,
		startXDomainNumb,
		endXDomainNumb;

	$: timePeriodsArray = metadata.periodsLookupArray.filter(
		(el) =>
			el.periodGroup === indicator.periodGroup &&
			(isNaN(startXDomainNumb) ? true : el.xDomainNumb >= startXDomainNumb) &&
			(isNaN(endXDomainNumb) ? true : el.xDomainNumb <= endXDomainNumb)
	);

	$: xDomain = [
		timePeriodsArray.length > 0 ? Math.min(...timePeriodsArray.map((el) => el.xDomainNumb)) : null,
		timePeriodsArray.length > 0 ? Math.max(...timePeriodsArray.map((el) => el.xDomainNumb)) : null
	];

	$: selectedIndicatorCalculations = xDomain[1]
		? metadata.indicatorsCalculationsArray.find(
				(el) =>
					el.code === indicator.code &&
					parseFloat(el.period) === xDomain[1] &&
					el.geog_level === 'lower'
			)
		: null;

	$: filteredChartData =
		xDomain[1] && xDomain[0]
			? indicatorChartData.filter(
					(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
				)
			: null;

	$: console.log(chosenComparisonMeasureOrArea);

	$: selectedAreaChartData = filteredChartData
		? filteredChartData.filter(
				(el) =>
					el.xDomainNumb >= xDomain[0] &&
					el.xDomainNumb <= xDomain[1] &&
					el.areacd === areasGroupsObject.selected.area.areacd
			)
		: null;

	$: comparisonAreaChartData =
		filteredChartData && chosenComparisonMeasureOrArea
			? 'label1' in chosenComparisonMeasureOrArea
				? metadata.indicatorsCalculationsArray
						.filter(
							(el) =>
								el.code === indicator.code &&
								el.period >= xDomain[0] &&
								el.period <= xDomain[1] &&
								el.geog_level === 'lower'
						)
						.map((el) => ({
							xDomainNumb: el.period,
							value: el.med
						}))
				: filteredChartData.filter(
						(el) =>
							el.xDomainNumb >= xDomain[0] &&
							el.xDomainNumb <= xDomain[1] &&
							el.areacd === chosenComparisonMeasureOrArea.areacd
					)
			: null;

	$: backgroundChartData = 100;

	/*$: areasCodesForAreasWithData = [...new Set(filteredChartData.map((el) => el.areacd))];

	$: visibleAreasWithData = [
		areasGroupsObject.visible.primaryAreas,
		areasGroupsObject.visible.relatedAreas
	].map((el) => el.filter((elm) => areasCodesForAreasWithData.includes(elm.areacd)));

	$: visibleAreasWithDataCodes = [...visibleAreasWithData[0], ...visibleAreasWithData[1]].map(
		(el) => el.areacd
	);

	$: filteredChartDataForPrimaryVisibleAreas = filteredChartData.filter((el) =>
		areasGroupsObject.visible.primaryCodes.includes(el.areacd)
	);

	$: filteredChartDataForVisibleAreas = filteredChartData.filter((el) =>
		visibleAreasWithDataCodes.includes(el.areacd)
	);*/
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
</div>

<!-- <div class="indicator-row-container">

	<div class="visuals-container">
		<div class="beeswarm-container">
			<BeeswarmRowContainer
				{areasGroupsObject}
				{topRow}
				{indicator}
				{selectedIndicatorCalculations}
				timePeriod={timePeriodsArray[0]}
				{visibleAreasWithData}
				filteredBackgroundChartData={filteredChartData.filter(
					(el) =>
						el.xDomainNumb === timePeriodsArray[0].xDomainNumb &&
						areasGroupsObject.sameGeogLevel.codes.includes(el.areacd)
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
					{areasGroupsObject}
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
</div> -->

<style>
	.indicator-row-container {
		padding: 0px 0px 5px 0px;
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
