<script>
	import InfoButton from '$lib/prototype-components/modified-svelte-components/InfoButton.svelte';

	export let showVisuals,
		xDomain,
		selectedAreaMinXDomain,
		selectedAreaMaxXDomain,
		titleText,
		unitDescriptionText,
		additionalText;

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
			>{titleText}<span style="font-weight: normal"
				>{unitDescriptionText ? ', ' + unitDescriptionText : ''}</span
			><InfoButton {expandIcon}></InfoButton></span
		>
	{:else}
		<span style="text-align: left;">
			<span>No data for</span>
			<span style="font-weight: bold">{titleText}</span>
			<span
				>{xDomain[1] < selectedAreaMinXDomain
					? 'before ' + selectedAreaMinXDomain
					: 'after ' + selectedAreaMaxXDomain}</span
			><InfoButton {expandIcon}></InfoButton>
		</span>
	{/if}
</button>

{#if displayAdditional}
	<div class="indicator-additional-description-text-container">
		<!-- {#each additionalText as paragraph}
			<p>{paragraph}</p>
		{/each} -->

		<p>
			<span style="font-weight: bold">Definition: </span>The proportion of people aged between 16
			and 64 years who are not in employment but do not meet the internationally accepted definition
			of unemployment because they have not been seeking work within the last four weeks or they are
			unable to start work in the next two weeks.
		</p>

		<p>
			<span style="font-weight: bold">Published by: </span>

			<a>Office for National Statistics</a>
		</p>

		<p>
			<span style="font-weight: bold">Further data available at: </span>

			<a
				>https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/regionallabourmarket/previousReleases</a
			>
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
