<script lang="ts">
	import Divider from '$lib/prototype-components/layout/Divider.svelte';

	import { geogLevelToNameLookup, colorsLookup } from '$lib/config.js';

	export let combinedSelectableAreaTypesObject;
</script>

<Divider orientation="horizontal" margin={[5, 0, 5, 0]}></Divider>

<div class="row-container">
	<span>Comparing</span>
	<div class="area-container" style="border-color: {colorsLookup.main.color}">
		<div class="inline-row-container">
			<svg width="20" height="20">
				<circle cx="10" cy="10" r="8" stroke="white" fill={colorsLookup.main.color}></circle>
			</svg>
			<span style="color: {colorsLookup.main.color}; font-weight: bold"
				>{combinedSelectableAreaTypesObject.selected.area.areanm}</span
			>
		</div>
	</div>
	<span>to</span>
	<div class="area-container" style="border-color: {colorsLookup.median.color}">
		<div class="inline-row-container">
			<svg width="20" height="20">
				<path
					d="M10 0 l0 20"
					stroke={colorsLookup.median.color}
					stroke-dasharray="6 2"
					stroke-width="2px"
				></path>
			</svg>
			<span style="color: {colorsLookup.median.color}; font-weight: bold"
				>Median average of all {geogLevelToNameLookup[
					combinedSelectableAreaTypesObject.selected.area.geogLevel
				]}</span
			>
		</div>
	</div>
</div>

<div class="row-container key-chart-info-container">
	<div class="additional-areas-container">
		{#if combinedSelectableAreaTypesObject.visible.primaryAreas.length > 1 || combinedSelectableAreaTypesObject.visible.relatedAreas.length > 0}
			<span>Also showing</span>
		{/if}
		{#each combinedSelectableAreaTypesObject.visible.primaryAreas as area}
			{#if area.role != 'main'}
				<div
					class="additional-area-container"
					style="background-color: {colorsLookup[area.role].color}"
				>
					<div class="inline-row-container">
						<span style="color: {colorsLookup[area.role].contrast};">{area.areanm}</span>
					</div>
				</div>
			{/if}
		{/each}
		{#if combinedSelectableAreaTypesObject.visible.relatedAreas.some((el) => el.role === 'sameRegion')}
			<div
				class="additional-area-container"
				style="background-color: {colorsLookup.sameRegion.color}"
			>
				<div class="inline-row-container">
					<span style="color: {colorsLookup.sameRegion.contrast};"
						>{combinedSelectableAreaTypesObject.sameRegion.label}</span
					>
				</div>
			</div>
		{/if}
		{#if combinedSelectableAreaTypesObject.visible.relatedAreas.some((el) => el.role === 'similar')}
			<div class="additional-area-container" style="background-color: {colorsLookup.similar.color}">
				<div class="inline-row-container">
					<span style="color: {colorsLookup.similar.contrast};"
						>{combinedSelectableAreaTypesObject.similar.label}</span
					>
				</div>
			</div>
		{/if}
	</div>
</div>

<Divider orientation="horizontal" margin={[0, 0, 0, 0]}></Divider>

<style>
	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		gap: 10px;
	}

	.area-container {
		padding: 0px 4px 0px 4px;
		display: inline-block;
		border-radius: 4px;
		border-style: solid;
		border-width: 1.5px;
	}

	.additional-areas-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 7px;
		font-size: 16px;
	}

	.additional-area-container {
		padding: 0px 4px 0px 4px;
		display: inline-block;
		border-radius: 2px;
	}

	.inline-row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		gap: 2px;
	}

	.key-chart-info-container {
		justify-content: space-between;
	}
</style>
