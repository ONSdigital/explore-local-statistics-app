<script lang="ts">
	import ChartOptions from '$lib/prototype-components/ChartOptions.svelte';
	import LineChartContainer from '$lib/prototype-components/area-page/main-chart/LineChartContainer.svelte';
	import ContentBlock from '$lib/components/ContentBlock.svelte';
	import { geoTypeMap, geoTypesLookup } from '$lib/config/geoConfig';

	export let metadata,
		indicator,
		chartData,
		customLookup,
		selectionsObject,
		showConfidenceIntervals,
		chosenXDomain,
		chosenTimePeriodDropdownLabel,
		chosenStartTimePeriod,
		chosenTimePeriodsArray,
		timePeriodsArray;

	const getUnit = (ind) => ind.subText || ind.suffix || ind.prefix;

	$: console.log('chartData', chartData);

	$: indicatorCalculationsArray = metadata['_newStyleIndicatorsCalculationsArray'].filter(
		(el) => el.code === indicator.code
	);

	$: latestIndicatorCalculations = indicatorCalculationsArray.find(
		(el) => el.period === indicator.maxXDomainNumb
	);

	$: indicatorCalculations =
		latestIndicatorCalculations && 'calcsByGeogLevel' in latestIndicatorCalculations
			? latestIndicatorCalculations.calcsByGeogLevel[
					'lower' in latestIndicatorCalculations.calcsByGeogLevel
						? 'lower'
						: 'upper' in latestIndicatorCalculations.calcsByGeogLevel
							? 'upper'
							: 'region' in latestIndicatorCalculations.calcsByGeogLevel
								? 'region'
								: 'country'
				]
			: null;

	$: filteredChartData = chartData.filter((el) => el.value);

	$: filteredChartDataSelected = [];

	$: filteredChartDataAdditionals = filteredChartData.filter((el) =>
		selectionsObject['indicator-additional-chosen'].includes(el.areacd)
	);
	$: filteredChartDataAreaGroup = selectionsObject['indicator-related-visible']
		? filteredChartData.filter(
				(el) =>
					selectionsObject['indicator-related-visible'].codes.includes(el.areacd) &&
					!selectionsObject['indicator-additional-chosen'].includes(el.areacd)
			)
		: [];

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

	$: combinedChartData = [
		...filteredChartDataSelected,
		...filteredChartDataAdditionals,
		...filteredChartDataAreaGroup
	];

	$: unselectedAreas = selectionsObject['indicator-additional-visible'].filter(
		(el) => combinedChartData.find((elm) => elm.areacd === el.areacd) === undefined
	);

	$: embedProps = {
		type: 'line',
		geo:
			geoTypeMap[selectionsObject['indicator-related-chosen']] ||
			selectionsObject['indicator-related-chosen'],
		years: chosenXDomain.join('-'),
		areas: selectionsObject['indicator-additional-chosen'].join(','),
		intervals: showConfidenceIntervals
	};
	$: geoCodes =
		embedProps.geo && embedProps.geo !== 'none' ? geoTypesLookup[embedProps.geo].codes : [];
	$: csvData =
		embedProps.geo === 'none'
			? chartData.filter(
					(d) =>
						selectionsObject['indicator-additional-chosen'].includes(d.areacd) &&
						d.xDomainNumb >= chosenXDomain[0] &&
						d.xDomainNumb <= chosenXDomain[1]
				)
			: chartData.filter(
					(d) =>
						(selectionsObject['indicator-additional-chosen'].includes(d.areacd) ||
							geoCodes.includes(d.areacd.slice(0, 3))) &&
						d.xDomainNumb >= chosenXDomain[0] &&
						d.xDomainNumb <= chosenXDomain[1]
				);
</script>

{#if selectionsObject['indicator-additional-visible'].length === 0 && !selectionsObject['indicator-related-visible']}
	<ContentBlock showActions={false}>
		<div class="no-chart-container">
			<p>No areas selected. Select areas to view time series data.</p>
		</div>
	</ContentBlock>
{:else if timePeriodsArray.length <= 1}
	<ContentBlock showActions={false}>
		<div class="no-chart-container">
			<p>
				No <span style="font-weight: bold;">{indicator.metadata.label}</span> time series data to display.
			</p>
		</div>
	</ContentBlock>
{:else if chosenTimePeriodsArray.length === 0}
	<ContentBlock showActions={false}>
		<div class="no-chart-container">
			<p>
				No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to display for {chosenXDomainNumbEnd}.
			</p>
		</div>
	</ContentBlock>
{:else if chosenTimePeriodsArray.length === 1}
	<ContentBlock showActions={false}>
		<div class="no-chart-container">
			<p>
				Time series not displayed as selected date range includes only one time period with <span
					style="font-weight: bold;">{indicator.metadata.label}</span
				> data.
			</p>
		</div>
	</ContentBlock>
{:else if !combinedChartData || combinedChartData.length === 0}
	<ContentBlock showActions={false}>
		<div class="no-chart-container">
			<p>
				No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to display for
				selected areas between
				<span style="font-weight: bold;"
					>{chosenTimePeriodsArray[chosenTimePeriodsArray.length - 1].label}</span
				>
				and <span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
			</p>
		</div>
	</ContentBlock>
{:else}
	<ContentBlock
		title={indicator.metadata.label}
		{indicator}
		{metadata}
		data={csvData}
		{embedProps}
		unit={getUnit(indicator.metadata) === 'in millions' ? getUnit(indicator.metadata) : null}
	>
		<p class="subtitle">
			{indicator.metadata.subtitle}, {chosenStartTimePeriod.label} to {chosenTimePeriodDropdownLabel}
		</p>
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
			filteredChartDataAreaGroupLatest={filteredChartDataAreaGroup.filter(
				(el) => el.xDomainNumb === xDomain[1]
			)}
			{selectionsObject}
			selectedArea={null}
			additionalID="indicator-additional"
			relatedID="indicator-related"
			{indicatorCalculations}
			{xDomain}
			{customLookup}
			{showConfidenceIntervals}
		></LineChartContainer>
	</ContentBlock>
{/if}

<style>
	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
	}

	.align-right-container {
		justify-content: end;
	}

	.no-chart-container {
		margin: 0px 10px;
		height: 500px;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		text-wrap: balance;
		text-align: center;
	}

	.source-notes-container {
		font-size: 16px;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.notes-container {
		padding: 0px;
		margin: 0px;
		line-height: 1;
	}
</style>
