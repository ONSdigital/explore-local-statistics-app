<script lang="ts">
	import { addThousandsSeparator, roundNumber } from '$lib/utils';
	import { colorsLookup } from '$lib/config.js';

	export let label, y, indicator, labelRectWidth, labelMidpoint, chartHeight;

	let labelRect;

	$: labelRectWidth = labelRect ? labelRect.width + 30 : 0;

	$: role = 'role' in label.datum ? label.datum.role : 'main';
</script>

<g class="label-group">
	<g transform="translate({labelMidpoint ? labelMidpoint : 0},0)">
		{#if labelRect}
			<rect
				x={-labelRect.width / 2 - 3}
				y={-43}
				width={labelRect.width + 6}
				height={role === 'main' ? 35 : 24}
				fill="white"
				stroke={colorsLookup[role].color}
				stroke-width={role === 'main' ? '3px' : '1.5px'}
				rx="2px"
			></rect>
		{/if}

		<g>
			<text
				style="font-size: {role === 'main' ? '30px' : '20px'}; stroke-width: {role === 'main'
					? '1px'
					: '0.5px'}"
				y={role === 'main' ? -15 : -24}
				bind:contentRect={labelRect}
				text-anchor="middle"
				fill={colorsLookup[role].color}
				stroke={colorsLookup[role].color}
				>{indicator.metadata.prefix +
					addThousandsSeparator(roundNumber(label.datum.value, indicator.metadata.decimalPlaces)) +
					indicator.metadata.suffix}</text
			>
		</g>
	</g>
</g>

<style>
	rect {
		pointer-events: none;
	}

	text {
		pointer-events: none;
	}
</style>
