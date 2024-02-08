<script>
	import InfoButton from '$lib/prototype-components/modified-svelte-components/InfoButton.svelte';

	export let titleText, unitDescriptionText, additionalText;

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
	<span style="font-weight: bold"
		>{titleText}<span style="font-weight: normal"
			>{unitDescriptionText === '' ? '' : ', ' + unitDescriptionText}</span
		><InfoButton {expandIcon}></InfoButton></span
	>
</button>

{#if displayAdditional}
	<div class="indicator-additional-description-text-container">
		{#each additionalText as paragraph}
			<p>{paragraph}</p>
		{/each}
	</div>
{/if}

<style>
	button {
		width: 100%;
		text-align: justify;
		font-family: inherit;
		border: none;
		background: none;
		margin: 10px 0px;
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
