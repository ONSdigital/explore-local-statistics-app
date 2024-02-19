<script lang="ts">
	import TitleAdditionalDescription from '$lib/prototype-components/area-page/indicator-rows/TitleAdditionalDescription.svelte';
	import BeeswarmRowContainer from '$lib/prototype-components/area-page/indicator-rows/BeeswarmRowContainer.svelte';
	import LineChartRowContainer from '$lib/prototype-components/area-page/indicator-rows/LineChartRowContainer.svelte';
	import Divider from '../layout/Divider.svelte';

	export let topRow,
		indicator,
		metadata,
		indicatorChartData,
		areasGroupsObject,
		backgroundAreasCodes;
	export let hoverId,
		hoverIndicatorId,
		chosenComparisonMeasureOrArea,
		chosenAdditionalComparisonAreasGroup,
		startXDomainNumb,
		endXDomainNumb;

	$: selectedAreaChartData = indicatorChartData
		? indicatorChartData.filter((el) => el.areacd === areasGroupsObject.selected.area.areacd)
		: null;
	$: selectedAreaPeriods = selectedAreaChartData
		? selectedAreaChartData.map((el) => el.xDomainNumb)
		: null;

	$: comparisonAreaChartData =
		indicatorChartData && chosenComparisonMeasureOrArea
			? 'label1' in chosenComparisonMeasureOrArea
				? metadata.indicatorsCalculationsArray
						.filter((el) => el.code === indicator.code && el.geog_level === 'lower')
						.map((el) => ({
							xDomainNumb: el.period,
							value: el.med
						}))
						.sort((a, b) => a.xDomainNumb - b.xDomainNumb)
				: indicatorChartData.filter((el) => el.areacd === chosenComparisonMeasureOrArea.areacd)
			: null;
	$: comparisonAreaPeriods = comparisonAreaChartData
		? comparisonAreaChartData.map((el) => el.xDomainNumb)
		: null;

	$: selectedAreaMinXDomain = selectedAreaPeriods ? Math.min(...selectedAreaPeriods) : null;
	$: selectedAreaMaxXDomain = selectedAreaPeriods ? Math.max(...selectedAreaPeriods) : null;

	$: timePeriodsArray = metadata.periodsLookupArray.filter(
		(el) =>
			el.periodGroup === indicator.periodGroup &&
			(isNaN(startXDomainNumb)
				? el.xDomainNumb >= selectedAreaMinXDomain
				: el.xDomainNumb >= startXDomainNumb) &&
			(isNaN(endXDomainNumb)
				? el.xDomainNumb <= selectedAreaMaxXDomain
				: el.xDomainNumb <= endXDomainNumb)
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

	$: selectedAreaFilteredChartData = selectedAreaChartData
		? selectedAreaChartData.filter(
				(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
			)
		: null;
	$: selectedAreaFilteredChartDataBeeswarm = selectedAreaFilteredChartData
		? selectedAreaFilteredChartData.find((el) => el.xDomainNumb === xDomain[1])
		: null;

	$: comparisonAreaFilteredChartData = comparisonAreaChartData
		? comparisonAreaChartData.filter(
				(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
			)
		: null;
	$: comparisonAreaFilteredChartDataBeeswarm =
		comparisonAreaFilteredChartData &&
		comparisonAreaFilteredChartData.find((el) => parseFloat(el.xDomainNumb) === xDomain[1])
			? {
					...comparisonAreaFilteredChartData.find(
						(el) => parseFloat(el.xDomainNumb) === xDomain[1]
					),
					role:
						'role' in chosenComparisonMeasureOrArea ? chosenComparisonMeasureOrArea.role : 'median'
				}
			: null;

	$: backgroundChartData =
		filteredChartData && backgroundAreasCodes
			? filteredChartData.filter((el) => backgroundAreasCodes.includes(el.areacd))
			: null;
	$: backgroundChartDataBeeswarm = backgroundChartData
		? backgroundChartData.filter((el) => el.xDomainNumb === xDomain[1])
		: null;

	$: timePeriod = timePeriodsArray.find((el) => el.xDomainNumb == xDomain[1]);

	$: hoverChartData = hoverId ? filteredChartData.filter((el) => el.areacd === hoverId) : [];

	$: console.log(indicator.metadata.subText);
</script>

<div class="indicator-row-container">
	<TitleAdditionalDescription
		showVisuals={selectedAreaFilteredChartDataBeeswarm || comparisonAreaFilteredChartDataBeeswarm}
		titleText={indicator.metadata.label}
		{xDomain}
		{selectedAreaMinXDomain}
		{selectedAreaMaxXDomain}
		unitDescriptionText={indicator.metadata.subText}
		additionalText={(
			indicator.metadata.subtitle +
			'|' +
			indicator.metadata.additionalDescription
		).split('|')}
	></TitleAdditionalDescription>
</div>

<div class="indicator-row-container">
	{#if selectedAreaFilteredChartDataBeeswarm || comparisonAreaFilteredChartDataBeeswarm}
		<div class="visuals-container">
			<div class="beeswarm-container">
				{#if backgroundChartDataBeeswarm}
					<BeeswarmRowContainer
						{metadata}
						{indicator}
						{topRow}
						{areasGroupsObject}
						bind:hoverId
						bind:hoverIndicatorId
						{timePeriod}
						{selectedIndicatorCalculations}
						{selectedAreaFilteredChartDataBeeswarm}
						{comparisonAreaFilteredChartDataBeeswarm}
						{backgroundChartDataBeeswarm}
						{chosenComparisonMeasureOrArea}
					></BeeswarmRowContainer>
				{/if}
			</div>

			<Divider orientation="vertical"></Divider>

			<div class="line-chart-container">
				{#if selectedAreaFilteredChartData || comparisonAreaFilteredChartData}
					{#if xDomain[0] != xDomain[1] && (selectedAreaChartData.length > 1 || comparisonAreaFilteredChartData.length > 1)}
						<LineChartRowContainer
							{metadata}
							{indicator}
							{topRow}
							{areasGroupsObject}
							bind:hoverId
							bind:hoverIndicatorId
							{hoverChartData}
							{timePeriodsArray}
							{xDomain}
							{selectedIndicatorCalculations}
							{selectedAreaFilteredChartData}
							{comparisonAreaFilteredChartData}
							{backgroundChartData}
							{chosenComparisonMeasureOrArea}
						></LineChartRowContainer>
					{:else}
						<span>No historical<br />data</span>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.indicator-row-container {
		padding: 0px;
		display: flex;
		flex-direction: column;
	}

	.visuals-container {
		margin: 0px 0px 5px 0px;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 2%;
	}

	.beeswarm-container {
		width: 64%;
	}

	.line-chart-container {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		justify-content: center;
		width: 34%;
	}

	span {
		text-align: center;
		font-size: 16px;
		line-height: 20px;
		font-weight: bold;
	}

	.no-data-text {
		font-weight: bold;
	}
</style>
