<script lang="ts">
	import { addThousandsSeparator } from '$lib/utils';
	import { colorsLookup } from '$lib/config.js';
	import { roundNumber } from '$lib/utils';

	export let area,
		y,
		indicator,
		chartHeight,
		chartWidth,
		spaceForOutliers,
		adjustmentValue = 0;

	let labelRect;

	//the width of the label container is calculated, and then used to find the midpoint of the label
	$: labelRectWidth = labelRect ? labelRect.width + 10 : 0;

	$: labelMidpoint = Math.min(
		Math.max(labelRectWidth / 2 - spaceForOutliers / 2, area.x),
		chartWidth + spaceForOutliers / 2 - labelRectWidth / 2
	);

	//creates a svg path that connects the area circle with the label
	$: linePath =
		area.x >= labelMidpoint - (3 * labelRectWidth - 10) / 8 &&
		area.x <= labelMidpoint + (3 * labelRectWidth - 10) / 8
			? 'M ' +
				area.x +
				' ' +
				(y(area.y) - chartHeight + adjustmentValue) +
				' L ' +
				area.x +
				' ' +
				(-chartHeight - 35)
			: 'M ' +
				area.x +
				' ' +
				(y(area.y) - chartHeight + adjustmentValue) +
				' L ' +
				area.x +
				' ' +
				(y(area.y) - chartHeight - 20 + adjustmentValue) +
				' L ' +
				labelMidpoint +
				' ' +
				(y(area.y) - chartHeight - 20 + adjustmentValue) +
				' L ' +
				labelMidpoint +
				' ' +
				(-chartHeight - 35);
</script>

<g class="label-path-group">
	<g transform="translate(0,{chartHeight})">
		<path stroke="white" fill="none" d={linePath} stroke-width="4px"></path>
		<path stroke={colorsLookup['selected'].color} fill="none" d={linePath} stroke-width="1.5px"
		></path>
	</g>
</g>

<g class="label-group">
	<g transform="translate({labelMidpoint},0)">
		{#if labelRect}
			<rect
				x={-labelRect.width / 2 - 3}
				y={-43}
				width={labelRect.width + 6}
				height="24"
				fill="white"
				stroke={colorsLookup['selected'].color}
				stroke-width="1.5px"
				rx="2px"
			></rect>
		{/if}

		<g>
			<text
				style="font-size: 20px; stroke-width: 0.5px"
				y="-24"
				bind:contentRect={labelRect}
				text-anchor="middle"
				fill={colorsLookup['selected'].color}
				stroke={colorsLookup['selected'].color}
				>{indicator.metadata.prefix +
					addThousandsSeparator(roundNumber(area.datum.value, indicator.metadata.decimalPlaces)) +
					indicator.metadata.suffix}</text
			>
		</g>
	</g>
</g>

<style>
	path {
		pointer-events: none;
	}
</style>
