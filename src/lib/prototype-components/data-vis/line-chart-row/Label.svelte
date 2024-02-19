<script lang="ts">
	import { addThousandsSeparator, roundNumber } from '$lib/utils';
	import { colorsLookup } from '$lib/config.js';

	export let indicator, xDomain, data, y, maxLabelWidth, role;

	let labelRect;

	$: maxLabelWidth = labelRect ? labelRect.width + 45 : 80;

	$: initialValue = data.find((el) => el.xDomainNumb == xDomain[0]);
	$: latestValue = data.find((el) => el.xDomainNumb == xDomain[1]);

	$: changeValue =
		latestValue && initialValue
			? roundNumber(latestValue.value - initialValue.value, indicator.metadata.decimalPlaces)
			: null;
</script>

{#if changeValue}
	<g class="label-group" style="opacity: {changeValue == 0 ? 0 : 1}">
		<g transform="translate(10,{(y(latestValue.value) + y(initialValue.value)) / 2})">
			{#if labelRect}
				<rect
					x={-3}
					y={-13}
					width={labelRect.width + 20}
					height="29"
					fill="white"
					stroke={colorsLookup[role].color}
					stroke-width="2.5px"
					rx="2px"
				></rect>
			{/if}

			<g>
				<text
					style="font-size: 24px; stroke-width: 1px;"
					x="14"
					y="10"
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
			<path d="M 6 -6 L 6 9" stroke={colorsLookup[role].color} stroke-width="2px"></path>
			{#if latestValue.value > initialValue.value}
				<path
					d="M6 -6 l-3 3 l6 0 z"
					stroke={colorsLookup[role].color}
					fill={colorsLookup[role].color}
					stroke-width="2px"
				></path>
			{:else}
				<path
					d="M6 9 l-3 -3 l6 0 z"
					stroke={colorsLookup[role].color}
					fill={colorsLookup[role].color}
					stroke-width="2px"
				></path>
			{/if}
		</g>
	</g>
{/if}
