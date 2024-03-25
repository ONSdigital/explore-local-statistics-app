<script lang="ts">
	import { page } from '$app/stores';
	import { Tabs, Tab, Select } from '@onsvisual/svelte-components';
	import SubtitleAdditionalDescription from '$lib/prototype-components/area-page/main-chart/SubtitleAdditionalDescription.svelte';
	import LineChartContainer from '$lib/prototype-components/area-page/main-chart/LineChartContainer.svelte';
	import BarChartContainer from '$lib/prototype-components/area-page/main-chart/BarChartContainer.svelte';
	import ChangeAreas from '$lib/prototype-components/change-areas/ChangeAreas.svelte';
	import ChartOptions from '$lib/prototype-components/ChartOptions.svelte';
	import Map from '$lib/viz/Map.svelte';
	import { makeMapData } from '$lib/util/datasets/datasetsHelpers';
	import { mainChartOptionsArray } from '$lib/config';
	import { geoTypeMap } from '$lib/config/geoConfig';
	import ContentActions from '$lib/components/ContentActions.svelte';
	import { base } from '$app/paths';

	export let customLookup,
		selectionsObject,
		filteredIndicators,
		chartData,
		metadata,
		selectedArea,
		chosenIndicatorId,
		accordionArray;

	let el = {},
		indicator,
		geoGroup;

	const maxSelection = 10;

	let chosenXDomainNumbStart = metadata.globalXDomainExtent[0];
	let chosenXDomainNumbEnd = metadata.globalXDomainExtent[1];
	$: chosenXDomain = [chosenXDomainNumbStart, chosenXDomainNumbEnd];

	const refreshData = () => {
		indicator = metadata.indicatorsObject[chosenIndicatorId.code];
		chosenXDomainNumbStart = indicator.minXDomainNumb;
		chosenXDomainNumbEnd = indicator.maxXDomainNumb;

		geoGroup = indicator.inferredGeos.groups.find(
			(el) =>
				el.key ===
				{ lower: 'ltla', upper: 'utla', region: 'rgn', country: 'ctry', combined: 'cauth' }[
					selectedArea.geogLevel
				]
		);
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

	$: console.log(indicator.inferredGeos);

	refreshData();

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
	let chosenChartId = 'line';

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
		intervals: showConfidenceIntervals
	};
	$: console.log('selectionsObject', selectedArea, selectionsObject);
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
							{#if timePeriodsArray.length <= 1}
								<div class="no-chart-container">
									<p>
										No <span style="font-weight: bold;">{indicator.metadata.label}</span> time series
										data to display.
									</p>
								</div>
							{:else if chosenTimePeriodsArray.length === 0}
								<div class="no-chart-container">
									<p>
										No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to
										display for {chosenXDomainNumbEnd}.
									</p>
								</div>
							{:else if chosenTimePeriodsArray.length === 1}
								<div class="no-chart-container">
									<p>
										Time series not displayed as selected date range includes only one time period
										with <span style="font-weight: bold;">{indicator.metadata.label}</span> data.
									</p>
								</div>
								<!-- {:else if filteredChartDataSelected.length === 0}
								<div class="no-chart-container">
									<p>
										No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to
										display for
										<span style="font-weight: bold;">{selectedArea.areanm}</span>
										between
										<span style="font-weight: bold;"
											>{chosenTimePeriodsArray[chosenTimePeriodsArray.length - 1].label}</span
										>
										and <span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
									</p>
								</div> -->
							{:else if !combinedChartData || combinedChartData.length === 0}
								<div class="no-chart-container">
									<p>
										No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to
										display for selected areas between
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
										selectedChartType={chart}
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
										{filteredChartDataAreaGroupLatest}
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
											<a href={sourceLinks[i]} target="_blank">{org}</a>

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
															: '')}{/each} between {chosenTimePeriodsArray[
												chosenTimePeriodsArray.length - 1
											].label} and {chosenTimePeriodsArray[0].label}.
										</p>
									{/if}
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
								<!-- {:else if filteredChartDataSelectedLatest.length === 0}
								<div class="no-chart-container">
									<p>
										No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to
										display for
										<span style="font-weight: bold;">{selectedArea.areanm}</span>
										for
										<span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
									</p>
								</div> -->
							{:else if !combinedChartDataLatest || combinedChartDataLatest.length === 0}
								<div class="no-chart-container">
									<p>
										No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to
										display for selected areas for
										<span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
									</p>
								</div>
							{:else}
								<div class="title-container">
									<SubtitleAdditionalDescription
										selectedIndicator={indicator}
										{xDomain}
										timePeriodsArray={chosenTimePeriodsArray}
										selectedChartType={chart}
									></SubtitleAdditionalDescription>
								</div>
								<div class="chart-container">
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
								</div>
								<div class="source-notes-container">
									<p class="source-container">
										<span style="font-weight: bold">Source:</span>
										{#each sourceOrgs as org, i}
											<a href={sourceLinks[i]} target="_blank">{org}</a>

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
													(i === unselectedAreasLatest.length - 2 &&
													unselectedAreasLatest.length > 1
														? ' and'
														: i != unselectedAreasLatest.length - 1
															? ','
															: '')}{/each} for {chosenTimePeriodsArray[0].label}.
										</p>
									{/if}
								</div>
							{/if}
						{:else if chartOptionsArray.find((el) => el.id === chosenChartId).label === 'Map'}
							{#if indicator.metadata.standardised === 'F'}
								<div class="no-chart-container">
									<p>
										Map unavaliable for <span style="font-weight: bold;"
											>{indicator.metadata.label}</span
										> as available data is not standardised.
									</p>
								</div>
							{:else if mapData.data.length === 0 || mapData.breaks.length === 0}
								<div class="no-chart-container">
									<p>
										No <span style="font-weight: bold;">{indicator.metadata.label}</span> data to
										display for
										<span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
									</p>
								</div>
							{:else}
								<div class="title-container">
									<SubtitleAdditionalDescription
										selectedIndicator={indicator}
										{xDomain}
										timePeriodsArray={chosenTimePeriodsArray}
										selectedChartType={chart}
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
										selected={[
											selectedArea,
											...selectionsObject['areas-single-additional-visible']
										].filter((el) => mapData.data.map((elm) => elm.areacd).includes(el.areacd))}
										{customLookup}
										on:select={doSelect}
									/>
								</div>
								<div class="source-notes-container">
									<p class="source-container">
										<span style="font-weight: bold">Source:</span>
										{#each sourceOrgs as org, i}
											<a href={sourceLinks[i]} target="_blank">{org}</a>

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
													(i === unselectedAreasLatest.length - 2 &&
													unselectedAreasLatest.length > 1
														? ' and'
														: i != unselectedAreasLatest.length - 1
															? ','
															: '')}{/each} for {chosenTimePeriodsArray[0].label}.
										</p>
									{/if}
								</div>
							{/if}
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
		data={[]}
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

	.source-container {
		padding: 0px;
		margin: 0px;
		line-height: 1.2;
	}

	.notes-container {
		padding: 0px;
		margin: 0px;
		line-height: 1.2;
	}

	.main-chart-column-container :global(.ons-tabs__panel) {
		border-bottom-left-radius: 0 !important;
		border-bottom-right-radius: 0 !important;
	}
</style>
