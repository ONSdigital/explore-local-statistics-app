<script lang="ts">
	import { addThousandsSeparator, roundNumber, splitTextIntoRows } from '$lib/utils';
	import { colorsLookup } from '$lib/config.js';

	export let width,
		metadata,
		area,
		y,
		chartHeight,
		chartWidth,
		spaceForOutliers,
		adjustmentValue = 0;

	let labelRect;

	$: labelRectWidth = labelRect ? labelRect.width + 10 : 0;

	$: labelText = metadata.areasObject[area.datum.areacd].areanm;

	$: labelTextArray =
		labelText.length > 25 ? splitTextIntoRows(labelText, 2).filter((el) => el != '') : [labelText];

	$: labelPinPoint = area.x - labelRectWidth - 15 < -spaceForOutliers / 2 ? 'start' : 'end';
</script>

<g class="label-text-group">
	<g
		transform="translate({area.x + (labelPinPoint === 'start' ? 15 : -15)},{y(area.y) +
			adjustmentValue +
			7 +
			(labelRect ? -labelRect.height / 2 : 0)})"
	>
		{#if labelRect}
			<rect
				x={(labelPinPoint === 'start' ? 0 : -labelRect.width) - 3}
				y="-6"
				width={labelRect.width + 6}
				height={labelRect.height - 4}
				fill="white"
				stroke={colorsLookup['selected'].color}
				stroke-width="1.5px"
				rx="2px"
			></rect>
		{/if}

		<g bind:contentRect={labelRect}>
			{#each labelTextArray as line, i}
				<text
					style="font-size: 20px; stroke-width: 0.5px"
					y={20 * i + 12}
					text-anchor={labelPinPoint}
					fill={colorsLookup['selected'].color}
					stroke={colorsLookup['selected'].color}>{line}</text
				>
			{/each}
		</g>
	</g>
</g>

<style>
	path {
		pointer-events: none;
	}
</style>
