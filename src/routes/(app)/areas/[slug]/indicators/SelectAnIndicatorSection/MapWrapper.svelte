<script lang="ts">
	import Map from '$lib/viz/Map.svelte';
	import SubtitleAdditionalDescription from '$lib/prototype-components/area-page/main-chart/SubtitleAdditionalDescription.svelte';
	import { selectAnIndicatorChartSettings } from '../config';

	export let indicator,
		mapData,
		chosenTimePeriodsArray,
		xDomain,
		chart,
		selectedArea,
		selectionsObject,
		sourceOrgs,
		sourceLinks,
		unselectedAreasLatest,
		customLookup;

	const maxSelection = selectAnIndicatorChartSettings.maximumAdditionalAreas;

	//this function handles updates when an area is selected or deselected by clicking on the map
	const doSelect = (e) => {
		const chosen = selectionsObject['areas-single-additional-chosen'];
		const area = e.detail?.area;
		if (chosen.includes(area.areacd))
			selectionsObject['areas-single-additional-chosen'] = chosen.filter((s) => s !== area.areacd);
		else if (chosen.length < maxSelection)
			selectionsObject['areas-single-additional-chosen'] = [...chosen, area.areacd];
	};
</script>

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
			selected={[selectedArea, ...selectionsObject['areas-single-additional-visible']].filter(
				(el) => mapData.data.map((elm) => elm.areacd).includes(el.areacd)
			)}
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
