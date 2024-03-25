<script lang="ts">
	import { colorsLookup } from '$lib/config.js';
	import { splitString } from '$lib/segmentTextForLabels';

	export let width,
		metadata,
		area,
		y,
		chartHeight,
		chartWidth,
		spaceForOutliers,
		adjustmentValue = 0;

	$: labelPinPoint = area.x + spaceForOutliers > width / 2 ? 'end' : 'start';
	$: labelSpace =
		labelPinPoint === 'end'
			? area.x + spaceForOutliers - 50
			: width - area.x - spaceForOutliers - 50;

	$: areaName = metadata.areasObject[area.datum.areacd].areanm;

	$: textArrayOptions = [
		[areaName],
		...splitString(areaName, 4, 0),
		...splitString(areaName, 4, 1)
	];

	let labelRectArray = [];

	$: console.log(labelSpace);
</script>

{#each textArrayOptions as textArray, i}
	{#if i === 0 || (labelRectArray[i - 1] && labelRectArray[i - 1].width > labelSpace)}
		<g
			transform="translate({area.x + (labelPinPoint === 'start' ? 15 : -15)},{Math.max(
				10,
				y(area.y) + 5 + adjustmentValue
			)})"
			opacity={labelRectArray[i] &&
			labelRectArray[i].width <= labelSpace &&
			(i === 0 || (labelRectArray[i - 1] && labelRectArray[i - 1].width > labelSpace))
				? 1
				: 0}
		>
			{#if labelRectArray[i]}
				<rect
					x={(labelPinPoint === 'start' ? 0 : -labelRectArray[i].width) - 3}
					y={-textArray.length * 10 - 9}
					width={labelRectArray[i].width + 6}
					height={labelRectArray[i].height +
						(/[qgyp]/.test(textArray[textArray.length - 1]) ? -1 : -4)}
					fill="white"
					stroke={colorsLookup['selected'].color}
					stroke-width="1.5px"
					rx="2px"
				></rect>
			{/if}

			<g bind:contentRect={labelRectArray[i]}>
				{#each textArray as line, j}
					<text
						style="font-size: 20px; stroke-width: 0.5px"
						y={-textArray.length * 10 + j * 20 + 10}
						text-anchor={labelPinPoint}
						fill={colorsLookup['selected'].color}
						stroke={colorsLookup['selected'].color}>{line}</text
					>
				{/each}
			</g>
		</g>
	{/if}
{/each}

<style>
	path {
		pointer-events: none;
	}
</style>
