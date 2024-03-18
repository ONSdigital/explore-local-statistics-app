<script lang="ts">
	import MainChart from '$lib/prototype-components/area-page/main-chart/MainChart.svelte';
	import { mainChartOptionsArray } from '$lib/config';
	import { base } from '$app/paths';
	import { downloadCSV, downloadPNG } from '$lib/util/charts/chartActions';
	import { Textarea, Button } from '@onsvisual/svelte-components';
	import Icon from '$lib/components/Icon.svelte';

	import { onMount } from 'svelte';

	export let customLookup,
		selectionsObject,
		filteredIndicators,
		chartData,
		metadata,
		selectedArea,
		accordionArray;

	let chosenIndicatorId;

	/*let showEmbed = false,
		embedCode = '',
		type = '',
		data = [];*/

	/*export let combinedSelectableAreaTypesObject,
		chartData,
		metadata,
		visibleAreas,
		filteredIndicators;
	export let chosenParentAreasArray,
		chosenRelatedAreasId,
		chosenSameRegionArray,
		chosenCountriesArray,
		chosenRegionsArray,
		chosenAllOtherArray;

	let chosenIndicatorId;*/

	onMount(() => {
		chosenIndicatorId = filteredIndicators[0];
	});
</script>

<div class="main-chart-section-container">
	{#if chosenIndicatorId}
		<MainChart
			{customLookup}
			bind:selectionsObject
			{filteredIndicators}
			{chartData}
			{metadata}
			{selectedArea}
			{accordionArray}
			bind:chosenIndicatorId
		></MainChart>
	{/if}
	<!-- <div class="content-actions">
		<h4>Use and share</h4>
		<ul>
			{#if type !== 'table'}<li>
					<Icon type="chart" /><span
						><button class="btn-link" on:click={() => downloadPNG(el)}>Download {type} (PNG)</button
						></span
					>
				</li>{/if}
			{#if data}<li>
					<Icon type="download" /><span
						><button class="btn-link" on:click={() => downloadCSV(data)}>Download data (CSV)</button
						></span
					>
				</li>{/if}
			<li>
				<Icon type="code" /><span
					><button class="btn-link" on:click={() => (showEmbed = !showEmbed)}
						>{showEmbed ? 'Hide embed code' : `Embed ${type}`}</button
					></span
				>
			</li>
		</ul>
		{#if showEmbed}
			<div class="content-embed">
				<Textarea value={embedCode} rows={4} width={30} hideLabel />
				<Button small on:click={() => clip(embedCode, 'Copied to clipboard!')}
					>Copy to clipboard</Button
				>
			</div>
		{/if}
	</div> -->
</div>

<style>
	.main-chart-section-container {
		margin: 20px 0px;
	}
	.content-block {
		border: 1px solid #999;
		border-top-left-radius: 4px;
		border-top-right-radius: 4px;
		padding: 8px;
	}
	h3.content-subhead {
		font-size: 18px;
		margin-bottom: 8px;
	}
	h3.content-subhead > span {
		font-size: 16px;
		font-weight: normal;
	}
	.content-actions {
		background: var(--pale, #f0f0f0);
		font-size: 16px;
		padding: 6px 8px 12px;
		border-bottom-left-radius: 4px;
		border-bottom-right-radius: 4px;
	}
	.content-actions > h4 {
		margin: 0 0 4px;
		font-size: 16px;
	}
	.content-actions ul {
		margin: 0;
		padding: 0;
	}
	.content-actions ul > li {
		display: inline;
	}
	.content-actions ul > li + li {
		margin-left: 12px;
	}
	.content-actions span {
		display: inline-block;
		transform: translateY(-2px);
		margin-left: 6px;
	}
	.content-embed {
		display: block;
		width: 100%;
	}
	.content-embed :global(textarea) {
		margin-top: 8px;
	}
	button {
		font-family: unset;
	}
	button.btn-link {
		line-height: 1.3;
		color: var(--link, #206095);
		background: none;
		margin: 0;
		padding: 0;
		border: none;
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-position: under;
	}
	button.btn-link:hover {
		color: var(--link-hover, #003c57) !important;
		text-decoration-thickness: 2px;
	}
	button.btn-link:focus {
		background-color: #fbc900 !important;
		box-shadow:
			0 -2px #fbc900,
			0 4px #222;
		color: #222 !important;
		outline: 3px solid transparent;
		outline-offset: 1px;
		text-decoration: none;
	}
</style>
