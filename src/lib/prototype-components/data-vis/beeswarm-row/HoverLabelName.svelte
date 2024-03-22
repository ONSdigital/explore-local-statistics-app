<script lang="ts">
	import { addThousandsSeparator, roundNumber, splitTextIntoRows } from '$lib/utils';
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

	let labelRect;

	$: labelRectWidth = labelRect ? labelRect.width + 10 : 0;

	$: labelText = metadata.areasObject[area.datum.areacd].areanm;

	$: labelTextArray =
		labelText.length > 25 ? splitTextIntoRows(labelText, 2).filter((el) => el != '') : [labelText];

	$: labelPinPoint = area.x + spaceForOutliers > width / 2 ? 'end' : 'start';
	$: labelSpace =
		labelPinPoint === 'end'
			? area.x + spaceForOutliers - 50
			: width - area.x - spaceForOutliers - 50;

	$: console.log(metadata.areasObject[area.datum.areacd].areanm);

	$: console.log(splitString(metadata.areasObject[area.datum.areacd].areanm, 3, 0));
	$: console.log(splitString(metadata.areasObject[area.datum.areacd].areanm, 3, 1));

	$: areaName = metadata.areasObject[area.datum.areacd].areanm;

	$: textArrayOptions = [
		[areaName],
		...splitString(metadata.areasObject[area.datum.areacd].areanm, 4, 0),
		...splitString(metadata.areasObject[area.datum.areacd].areanm, 4, 1)
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

<!-- <g class="label-text-group">
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
</g> -->

<style>
	path {
		pointer-events: none;
	}
</style>
