<script lang="ts">
	import { addThousandsSeparator, roundNumber } from '$lib/utils';
	import { colorsLookup } from '$lib/config.js';

	export let indicator, xDomain, data, y, maxLabelWidth, role, hover;

	let labelRect;

	$: maxLabelWidth = labelRect ? labelRect.width + 45 : 100;

	$: initialValue = data[data.length - 1];
	$: latestValue = data[0];

	$: changeValue =
		latestValue && initialValue
			? roundNumber(latestValue.value - initialValue.value, indicator.metadata.decimalPlaces)
			: null;
</script>

{#if changeValue}
	<g class="label-group">
		<g transform="translate(15,{(y(latestValue.value) + y(initialValue.value)) / 2})">
			{#if labelRect}
				<rect
					x={-3}
					y={hover ? -11 : -13}
					width={labelRect.width + 20}
					height={hover ? 25 : 29}
					fill="white"
					stroke={colorsLookup[role].color}
					stroke-width={hover ? '1.5' : '2px'}
					rx="2px"
				></rect>
			{/if}

			<g>
				<text
					style="font-size: {hover ? 20 : 24}px; stroke-width: {hover ? 0.5 : 1}px;"
					x="14"
					y={hover ? 8 : 10}
					bind:contentRect={labelRect}
					text-anchor="start"
					fill={colorsLookup[role].color}
					stroke={colorsLookup[role].color}
					>{indicator.metadata.prefix +
						addThousandsSeparator(
							Math.abs(changeValue).toFixed(indicator.metadata.decimalPlaces)
						)}</text
				>
			</g>

			{#if roundNumber(latestValue.value - initialValue.value, indicator.metadata.decimalPlaces) > 0}
				<path d="M 6 -6 L 6 9" stroke={colorsLookup[role].color} stroke-width="2px"></path>
				<path
					d="M6 -6 l-3 3 l6 0 z"
					stroke={colorsLookup[role].color}
					fill={colorsLookup[role].color}
					stroke-width="2px"
				></path>
			{:else if roundNumber(initialValue.value - latestValue.value, indicator.metadata.decimalPlaces) > 0}
				<path d="M 6 -6 L 6 9" stroke={colorsLookup[role].color} stroke-width="2px"></path>
				<path
					d="M6 9 l-3 -3 l6 0 z"
					stroke={colorsLookup[role].color}
					fill={colorsLookup[role].color}
					stroke-width="2px"
				></path>
			{:else}
				<path d="M 2 2.5 L 10 2.5" stroke={colorsLookup[role].color} stroke-width="2px"></path>
			{/if}
		</g>
	</g>
{/if}
