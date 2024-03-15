<script lang="ts">
	import { Tabs, Tab, Select } from '@onsvisual/svelte-components';
	import SubtitleAdditionalDescription from '$lib/prototype-components/area-page/main-chart/SubtitleAdditionalDescription.svelte';
	import LineChartContainer from '$lib/prototype-components/area-page/main-chart/LineChartContainer.svelte';
	import BarChartContainer from '$lib/prototype-components/area-page/main-chart/BarChartContainer.svelte';
	import ChangeAreas from '$lib/prototype-components/change-areas/ChangeAreas.svelte';
	import ChartOptions from '$lib/prototype-components/ChartOptions.svelte';
	import ChartInfo from '$lib/prototype-components/area-page/indicator-rows/ChartInfo.svelte';

	import { mainChartOptionsArray } from '$lib/config';

	export let customLookup,
		selectionsObject,
		filteredIndicators,
		chartData,
		metadata,
		selectedArea,
		chosenIndicatorId,
		accordionArray;

	let chosenXDomain = [metadata.globalXDomainExtent[0], metadata.globalXDomainExtent[1]];

	let showConfidenceIntervals = false;

	$: indicator = metadata.indicatorsObject[chosenIndicatorId.code];
	$: indicatorCalculationsArray = metadata['_newStyleIndicatorsCalculationsArray'].filter(
		(el) => el.code === indicator.code
	);
	$: latestIndicatorCalculations = indicatorCalculationsArray.find(
		(el) => el.period === indicator.maxXDomainNumb
	);

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
	$: chosenChartId =
		chartOptionsArray.find((el) => el.id === chosenChartId) === undefined
			? chartOptionsArray[0].id
			: chosenChartId;
	$: selectedChartType = chartOptionsArray.find((el) => el.id === chosenChartId);

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
			el.xDomainNumb >= xDomain[0] &&
			el.xDomainNumb <= xDomain[1]
	);

	$: sourceOrgs = indicator.metadata.sourceOrg.split('|');
	$: sourceLinks = indicator.metadata.sourceURL.split('|');
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
			></Select>
		</div>

		<div class="buttons-container">
			<ChangeAreas {selectedArea} {accordionArray} bind:selectionsObject {customLookup}
			></ChangeAreas>

			<ChartOptions {metadata} bind:chosenXDomain bind:showConfidenceIntervals></ChartOptions>
		</div>
	</div>

	<Tabs border bind:selected={chosenChartId}>
		{#each chartOptionsArray as chart}
			<Tab title={chart.label} id={chart.id} hideTitle>
				<div class="title-and-chart-container">
					<div class="title-container">
						<SubtitleAdditionalDescription
							selectedIndicator={indicator}
							{xDomain}
							{timePeriodsArray}
							selectedChartType={chart}
						></SubtitleAdditionalDescription>
					</div>

					<div class="chart-container">
						{#if timePeriodsArray.length === 0}
							<div class="no-chart-container">
								<p>No data for selected areas over time period</p>
							</div>
						{:else if chart.label === 'Time series'}
							{#if timePeriodsArray.length > 1}
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
									<p>No data for selected areas prior to {timePeriodsArray[0].label}</p>
								</div>
							{/if}
						{:else if chart.label === 'Bar chart'}
							<BarChartContainer
								{indicator}
								{metadata}
								latestPeriod={timePeriodsArray.find((el) => el.xDomainNumb === xDomain[1])}
								filteredChartDataSelected={filteredChartDataSelected.filter(
									(el) => el.xDomainNumb === xDomain[1]
								)}
								filteredChartDataAdditionals={filteredChartDataAdditionals.filter(
									(el) => el.xDomainNumb === xDomain[1]
								)}
								filteredChartDataAreaGroup={filteredChartDataAreaGroup.filter(
									(el) => el.xDomainNumb === xDomain[1]
								)}
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
		font-weight: bold;
	}

	.source-container {
		padding: 0px;
		margin: 0px;
	}
</style>
