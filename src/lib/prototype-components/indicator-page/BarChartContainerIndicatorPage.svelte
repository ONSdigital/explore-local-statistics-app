<script lang="ts">
	import ChartOptions from '$lib/prototype-components/ChartOptions.svelte';
	import BarChartContainer from '$lib/prototype-components/area-page/main-chart/BarChartContainer.svelte';
	import ContentBlock from '$lib/components/ContentBlock.svelte';

	export let metadata,
		indicator,
		chartData,
		customLookup,
		selectionsObject,
		chosenXDomain,
		showConfidenceIntervals,
		chosenTimePeriodDropdownLabel,
		timePeriodsArray,
		chosenTimePeriodsArray;

	const getUnit = (ind) => ind.subText || ind.suffix || ind.prefix;

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

	$: filteredChartDataSelectedLatest = filteredChartDataSelected.filter(
		(el) => el.xDomainNumb === xDomain[1]
	);

	$: filteredChartDataAdditionalsLatest = filteredChartDataAdditionals.filter(
		(el) => el.xDomainNumb === xDomain[1]
	);
	$: filteredChartDataAreaGroupLatest = filteredChartDataAreaGroup.filter(
		(el) => el.xDomainNumb === xDomain[1]
	);

	$: combinedChartDataLatest = [
		...filteredChartDataSelectedLatest,
		...filteredChartDataAdditionalsLatest,
		...filteredChartDataAreaGroupLatest
	];

	$: unselectedAreasLatest = selectionsObject['indicator-additional-visible'].filter(
		(el) => combinedChartDataLatest.find((elm) => elm.areacd === el.areacd) === undefined
	);

	$: embedProps = {
		type: 'bar',
		geo: selectionsObject['indicator-related-chosen'],
		years: chosenXDomain[1],
		areas: selectionsObject['indicator-additional-chosen'].join(','),
		intervals: showConfidenceIntervals
	};
</script>

{#if selectionsObject['indicator-additional-visible'].length === 0 && !selectionsObject['indicator-related-visible']}
	<ContentBlock>
		<div class="no-chart-container">
			<p>No areas selected. Select areas to view time series data.</p>
		</div>
	</ContentBlock>
{:else if !indicator.years.includes(chosenXDomain[1])}
	<ContentBlock>
		<div class="no-chart-container">
			<p>
				No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to display for
				<span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
			</p>
		</div>
	</ContentBlock>
{:else if !combinedChartDataLatest || combinedChartDataLatest.length === 0}
	<ContentBlock>
		<div class="no-chart-container">
			<p>
				No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to display for
				selected areas for
				<span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
			</p>
		</div>
	</ContentBlock>
{:else}
	<ContentBlock title={indicator.metadata.label} {indicator} data={[]} {embedProps}>
		<p class="subtitle">
			{indicator.metadata.subtitle}, {chosenTimePeriodDropdownLabel}
		</p>
		<BarChartContainer
			{indicator}
			{metadata}
			latestPeriod={timePeriodsArray.find((el) => el.xDomainNumb === xDomain[1])}
			filteredChartDataSelected={filteredChartDataSelectedLatest}
			filteredChartDataAdditionals={filteredChartDataAdditionalsLatest}
			filteredChartDataAreaGroup={filteredChartDataAreaGroupLatest}
			{selectionsObject}
			selectedArea={null}
			{indicatorCalculations}
			{xDomain}
			{customLookup}
			{showConfidenceIntervals}
			combinedChartData={combinedChartDataLatest}
			additionalID="indicator-additional"
			relatedID="indicator-related"
		></BarChartContainer>
		<div class="source-notes-container">
			{#if unselectedAreasLatest.length > 0}
				<p class="notes-container">
					<span style="font-weight: bold">Note:</span>
					No data to display for{#each unselectedAreasLatest as area, i}
						{' ' +
							area.areanm +
							(i === unselectedAreasLatest.length - 2 && unselectedAreasLatest.length > 1
								? ' and'
								: i != unselectedAreasLatest.length - 1
									? ','
									: '')}{/each} for {chosenTimePeriodsArray[0].label}.
				</p>
			{/if}
		</div>
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
