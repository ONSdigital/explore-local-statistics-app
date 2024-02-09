<script lang="ts">
	import { colorsLookup } from '$lib/config.js';

	export let chosenComparisonMeasureOrArea, showModalComparisonMeasureOrArea;

	$: role = 'role' in chosenComparisonMeasureOrArea ? chosenComparisonMeasureOrArea.role : 'median';

	const onClickEventOpen = () => {
		showModalComparisonMeasureOrArea = true;
	};
</script>

<button
	on:click={onClickEventOpen}
	class="area-container"
	style="border-color: {colorsLookup[role].color}"
>
	<div class="inline-row-container">
		<svg width="20" height="20">
			<path
				d="M10 0 l0 18"
				stroke={colorsLookup[role].color}
				stroke-dasharray="3 1.5"
				stroke-width="2px"
			></path>

			<g transform="translate(10,15.5)">
				{#if ['parent', 'country', 'uk', 'median'].includes(role)}
					<rect
						transform={['country', 'uk', 'median'].includes(role) ? 'rotate(45)' : null}
						x="-3.5"
						y="-3.5"
						width="7"
						height="7"
						fill={colorsLookup[role].color}
						stroke="white"
						stroke-width="0.75px"
					></rect>
				{:else}
					<circle cx="10" cy="16" r="4" stroke="white" fill={colorsLookup[role].color}></circle>
				{/if}
			</g>
		</svg>
		<span style="color: {colorsLookup[role].color}; font-weight: bold"
			>{chosenComparisonMeasureOrArea[role === 'median' ? 'label1' : 'areanm']}</span
		>
		<svg width="20" height="20" viewBox="-2 0 16 7.7" class="chevron-svg">
			<path
				d="m1.37.15 4.5 5.1 4.5-5.1a.37.37 0 0 1 .6 0l.7.7a.45.45 0 0 1 0 .5l-5.5 6.2a.37.37 0 0 1-.6 0l-5.5-6.1a.64.64 0 0 1 0-.6l.7-.7a.64.64 0 0 1 .6 0Z"
				stroke={colorsLookup[role].color}
				fill={colorsLookup[role].color}
				stroke-width="0.5px"
			></path>
		</svg>
	</div>
</button>

<style>
	.area-container {
		margin: 0px;
		padding: 4px;
		display: inline-block;
		border-radius: 4px;
		border-style: solid;
		border-width: 1.5px;
		text-align: left;
	}

	.inline-row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		gap: 2px;
		line-height: 20px;
	}

	button {
		background-color: transparent;
		padding-block: 0px;
		padding-inline: 0px;
		font-size: 18px;
		line-height: 1.6;
		font-family:
			opensans,
			helvetica neue,
			arial,
			sans-serif;
	}

	.area-container:hover {
		background-color: #f2f2f2;
	}

	.chevron-svg {
		margin-left: 5px;
	}

	svg {
		overflow: visible;
	}
</style>
