<script lang="ts">
	import { splitString } from '$lib/segmentTextForLabels';
	import { colorsLookup } from '$lib/config';

	export let label, maxLabelWidth, y, isHoverLabelVisible, fontSize, labelSpace;

	// $: console.log(label);

	$: areaName = label.areanm;

	$: textArrayOptions = [
		[areaName],
		...splitString(areaName, 4, 0),
		...splitString(areaName, 4, 1)
	];

	let labelRectArray = [];

	let color = colorsLookup.selected;
	let labelRect;
</script>

<g class="hover-label-container">
	<g class="label-group" transform="translate(0,6)">
		<g>
			<path
				transform="translate(2,-6)scale(-1,1)"
				d="M5 {label.position} l10 0"
				stroke={color.color}
				fill="none"
				stroke-width="1px"
			></path>
		</g>

		<g transform="translate(-22,{label.position})">
			{#each textArrayOptions as textArray, i}
				<g
					opacity={labelRectArray[i] &&
					labelRectArray[i].width <= labelSpace &&
					(i === 0 || (labelRectArray[i - 1] && labelRectArray[i - 1].width > labelSpace))
						? 1
						: 0}
				>
					{#if i === 0 || (labelRectArray[i - 1] && labelRectArray[i - 1].width > labelSpace)}
						{#if labelRectArray[i]}
							<rect
								x={-4 + -labelRectArray[i].width}
								y={-4 + -labelRectArray[i].height / 2 - fontSize / 4.5}
								width={labelRectArray[i].width + 14}
								height={Math.max(
									0,
									labelRectArray[i].height -
										fontSize / 4.5 +
										(/[qgyp]/.test(textArray[textArray.length - 1]) ? 10 : 8)
								)}
								fill={color.color}
								stroke="none"
								stroke-width="1.5px"
								rx="2px"
							></rect>
						{/if}

						<g bind:contentRect={labelRectArray[i]}>
							{#each textArray as line, j}
								<text
									x="3"
									text-anchor="end"
									style="font-size: {fontSize}px;"
									y={-textArray.length * (fontSize / 2) + j * fontSize + fontSize / 2}
									fill={color.contrast}
									stroke="none">{line}</text
								>
							{/each}
						</g>
					{/if}
				</g>
			{/each}
		</g>
	</g>
</g>

<style>
	.hover-label-container {
		pointer-events: none;
	}
</style>
