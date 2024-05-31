<script lang="ts">
	import BarChartContainer from '$lib/prototype-components/area-page/main-chart/BarChartContainer.svelte';
	import SubtitleAdditionalDescription from '$lib/prototype-components/area-page/main-chart/SubtitleAdditionalDescription.svelte';

	export let indicator,
		chosenXDomainNumbEnd,
		chosenTimePeriodsArray,
		combinedChartDataLatest,
		xDomain,
		chart,
		selectionsObject,
		filteredChartDataSelectedLatest,
		filteredChartDataAdditionalsLatest,
		filteredChartDataAreaGroupLatest,
		selectedArea,
		indicatorCalculations,
		customLookup,
		showConfidenceIntervals,
		sourceLinks,
		sourceOrgs,
		unselectedAreasLatest,
		metadata;
</script>

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
			selectedChartType={chart}
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
						(i === unselectedAreasLatest.length - 2 && unselectedAreasLatest.length > 1
							? ' and'
							: i != unselectedAreasLatest.length - 1
								? ','
								: '')}{/each} for {chosenTimePeriodsArray[0].label}.
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
