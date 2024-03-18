<script lang="ts">
	import { Tabs, Tab, Select } from '@onsvisual/svelte-components';
	import SubtitleAdditionalDescription from '$lib/prototype-components/area-page/main-chart/SubtitleAdditionalDescription.svelte';
	import LineChartContainer from '$lib/prototype-components/area-page/main-chart/LineChartContainer.svelte';
	import BarChartContainer from '$lib/prototype-components/area-page/main-chart/BarChartContainer.svelte';
	import ChangeAreas from '$lib/prototype-components/change-areas/ChangeAreas.svelte';
	import ChartOptions from '$lib/prototype-components/ChartOptions.svelte';
	import Map from '$lib/viz/Map.svelte';
	import { makeMapData } from '$lib/util/datasets/datasetsHelpers';

	import { mainChartOptionsArray } from '$lib/config';

	export let customLookup,
		selectionsObject,
		filteredIndicators,
		chartData,
		metadata,
		selectedArea,
		chosenIndicatorId,
		accordionArray;

	let indicator;

	const maxSelection = 10;

	let chosenXDomainNumbStart = metadata.globalXDomainExtent[0];
	let chosenXDomainNumbEnd = metadata.globalXDomainExtent[1];
	$: chosenXDomain = [chosenXDomainNumbStart, chosenXDomainNumbEnd];

	const refreshData = () => {
		indicator = metadata.indicatorsObject[chosenIndicatorId.code];
		chosenXDomainNumbStart = indicator.minXDomainNumb;
		chosenXDomainNumbEnd = indicator.maxXDomainNumb;

		geoGroup = indicator.inferredGeos.groups[3];
	};

	const doSelect = (e) => {
		const chosen = selectionsObject['areas-single-additional-chosen'];
		const area = e.detail?.area;
		if (chosen.includes(area.areacd))
			selectionsObject['areas-single-additional-chosen'] = chosen.filter((s) => s !== area.areacd);
		else if (chosen.length < maxSelection)
			selectionsObject['areas-single-additional-chosen'] = [...chosen, area.areacd];
	};

	$: mapData =
		geoGroup?.codes && chosenXDomainNumbEnd && indicator.years.includes(chosenXDomainNumbEnd)
			? makeMapData(
					chartData.combinedDataObject[indicator.code],
					geoGroup?.codes,
					chosenXDomainNumbEnd
				)
			: { data: [], breaks: [] };

	indicator = metadata.indicatorsObject[chosenIndicatorId.code];

	$: geoGroup = indicator.inferredGeos.groups.find((el) => el.key === 'ltla');

	chosenXDomainNumbStart = indicator.minXDomainNumb;
	chosenXDomainNumbEnd = indicator.maxXDomainNumb;

	let showConfidenceIntervals = false;

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

	/*$: chartOptionsArray = mainChartOptionsArray.filter(
		(el) => indicator.minXDomainNumb != indicator.maxXDomainNumb || el.multiYear != 'Yes'
	);*/
	$: chartOptionsArray = mainChartOptionsArray;
	let chosenChartId = 0;

	$: console.log(chosenChartId);

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
</script>

<div class="main-chart-column-container">
	<div class="row-container title-buttons-container">
		<div class="select-container">
			<Select
				id="select-indicator"
				options={filteredIndicators}
				idKey="code"
				labelKey="label"
				groupKey="topic"
				clusterByGroup
				clearable={false}
				bind:value={chosenIndicatorId}
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
			></ChartOptions>
		</div>
	</div>

	<Tabs border bind:selected={chosenChartId}>
		{#each chartOptionsArray as chart}
			{#if true}
				<Tab title={chart.label} id={chart.id} hideTitle>
					<div class="title-and-chart-container">
						<div class="title-container">
							<SubtitleAdditionalDescription
								selectedIndicator={indicator}
								{xDomain}
								timePeriodsArray={chosenTimePeriodsArray}
								selectedChartType={chart}
							></SubtitleAdditionalDescription>
						</div>

						<div class="chart-container">
							{#if timePeriodsArray.length === 0}
								<div class="no-chart-container">
									<p>No data for selected areas over time period</p>
								</div>
							{:else if chartOptionsArray.find((el) => el.id === chosenChartId).label === 'Time series'}
								{#if timePeriodsArray.length > 1}
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
								{:else}
									<div class="no-chart-container">
										<p>No data for selected areas prior to {chosenTimePeriodsArray[0].label}</p>
									</div>
								{/if}
							{:else if chartOptionsArray.find((el) => el.id === chosenChartId).label === 'Bar chart'}
								{#if !indicator.years.includes(chosenXDomainNumbEnd)}
									<div class="no-chart-container">
										<p>
											No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to
											display for
											<span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
										</p>
									</div>
								{:else if filteredChartDataSelectedLatest.length === 0}
									<div class="no-chart-container">
										<p>
											No <span style="font-weight: bold;">{indicator.metadata.label}</span> data for
											<span style="font-weight: bold;">{selectedArea.areanm}</span>
											to display for
											<span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
										</p>
									</div>
								{:else if !combinedChartDataLatest || combinedChartDataLatest.length === 0}
									<div class="no-chart-container">
										<p>
											No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to
											display for selected areas
											<span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
										</p>
									</div>
								{:else}
									<BarChartContainer
										{indicator}
										combinedChartData={combinedChartDataLatest}
										{metadata}
										latestPeriod={chosenTimePeriodsArray.find(
											(el) => el.xDomainNumb === xDomain[1]
										)}
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
								{/if}
							{:else if chartOptionsArray.find((el) => el.id === chosenChartId).label === 'Map'}
								{#if mapData.data.length > 0 && mapData.breaks.length > 0}
									<Map
										data={mapData.data}
										breaks={mapData.breaks}
										geos={indicator.inferredGeos}
										prefix={indicator.metadata.prefix}
										suffix={indicator.metadata.suffix}
										dp={indicator.metadata.decimalPlaces}
										selected={[
											selectedArea,
											...selectionsObject['areas-single-additional-visible'].filter((el) =>
												mapData.data.map((elm) => elm.areacd).includes(el.areacd)
											)
										]}
										{customLookup}
										on:select={doSelect}
									/>
								{:else}
									<p>No data</p>
								{/if}
							{/if}
						</div>

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
					</div>
				</Tab>
			{/if}
		{/each}
	</Tabs>
</div>

<style>
	:global(.ons-tabs) {
		margin-bottom: 0;
	}

	.main-chart-column-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.title-and-chart-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
		width: 100%;
		gap: 4px;
	}

	.select-container {
		width: 100%;
		max-width: 450px;
		flex-grow: 1;
	}

	/* :global(.list-item, .item) {
		white-space: normal !important;
		height: auto !important;
		overflow: visible !important;
	} */

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

	.no-chart-container {
		height: 500px;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		text-wrap: balance;
		text-align: center;
	}

	.source-container {
		padding: 0px;
		margin: 0px;
	}
</style>
