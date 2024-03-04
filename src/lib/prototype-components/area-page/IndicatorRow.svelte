<script lang="ts">
	import TitleAdditionalDescription from '$lib/prototype-components/area-page/indicator-rows/TitleAdditionalDescription.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';
	import BeeswarmRowContainer from '$lib/prototype-components/area-page/indicator-rows/BeeswarmRowContainer.svelte';
	import LineChartRowContainer from '$lib/prototype-components/area-page/indicator-rows/LineChartRowContainer.svelte';

	export let hoverAreaId,
		hoverIndicatorId,
		indicator,
		metadata,
		indicatorChartData,
		selectedArea,
		selectionsObject,
		startXDomainNumb,
		endXDomainNumb;

	$: selectedAreaChartData = indicatorChartData
		? indicatorChartData.filter((el) => el.areacd === selectedArea.areacd)
		: null;
	$: selectedAreaPeriods = selectedAreaChartData
		? selectedAreaChartData.map((el) => el.xDomainNumb)
		: [];

	$: comparisonAreaChartData =
		indicatorChartData && selectionsObject['areas-rows-comparison-visible']
			? 'label' in selectionsObject['areas-rows-comparison-visible']
				? metadata.indicatorsCalculationsArray
						.filter((el) => el.code === indicator.code && el.geog_level === selectedArea.geogLevel)
						.map((el) => ({
							xDomainNumb: el.period,
							value: el.med
						}))
						.sort((a, b) => a.xDomainNumb - b.xDomainNumb)
				: indicatorChartData.filter(
						(el) => el.areacd === selectionsObject['areas-rows-comparison-visible'].areacd
					)
			: null;

	$: comparisonAreaPeriods = comparisonAreaChartData
		? comparisonAreaChartData.map((el) => el.xDomainNumb)
		: [];

	$: selectedAreaAndComparisonMinXDomain =
		selectedAreaPeriods || comparisonAreaPeriods
			? Math.min(...selectedAreaPeriods, ...comparisonAreaPeriods)
			: null;
	$: selectedAreaAndComparisonMaxXDomain =
		selectedAreaPeriods || comparisonAreaPeriods
			? Math.max(...selectedAreaPeriods, ...comparisonAreaPeriods)
			: null;

	$: timePeriodsArray = metadata.periodsLookupArray.filter(
		(el) =>
			el.periodGroup === indicator.periodGroup &&
			(isNaN(startXDomainNumb)
				? el.xDomainNumb >= selectedAreaAndComparisonMinXDomain
				: el.xDomainNumb >= Math.max(selectedAreaAndComparisonMinXDomain, startXDomainNumb)) &&
			(isNaN(endXDomainNumb)
				? el.xDomainNumb <= selectedAreaAndComparisonMaxXDomain
				: el.xDomainNumb <= Math.min(selectedAreaAndComparisonMaxXDomain, endXDomainNumb))
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
					role: selectionsObject['areas-rows-comparison-visible'].role
				}
			: null;

	$: backgroundChartData =
		filteredChartData && selectionsObject['related-rows-visible']
			? filteredChartData.filter((el) =>
					selectionsObject['related-rows-visible'].codes.includes(el.areacd)
				)
			: null;
	$: backgroundChartDataBeeswarm = backgroundChartData
		? backgroundChartData.filter((el) => el.xDomainNumb === xDomain[1])
		: null;

	$: latestTimePeriod = timePeriodsArray.find((el) => el.xDomainNumb == xDomain[1]);

	$: hoverChartData =
		hoverAreaId && filteredChartData
			? filteredChartData.filter((el) => el.areacd === hoverAreaId)
			: [];
</script>

<div class="indicator-row-container">
	<TitleAdditionalDescription
		showVisuals={selectedAreaFilteredChartDataBeeswarm || comparisonAreaFilteredChartDataBeeswarm}
		titleText={indicator.metadata.label}
		{xDomain}
		{selectedAreaAndComparisonMinXDomain}
		{selectedAreaAndComparisonMaxXDomain}
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
						{selectedIndicatorCalculations}
						{backgroundChartDataBeeswarm}
						timePeriod={latestTimePeriod}
						{selectedAreaFilteredChartDataBeeswarm}
						{comparisonAreaFilteredChartDataBeeswarm}
						bind:hoverId={hoverAreaId}
						bind:hoverIndicatorId
						{selectionsObject}
						{selectedArea}
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
							{selectionsObject}
							bind:hoverId={hoverAreaId}
							bind:hoverIndicatorId
							{timePeriodsArray}
							{hoverChartData}
							{xDomain}
							{selectedIndicatorCalculations}
							{selectedAreaFilteredChartData}
							{comparisonAreaFilteredChartData}
							{backgroundChartData}
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
