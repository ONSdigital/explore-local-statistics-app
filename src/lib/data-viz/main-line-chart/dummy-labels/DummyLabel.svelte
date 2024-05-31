<script lang="ts">
	import { segmentTextForLabels } from '$lib/util/charts/segmentTextForLabels';
	import { replaceIfStartsWithAll } from '$lib/util/charts/replaceIfStartsWithAll';
	import { colorsLookup } from '$lib/config.js';

	export let line, labelSpace, label, fontSize;

	let labelRectArray = [];
	$: areaName = line.groupLabel ? replaceIfStartsWithAll(line.areanm) : line.areanm;

	//track the index of the first text option in textArrayOptions which fits within the allotted label space, then set this equal to label, which is passed back up to the LineChart component and carried into the main labelling components
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
		...segmentTextForLabels(areaName, 3, 0),
		...segmentTextForLabels(areaName, 3, 1),
		...segmentTextForLabels(areaName, 3, 2)
	];

	$: label = index != null ? textArrayOptions[index] : null;
</script>

{#each textArrayOptions as textArray, i}
	{#if i === 0 || (labelRectArray[i - 1] && labelRectArray[i - 1].width > labelSpace)}
		<g transform="translate(9999,0)" opacity="0">
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
