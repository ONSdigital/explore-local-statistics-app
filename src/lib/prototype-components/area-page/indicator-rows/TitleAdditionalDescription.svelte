<script>
	import InfoButton from '$lib/prototype-components/modified-svelte-components/InfoButton.svelte';

	export let showVisuals, indicator, xDomain, selectedAndComparisonXDomain;

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
</script>

<button on:mouseenter={onMouseenterEvent} on:mouseleave={onMouseleaveEvent} on:click={onClickEvent}>
	{#if showVisuals}
		<span style="font-weight: bold"
			>{indicator.metadata.label}<span style="font-weight: normal"
				>{indicator.metadata.subText ? ', ' + indicator.metadata.subText : ''}</span
			><InfoButton {expandIcon}></InfoButton></span
		>
	{:else}
		<span style="text-align: left;">
			<span>No data for</span>
			<span style="font-weight: bold">{indicator.metadata.label}</span>
			<span
				>{xDomain[1] > selectedAndComparisonXDomain[1]
					? 'after ' + selectedAndComparisonXDomain[1]
					: 'before ' + selectedAndComparisonXDomain[0]}</span
			>
			<InfoButton {expandIcon}></InfoButton>
		</span>
	{/if}
</button>

{#if displayAdditional}
	<div class="indicator-additional-description-text-container">
		<p>
			Placeholder text: this section will include the indicator metadata and a link to the indicator
			page
		</p>
	</div>
{/if}

<style>
	button {
		width: 100%;
		text-align: justify;
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
	}

	.indicator-additional-description-text-container p {
		padding: 0px 10px 0px 10px;
		margin: 0px;
		font-size: 16px;
		line-height: 20px;
	}
</style>
