<script lang="ts">
	import { page } from '$app/stores';
	import {
		// Tabs,
		// Tab,
		AccessibleSelect as Select
	} from '@onsvisual/svelte-components';
	import Tabs from '$lib/modified-library-components/Tabs.svelte';
	import Tab from '$lib/modified-library-components/Tab.svelte';
	import LineChartWrapper from './LineChartWrapper.svelte';
	import MapWrapper from './MapWrapper.svelte';
	import BarChartWrapper from './BarChartWrapper.svelte';

	import ChangeAreas from '$lib/interactivity/ChangeAreas.svelte';
	import ChartOptions from '$lib/interactivity/ChartOptions.svelte';

	import { capitalise } from '@onsvisual/robo-utils';
	import { makeMapData } from '$lib/util/datasets/datasetsHelpers';
	import { geoLevelsLookup, mainChartOptionsArray } from '$lib/config';
	import { geoTypesLookup, geoTypeMap } from '$lib/config/geoConfig';
	import ContentActions from '$lib/components/ContentActions.svelte';
	import { base } from '$app/paths';

	import { selectAnIndicatorChartSettings } from '../config';

	export let customLookup,
		selectionsObject,
		filteredIndicators,
		chartData,
		metadata,
		selectedArea,
		accordionArray;
	export let chosenIndicatorId = filteredIndicators[0];

	let el = {},
		indicator,
		geoGroup;

	//tracks the selected time period range
	let chosenXDomainNumbStart = metadata.globalXDomainExtent[0];
	let chosenXDomainNumbEnd = metadata.globalXDomainExtent[1];
	$: chosenXDomain = [chosenXDomainNumbStart, chosenXDomainNumbEnd];

	let showConfidenceIntervals = false;

	//find the calculations for this indicator and time period, this is used for setting scales for the line and bar chart
	$: latestIndicatorCalculations = indicator
		? metadata['_newStyleIndicatorsCalculationsArray']
				.filter((el) => el.code === indicator.code)
				.find((el) => el.period === indicator.maxXDomainNumb)
		: null;

	$: indicatorCalculations =
		latestIndicatorCalculations?.calcsByGeogLevel?.[selectedArea.geogLevel];

	//define options for different charts and set an initial chart type
	let chartOptionsArray = selectAnIndicatorChartSettings.chartOptions;
	let chosenChartId = 'line';

	//filter chart data to just data within chosen time period
	$: filteredChartData = chartData.combinedDataObject[indicator.code].filter(
		(el) =>
			(el.value == 0 ? el : el.value) &&
			el.xDomainNumb >= chosenXDomainNumbStart &&
			el.xDomainNumb <= chosenXDomainNumbEnd
	);

	//filter to get chart data for the selected area only
	$: filteredChartDataSelected = [
		...new Set(filteredChartData.filter((el) => el.areacd === selectedArea.areacd))
	];

	//filter to get chart data for additionally selected areas
	$: filteredChartDataAdditionals = filteredChartData.filter((el) =>
		selectionsObject['areas-single-additional-chosen'].includes(el.areacd)
	);

	//filter to get chart data for group of areas (e.g. all other local authorities in London)
	$: filteredChartDataAreaGroup = selectionsObject['related-single-visible']
		? filteredChartData.filter(
				(el) =>
					selectionsObject['related-single-visible'].codes.includes(el.areacd) &&
					!selectionsObject['areas-single-additional-chosen'].includes(el.areacd) &&
					el.areacd != selectedArea.areacd
			)
		: [];

	//combine data together, then find all time periods where at least one visible area has data and use these to establish our line chart xDomain
	$: combinedChartData = [
		...filteredChartDataSelected,
		...filteredChartDataAdditionals,
		...filteredChartDataAreaGroup
	];

	$: visibleAreasPeriods = [...new Set(combinedChartData.map((el) => el.xDomainNumb))];
	$: visibleAreasXDomain = [Math.min(...visibleAreasPeriods), Math.max(...visibleAreasPeriods)];

	//get list of areas which have been chosen by the user, but where there is no time series data to visualise. this is used to notify the user of why data is not being displayed
	$: unselectedAreas = [
		selectedArea,
		...selectionsObject['areas-single-additional-visible']
	].filter((el) => combinedChartData.find((elm) => elm.areacd === el.areacd) === undefined);

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

	//filter to get relevant time period labels
	$: timePeriodsArray = metadata.periodsLookupArray.filter(
		(el) =>
			el.id === indicator.id &&
			el.xDomainNumb >= indicator.minXDomainNumb &&
			el.xDomainNumb <= indicator.maxXDomainNumb
	);

	// $: console.log(
	// 	visibleAreasXDomain,
	// 	chosenXDomain,
	// 	xDomain,
	// 	chosenTimePeriodsArray,
	// 	timePeriodsArray
	// );

	$: chosenTimePeriodsArray = timePeriodsArray.filter(
		(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
	);

	//get data for latest selected year, for use in the bar chart
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

	//get list of areas which have been chosen by the user, but where there is no bar chart data to visualise. this is used to notify the user of why data is not being displayed
	$: unselectedAreasLatest = [
		selectedArea,
		...selectionsObject['areas-single-additional-visible']
	].filter((el) => combinedChartDataLatest.find((elm) => elm.areacd === el.areacd) === undefined);

	//manipulate metadata
	$: sourceOrgs = indicator.metadata.sourceOrg.split('|');
	$: sourceLinks = indicator.metadata.sourceURL.split('|');

	const refreshData = (e) => {
		if (e?.detail) chosenIndicatorId = e.detail;
		indicator = metadata.indicatorsObject[chosenIndicatorId.code];
		chosenXDomainNumbStart = indicator.minXDomainNumb;
		chosenXDomainNumbEnd = indicator.maxXDomainNumb;

		geoGroup = indicator.inferredGeos.groups.find(
			(el) => el.key === geoLevelsLookup[selectedArea.geogLevel]
		);
	};

	//updates when the data is refreshed because geoGroup and/or indicator and/or chosenXDomainNumbEnd will change
	$: mapData =
		geoGroup?.codes && chosenXDomainNumbEnd && indicator.years.includes(chosenXDomainNumbEnd)
			? makeMapData(
					chartData.combinedDataObject[indicator.code],
					geoGroup?.codes,
					chosenXDomainNumbEnd
				)
			: { data: [], breaks: [] };

	refreshData();

	$: embedProps = {
		type: chosenChartId,
		geo:
			selectionsObject['related-single-chosen'] === 'none'
				? 'none'
				: geoTypeMap[selectedArea.geogLevel],
		years: chosenXDomain.join('-'),
		areas: [selectedArea.areacd, ...(selectionsObject?.['indicator-additional-chosen'] || [])].join(
			','
		),
		related: selectionsObject['related-single-chosen'],
		related_label: selectionsObject['related-single-visible']?.label,
		intervals: showConfidenceIntervals
	};

	$: geoCodes =
		embedProps.geo && embedProps.geo !== 'none' ? geoTypesLookup[embedProps.geo].codes : [];

	$: csvData = (
		chosenChartId === 'bar' && embedProps.geo === 'none'
			? chartData.combinedDataObject[indicator.code].filter(
					(d) => embedProps.areas.includes(d.areacd) && d.xDomainNumb === chosenXDomain[1]
				)
			: chosenChartId === 'bar'
				? chartData.combinedDataObject[indicator.code].filter(
						(d) =>
							(embedProps.areas.includes(d.areacd) || geoCodes.includes(d.areacd.slice(0, 3))) &&
							d.xDomainNumb === chosenXDomain[1]
					)
				: chosenChartId === 'line' && embedProps.geo === 'none'
					? chartData.combinedDataObject[indicator.code].filter(
							(d) =>
								embedProps.areas.includes(d.areacd) &&
								d.xDomainNumb >= chosenXDomain[0] &&
								d.xDomainNumb <= chosenXDomain[1]
						)
					: chosenChartId === 'line'
						? chartData.combinedDataObject[indicator.code].filter(
								(d) =>
									(embedProps.areas.includes(d.areacd) ||
										geoCodes.includes(d.areacd.slice(0, 3))) &&
									d.xDomainNumb >= chosenXDomain[0] &&
									d.xDomainNumb <= chosenXDomain[1]
							)
						: mapData.data
	).map((d) => ({ ...d, areanm: metadata.areasObject?.[d.areacd]?.areanm }));
</script>

<div class="main-chart-column-container">
	<label for="select-indicator" style:display="block" style:margin-bottom="8px"
		>Select an indicator to explore:</label
	>
	<div class="row-container title-buttons-container">
		<div class="select-container">
			<Select
				id="select-indicator"
				options={filteredIndicators.map((d) => ({ ...d, topic: capitalise(d.topic) }))}
				labelKey="label"
				groupKey="topic"
				label={null}
				clearable={false}
				value={chosenIndicatorId}
				on:change={refreshData}
			></Select>
		</div>

		<div class="buttons-container">
			<ChangeAreas {selectedArea} {accordionArray} bind:selectionsObject {customLookup}
			></ChangeAreas>

			<ChartOptions
				{metadata}
				bind:chosenXDomainNumbStart
				bind:chosenXDomainNumbEnd
				bind:showConfidenceIntervals
				{timePeriodsArray}
				chosenTimePeriodDropdownLabel={null}
				showSlider={indicator.maxXDomainNumb != indicator.minXDomainNumb}
				disableConfidenceIntervals={indicator.metadata.confidenceIntervals === 'F'}
			></ChartOptions>
		</div>
	</div>

	<Tabs border bind:selected={chosenChartId}>
		{#each chartOptionsArray as chart}
			{#if true}
				<Tab title={chart.label} id={chart.id} hideTitle>
					<div class="title-and-chart-container" bind:this={el[chart.id]}>
						{#if chartOptionsArray.find((el) => el.id === chosenChartId).label === 'Time series'}
							<LineChartWrapper
								{timePeriodsArray}
								{indicator}
								{chosenTimePeriodsArray}
								{chosenXDomainNumbEnd}
								{combinedChartData}
								{xDomain}
								{chart}
								filteredChartDataSelected={filteredChartDataSelected.filter(
									(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
								)}
								filteredChartDataAdditionals={filteredChartDataAdditionals.filter(
									(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
								)}
								filteredChartDataAreaGroup={filteredChartDataAreaGroup.filter(
									(el) => el.xDomainNumb >= xDomain[0] && el.xDomainNumb <= xDomain[1]
								)}
								{filteredChartDataAreaGroupLatest}
								{selectionsObject}
								{selectedArea}
								{indicatorCalculations}
								{customLookup}
								{showConfidenceIntervals}
								{sourceOrgs}
								{sourceLinks}
								{unselectedAreas}
							></LineChartWrapper>
						{:else if chartOptionsArray.find((el) => el.id === chosenChartId).label === 'Bar chart'}
							<BarChartWrapper
								{metadata}
								{indicator}
								{chosenXDomainNumbEnd}
								{chosenTimePeriodsArray}
								{combinedChartDataLatest}
								{xDomain}
								{chart}
								{selectionsObject}
								{filteredChartDataSelectedLatest}
								{filteredChartDataAdditionalsLatest}
								{filteredChartDataAreaGroupLatest}
								{selectedArea}
								{indicatorCalculations}
								{customLookup}
								{showConfidenceIntervals}
								{sourceLinks}
								{sourceOrgs}
								{unselectedAreasLatest}
							></BarChartWrapper>
						{:else if chartOptionsArray.find((el) => el.id === chosenChartId).label === 'Map'}
							<MapWrapper
								{indicator}
								{mapData}
								{chosenTimePeriodsArray}
								{xDomain}
								{chart}
								{selectedArea}
								bind:selectionsObject
								{sourceOrgs}
								{sourceLinks}
								{unselectedAreasLatest}
								{customLookup}
							></MapWrapper>
						{/if}
					</div>
				</Tab>
			{/if}
		{/each}
	</Tabs>
	<ContentActions
		el={el?.[chosenChartId]?.parentElement}
		embedUrl="{$page.url.origin}{base}/indicators/{indicator.metadata.slug}/embed"
		{embedProps}
		title={indicator.metadata.label}
		{metadata}
		{indicator}
		type={chosenChartId}
		data={csvData}
	/>
</div>

<style>
	:global(.ons-tabs) {
		margin-bottom: 0;
	}

	.main-chart-column-container {
		display: flex;
		flex-direction: column;
	}

	.title-and-chart-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: 100%;
	}

	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
		width: 100%;
		gap: 4px;
		margin-bottom: 20px;
	}

	.select-container {
		width: 100%;
		max-width: 410px;
		flex-grow: 1;
	}

	.select-container :global(.list-item div) {
		white-space: normal !important;
		height: auto !important;
		overflow: visible !important;
		line-height: 1.4;
		padding-top: 6px;
		padding-bottom: 6px;
		padding-right: 6px;
	}

	.buttons-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: flex-end;
		gap: 4px;
	}

	.title-buttons-container {
		justify-content: space-between;
	}

	.main-chart-column-container :global(.ons-tabs__panel) {
		border-bottom-left-radius: 0 !important;
		border-bottom-right-radius: 0 !important;
	}
</style>
