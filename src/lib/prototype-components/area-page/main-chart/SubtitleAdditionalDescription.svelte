<script lang="ts">
	import { base } from '$app/paths';
	import InfoButton from '$lib/prototype-components/modified-svelte-components/InfoButton.svelte';

	export let selectedIndicator,
		xDomain,
		selectedChartType,
		timePeriodsArray,
		showInfo = true;

	let expandIcon = false;
	let displayAdditional = false;

	const onMouseenterEvent = () => {
		expandIcon = true;
	};

	const onMouseleaveEvent = () => {
		expandIcon = false;
	};

	const onClickEvent = () => {
		displayAdditional = !displayAdditional;
	};

	$: subtitleText =
		selectedIndicator.metadata.subtitle +
		(timePeriodsArray.length > 0
			? ', ' +
				((selectedChartType.multiYear === 'Yes' || selectedChartType.multiYear === 'Either') &&
				xDomain[1] != xDomain[0] &&
				isFinite(xDomain[0]) &&
				isFinite(xDomain[1])
					? timePeriodsArray[timePeriodsArray.length - 1].label + ' to ' + timePeriodsArray[0].label
					: timePeriodsArray[0].label)
			: '');

	const getUnit = (ind) => ind.subText || ind.suffix || ind.prefix;
</script>

<span class="indicator-title">
	<h3>
		{selectedIndicator.metadata.label}
	</h3>
	{#if selectedIndicator.metadata.subText === 'in millions'}
		<span>, {selectedIndicator.metadata.subText}</span>
	{/if}
</span>

{#if showInfo}
	<button
		on:mouseenter={onMouseenterEvent}
		on:mouseleave={onMouseleaveEvent}
		on:click={onClickEvent}
	>
		<span>{subtitleText}<InfoButton {expandIcon}></InfoButton></span>
	</button>
{:else}
	<span>{subtitleText}</span>
{/if}

{#if displayAdditional}
	<div class="indicator-additional-description-text-container">
		{#if selectedIndicator.metadata.experimentalStatistic === 'T'}
			<div class="stat-in-dev">
				<div>Official statistics in development</div>
			</div>
		{/if}

		<p>
			<span style="font-weight: bold">Definition:</span>
			{selectedIndicator.metadata.longDescription}
		</p>

		<p>
			For more data and charts, visit our page on <a
				href="{base}/indicators/{selectedIndicator.metadata.slug}"
				>{selectedIndicator.metadata.label}.</a
			>
		</p>
	</div>
{/if}

<style>
	.stat-in-dev {
		margin: 0px 10px;
		display: flex;
	}
	.stat-in-dev > div {
		font-weight: bold;
		color: white;
		background-color: #003c57;
		padding: 2px 8px;
		border-radius: 4px;
	}

	button {
		width: 100%;
		text-align: left;
		font-family: inherit;
		border: none;
		background: none;
		margin: 0px 0px;
		padding: 0px;
		font-size: 18px;
		line-height: 24px;
	}

	.indicator-title {
		margin: 0;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: baseline;
	}

	h3 {
		margin: 0px;
	}

	.indicator-additional-description-text-container {
		margin: 10px 5px 20px 0px;
		padding: 10px 5px 10px 5px;
		background-color: #f5f5f5;
		border-left: solid;
		border-left-color: #707071;
		border-left-width: 4px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		font-size: 16px;
		line-height: 20px;
	}

	.indicator-additional-description-text-container p {
		padding: 0px 10px 0px 10px;
		margin: 0px;
	}
</style>
