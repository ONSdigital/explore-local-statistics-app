<script>
	import { base } from '$app/paths';
	import InfoButton from '$lib/prototype-components/modified-svelte-components/InfoButton.svelte';

	export let showVisuals, indicator;

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

	$: sourceOrgs = indicator.metadata.sourceOrg.split('|');
	$: sourceLinks = indicator.metadata.sourceURL.split('|');
</script>

<button
	on:mouseenter={onMouseenterEvent}
	on:mouseleave={onMouseleaveEvent}
	on:click={onClickEvent}
	style:margin="0 0 8px 0"
>
	{#if showVisuals}
		<span style="font-weight: bold"
			>{indicator.metadata.label}<span style="font-weight: normal"
				>{indicator.metadata.subText ? ', ' + indicator.metadata.subText : ''}</span
			><InfoButton {expandIcon}></InfoButton></span
		>
	{:else}
		<span style="text-align: left;">
			<span>No data to display for</span>
			<span style="font-weight: bold">{indicator.metadata.label}</span>
			<span> for selected time periods</span>
			<InfoButton {expandIcon}></InfoButton>
		</span>
	{/if}
</button>

{#if displayAdditional}
	<div class="indicator-additional-description-text-container">
		{#if indicator.metadata.experimentalStatistic === 'T'}
			<div class="stat-in-dev">
				<div>Official statistics in development</div>
			</div>
		{/if}

		<p>
			<span style="font-weight: bold">Definition:</span>
			{indicator.metadata.longDescription}
		</p>

		<p>
			<span style="font-weight: bold">Data source{sourceOrgs.length > 1 ? 's' : ''}:</span>
			{#each sourceOrgs as org, i}
				<a href={sourceLinks[i]}>{org}</a>

				{#if i < sourceOrgs.length - 2}
					,
				{:else if i === sourceOrgs.length - 2}
					{'and '}
				{/if}
			{/each}
		</p>

		<p>
			Further
			<a href="{base}/indicators/{indicator.metadata.slug}">{indicator.metadata.label}</a> data is available
			here.
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
		margin: 10px 5px;
		padding: 0px;
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
		font-size: 16px;
		line-height: 20px;
	}

	.indicator-additional-description-text-container p {
		padding: 0px 10px 0px 10px;
		margin: 0px;
	}
</style>
