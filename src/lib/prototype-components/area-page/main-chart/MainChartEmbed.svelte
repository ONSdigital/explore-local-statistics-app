<script lang="ts">
	import SubtitleAdditionalDescription from '$lib/prototype-components/area-page/main-chart/SubtitleAdditionalDescription.svelte';
	import LineChartContainer from '$lib/prototype-components/area-page/main-chart/LineChartContainer.svelte';
	import BarChartContainer from '$lib/prototype-components/area-page/main-chart/BarChartContainer.svelte';
	import Map from '$lib/viz/Map.svelte';
	import { makeMapData } from '$lib/util/datasets/datasetsHelpers';
	import { mainChartOptionsArray } from '$lib/config';

	export let customLookup,
		selectionsObject,
		chartData,
		metadata,
		selectedArea,
		indicator,
		chartType,
		geoGroup,
		chosenXDomainNumbStart,
		chosenXDomainNumbEnd,
		showConfidenceIntervals = false;

	$: selectedChartType =
		chartType === 'table'
			? { id: 'table', label: 'Table', multiYear: 'Either' }
			: mainChartOptionsArray.find((c) => c.id === chartType);
	$: chosenXDomain = [chosenXDomainNumbStart, chosenXDomainNumbEnd];

	$: mapData =
		geoGroup?.codes && chosenXDomainNumbEnd && indicator.years.includes(chosenXDomainNumbEnd)
			? makeMapData(
					chartData.combinedDataObject[indicator.code],
					geoGroup?.codes,
					chosenXDomainNumbEnd
				)
			: { data: [], breaks: [] };

	$: indicatorCalculationsArray = indicator
		? metadata['_newStyleIndicatorsCalculationsArray'].filter((el) => el.code === indicator.code)
		: null;

	$: latestIndicatorCalculations = indicatorCalculationsArray
		? indicatorCalculationsArray.find((el) => el.period === indicator.maxXDomainNumb)
		: null;

	$: indicatorCalculations = latestIndicatorCalculations
		? latestIndicatorCalculations.calcsByGeogLevel[
				selectedArea.geogLevel in latestIndicatorCalculations.calcsByGeogLevel
					? selectedArea.geogLevel
					: 'lower' in latestIndicatorCalculations.calcsByGeogLevel
						? 'lower'
						: 'upper' in latestIndicatorCalculations.calcsByGeogLevel
							? 'upper'
							: 'region' in latestIndicatorCalculations.calcsByGeogLevel
								? 'region'
								: 'country'
			]
		: null;

	$: filteredChartData = chartData.combinedDataObject[indicator.code].filter(
		(el) =>
			el.value && el.xDomainNumb >= chosenXDomainNumbStart && el.xDomainNumb <= chosenXDomainNumbEnd
	);

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

	$: combinedChartData = [
		...filteredChartDataSelected,
		...filteredChartDataAdditionals,
		...filteredChartDataAreaGroup
	];

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
			el.xDomainNumb >= indicator.minXDomainNumb &&
			el.xDomainNumb <= indicator.maxXDomainNumb
	);

	$: chosenTimePeriodsArray = timePeriodsArray.filter(
		(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
	);

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

	$: sourceOrgs = indicator.metadata.sourceOrg.split('|');
	$: sourceLinks = indicator.metadata.sourceURL.split('|');

	let chosenTimePeriodDropdownLabel;

	$: unselectedAreasLatest = [
		selectedArea,
		...selectionsObject['areas-single-additional-visible']
	].filter((el) => combinedChartDataLatest.find((elm) => elm.areacd === el.areacd) === undefined);
	$: unselectedAreas = [
		selectedArea,
		...selectionsObject['areas-single-additional-visible']
	].filter((el) => combinedChartData.find((elm) => elm.areacd === el.areacd) === undefined);
</script>

{#if chartType === 'line'}
	{#if timePeriodsArray.length <= 1}
		<div class="no-chart-container">
			<p>
				No <span style="font-weight: bold;">{indicator.metadata.label}</span> time series data to display.
			</p>
		</div>
	{:else if chosenTimePeriodsArray.length === 0}
		<div class="no-chart-container">
			<p>
				No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to display for {chosenXDomainNumbEnd}.
			</p>
		</div>
	{:else if chosenTimePeriodsArray.length === 1}
		<div class="no-chart-container">
			<p>
				Time series not displayed as selected date range includes only one time period with <span
					style="font-weight: bold;">{indicator.metadata.label}</span
				> data.
			</p>
		</div>
	{:else if !combinedChartData || combinedChartData.length === 0}
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
	{:else}
		<div class="title-container">
			<SubtitleAdditionalDescription
				selectedIndicator={indicator}
				{xDomain}
				timePeriodsArray={chosenTimePeriodsArray}
				{selectedChartType}
				showInfo={false}
			></SubtitleAdditionalDescription>
		</div>
		<div class="chart-container">
			<LineChartContainer
				{indicator}
				{metadata}
				timePeriodsArray={chosenTimePeriodsArray}
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
		</div>
		<div class="source-notes-container">
			<p class="source-container">
				<span style="font-weight: bold">Source:</span>
				{#each sourceOrgs as org, i}
					<a href={sourceLinks[i]}>{org}</a>

					{#if i < sourceOrgs.length - 2}
						,
					{:else if i === sourceOrgs.length - 2}
						{'and '}
					{/if}
				{/each}
			</p>
			{#if unselectedAreas.length > 0}
				<p class="notes-container">
					<span style="font-weight: bold">Note:</span>
					No data to display for{#each unselectedAreas as area, i}
						{' ' +
							area.areanm +
							(i === unselectedAreas.length - 2 && unselectedAreas.length > 1
								? ' and'
								: i != unselectedAreas.length - 1
									? ','
									: '')}{/each} between {chosenTimePeriodsArray[chosenTimePeriodsArray.length - 1]
						.label} and {chosenTimePeriodsArray[0].label}.
				</p>
			{/if}
		</div>
	{/if}
{:else if chartType === 'bar'}
	{#if !indicator.years.includes(chosenXDomainNumbEnd)}
		<div class="no-chart-container">
			<p>
				No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to display for
				<span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
			</p>
		</div>
	{:else if !combinedChartDataLatest || combinedChartDataLatest.length === 0}
		<div class="no-chart-container">
			<p>
				No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to display for
				selected areas for
				<span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
			</p>
		</div>
	{:else}
		<div class="title-container">
			<SubtitleAdditionalDescription
				selectedIndicator={indicator}
				{xDomain}
				timePeriodsArray={chosenTimePeriodsArray}
				{selectedChartType}
				showInfo={false}
			></SubtitleAdditionalDescription>
		</div>
		<div class="chart-container">
			<BarChartContainer
				{indicator}
				combinedChartData={combinedChartDataLatest}
				{metadata}
				latestPeriod={chosenTimePeriodsArray.find((el) => el.xDomainNumb === xDomain[1])}
				filteredChartDataSelected={filteredChartDataSelectedLatest}
				filteredChartDataAdditionals={filteredChartDataAdditionalsLatest}
				filteredChartDataAreaGroup={filteredChartDataAreaGroupLatest}
				{selectionsObject}
				{selectedArea}
				{indicatorCalculations}
				{xDomain}
				{customLookup}
				{showConfidenceIntervals}
				additionalID="areas-single-additional"
				relatedID="related-single"
			></BarChartContainer>
		</div>
		<div class="source-notes-container">
			<p class="source-container">
				<span style="font-weight: bold">Source:</span>
				{#each sourceOrgs as org, i}
					<a href={sourceLinks[i]}>{org}</a>

					{#if i < sourceOrgs.length - 2}
						,
					{:else if i === sourceOrgs.length - 2}
						{'and '}
					{/if}
				{/each}
			</p>
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
	{/if}
{:else if chartType === 'map'}
	{#if indicator.metadata.standardised === 'F'}
		<div class="no-chart-container">
			<p>
				Map unavaliable for <span style="font-weight: bold;">{indicator.metadata.label}</span> as available
				data is not standardised.
			</p>
		</div>
	{:else if mapData.data.length === 0 || mapData.breaks.length === 0}
		<div class="no-chart-container">
			<p>
				No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to display for
				<span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
			</p>
		</div>
	{:else}
		<div class="title-container">
			<SubtitleAdditionalDescription
				selectedIndicator={indicator}
				{xDomain}
				timePeriodsArray={chosenTimePeriodsArray}
				{selectedChartType}
				showInfo={false}
			></SubtitleAdditionalDescription>
		</div>
		<div class="chart-container">
			<Map
				data={mapData.data}
				breaks={mapData.breaks}
				geos={indicator.inferredGeos}
				prefix={indicator.metadata.prefix}
				suffix={indicator.metadata.suffix}
				dp={indicator.metadata.decimalPlaces}
				selected={[selectedArea, ...selectionsObject['areas-single-additional-visible']].filter(
					(el) => mapData.data.map((elm) => elm.areacd).includes(el.areacd)
				)}
				{customLookup}
			/>
		</div>
		<div class="source-notes-container">
			<p class="source-container">
				<span style="font-weight: bold">Source:</span>
				{#each sourceOrgs as org, i}
					<a href={sourceLinks[i]}>{org}</a>

					{#if i < sourceOrgs.length - 2}
						,
					{:else if i === sourceOrgs.length - 2}
						{'and '}
					{/if}
				{/each}
			</p>
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
	{/if}
{:else if chartType === 'table'}
	<div class="title-container">
		<SubtitleAdditionalDescription
			selectedIndicator={indicator}
			{xDomain}
			timePeriodsArray={chosenTimePeriodsArray}
			{selectedChartType}
			showInfo={false}
		></SubtitleAdditionalDescription>
	</div>
{/if}

<style>
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
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.source-container {
		padding: 0px;
		margin: 0px;
		line-height: 24px;
		font-size: 18px;
	}

	.notes-container {
		padding: 0px;
		margin: 0px;
		line-height: 24px;
		font-size: 18px;
	}
</style>
