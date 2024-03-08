<script lang="ts">
	import { base } from '$app/paths';
	import InfoButton from '$lib/prototype-components/modified-svelte-components/InfoButton.svelte';

	export let selectedIndicator, xDomain, selectedChartType, timePeriodsArray;

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
</script>

<button on:mouseenter={onMouseenterEvent} on:mouseleave={onMouseleaveEvent} on:click={onClickEvent}>
	<span>{subtitleText}<InfoButton {expandIcon}></InfoButton></span>
</button>

{#if displayAdditional}
	<div class="indicator-additional-description-text-container">
		<p>
			<span style="font-weight: bold">Definition:</span>
			{selectedIndicator.metadata.longDescription}
		</p>
		<p>
			<span style="font-weight: bold">Coverage:</span>
			{selectedIndicator.metadata.coverageLevel}
		</p>

		{#if selectedIndicator.metadata.experimentalStatistic === 'T'}
			<p>Note that this dataset is an official statisitc in development.</p>
		{/if}

		<p>
			Further
			<a href="{base}/datasets/{selectedIndicator.metadata.slug}"
				>{selectedIndicator.metadata.label}</a
			> data is available here.
		</p>
	</div>
{/if}

<style>
	button {
		width: 100%;
		text-align: left;
		font-family: inherit;
		border: none;
		background: none;
		margin: 10px 0px;
		padding: 0px 5px;
		font-size: 18px;
		line-height: 24px;
	}

	.indicator-additional-description-text-container {
		margin: 10px 5px 20px 5px;
		padding: 10px 5px 10px 5px;
		background-color: #f5f5f5;
		border-left: solid;
		border-left-color: #707071;
		border-left-width: 4px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.indicator-additional-description-text-container p {
		padding: 0px 10px 0px 10px;
		margin: 0px;
		font-size: 16px;
		line-height: 20px;
	}
</style>
