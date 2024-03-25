<script lang="ts">
	import { splitString } from '$lib/segmentTextForLabels';
	import { colorsLookup } from '$lib/config.js';
	export let line, labelSpace, label, fontSize;

	let labelRectArray = [];
	$: areaName = line.areanm;

	$: index = labelRectArray
		? Array.from(Array(labelRectArray.length).keys()).find((i) => {
				return (
					labelRectArray[i] &&
					labelRectArray[i].width <= labelSpace &&
					(i === 0 || (labelRectArray[i - 1] && labelRectArray[i - 1].width > labelSpace))
				);
			})
		: null;

	$: textArrayOptions = [
		[areaName],
		...splitString(areaName, 3, 0),
		...splitString(areaName, 3, 1),
		...splitString(areaName, 3, 2)
	];

	//$: labelRect = index != null ? labelRectArray[index] : null;
	$: label = index != null ? textArrayOptions[index] : null;
</script>

{#each textArrayOptions as textArray, i}
	{#if i === 0 || (labelRectArray[i - 1] && labelRectArray[i - 1].width > labelSpace)}
		<g
			transform="translate(9999,{line.labelPosition}
			)"
			opacity="0"
		>
			<!-- {#if labelRectArray[i]}
				<rect
					x={0}
					y={-textArray.length * 10 - 9}
					width={labelRectArray[i].width + 6}
					height={Math.max(
						0,
						labelRectArray[i].height + (/[qgyp]/.test(textArray[textArray.length - 1]) ? -1 : -4)
					)}
					fill="white"
					stroke={colorsLookup['selected'].color}
					stroke-width="1.5px"
					rx="2px"
				></rect>
			{/if} -->

			<g bind:contentRect={labelRectArray[i]}>
				{#each textArray as line, j}
					<text
						x="3"
						style="font-size: {fontSize}px; stroke-width: 0.5px"
						y={-textArray.length * (fontSize / 2) + j * fontSize + fontSize / 2}
						fill={colorsLookup['selected'].color}
						stroke={colorsLookup['selected'].color}>{line}</text
					>
				{/each}
			</g>
		</g>
	{/if}
{/each}
