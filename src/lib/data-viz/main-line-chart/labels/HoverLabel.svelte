<script lang="ts">
	import { segmentTextForLabels } from '$lib/util/charts/segmentTextForLabels';
	import { colorsLookup } from '$lib/config';

	export let label, y, fontSize, labelSpace;

	$: console.log(labelSpace);

	$: areaName = label.areanm;

	$: textArrayOptions = [
		[areaName],
		...segmentTextForLabels(areaName, 4, 0),
		...segmentTextForLabels(areaName, 4, 1)
	];

	let labelRectArray = [];
</script>

<g class="hover-label-container">
	<path
		transform="translate(2,0)"
		d="M5 {y(label.data[0].value)} l10 0"
		stroke={colorsLookup['selected'].color}
		fill="none"
		stroke-width="1px"
	></path>

	{#each textArrayOptions as textArray, i}
		{#if i === 0 || (labelRectArray[i - 1] && labelRectArray[i - 1].width > labelSpace)}
			<g
				transform="translate(20,{y(label.data[0].value) + 4})"
				opacity={labelRectArray[i] &&
				labelRectArray[i].width <= labelSpace &&
				(i === 0 || (labelRectArray[i - 1] && labelRectArray[i - 1].width > labelSpace))
					? 1
					: 0}
			>
				{#if labelRectArray[i]}
					<rect
						x={0}
						y={-labelRectArray[i].height / 2 - fontSize / 4.5}
						width={labelRectArray[i].width + 6}
						height={Math.max(
							0,
							labelRectArray[i].height -
								fontSize / 4.5 +
								(/[qgyp]/.test(textArray[textArray.length - 1]) ? 2 : 0)
						)}
						fill={colorsLookup['selected'].color}
						stroke="none"
						stroke-width="1.5px"
						rx="2px"
					></rect>
				{/if}

				<g bind:contentRect={labelRectArray[i]}>
					{#each textArray as line, j}
						<text
							x="3"
							style="font-size: {fontSize}px;"
							y={-textArray.length * (fontSize / 2) + j * fontSize + fontSize / 2}
							fill={colorsLookup['selected'].contrast}
							stroke="none">{line}</text
						>
					{/each}
				</g>
			</g>
		{/if}
	{/each}
</g>
