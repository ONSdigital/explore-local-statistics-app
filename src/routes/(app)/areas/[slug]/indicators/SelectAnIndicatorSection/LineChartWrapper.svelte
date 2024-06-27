<script lang="ts">
	import LineChartContainer from '$lib/prototype-components/area-page/main-chart/LineChartContainer.svelte';
	import SubtitleAdditionalDescription from '$lib/prototype-components/area-page/main-chart/SubtitleAdditionalDescription.svelte';

	export let timePeriodsArray,
		indicator,
		chosenTimePeriodsArray,
		chosenXDomainNumbEnd,
		combinedChartData,
		xDomain,
		chart,
		filteredChartDataSelected,
		filteredChartDataAdditionals,
		filteredChartDataAreaGroup,
		filteredChartDataAreaGroupLatest,
		selectionsObject,
		selectedArea,
		indicatorCalculations,
		customLookup,
		showConfidenceIntervals,
		sourceOrgs,
		sourceLinks,
		unselectedAreas;
</script>

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
			selectedChartType={chart}
		></SubtitleAdditionalDescription>
	</div>
	<div class="chart-container">
		<LineChartContainer
			{indicator}
			timePeriodsArray={chosenTimePeriodsArray}
			{filteredChartDataSelected}
			{filteredChartDataAdditionals}
			{filteredChartDataAreaGroup}
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
								: '')}{/each} between {chosenTimePeriodsArray[chosenTimePeriodsArray.length - 1]
					.label} and {chosenTimePeriodsArray[0].label}.
			</p>
		{/if}
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
</style>
