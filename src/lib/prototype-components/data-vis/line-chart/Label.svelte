<script lang="ts">
	import { splitTextIntoRows } from '$lib/utils.js';
	import { colorsLookup } from '$lib/config';

	export let label, hoverId, labelBBox;

	$: console.log(label);

	$: backgroundColor =
		colorsLookup[hoverId === label.datum.areacd ? 'selected' : label.datum.role].color;
	$: textColor =
		colorsLookup[hoverId === label.datum.areacd ? 'selected' : label.datum.role].contrast;

	$: labelArray =
		label.datum.areanm.length > 25
			? splitTextIntoRows(label.datum.areanm, 2)
			: [label.datum.areanm];

	const onMouseEnterEvent = () => {
		hoverId = label.datum.areacd;
	};

	const onMouseLeaveEvent = () => {
		hoverId = undefined;
	};
</script>

{#if hoverId === label.datum.areacd || !hoverId}
	<g
		on:mouseenter={onMouseEnterEvent}
		on:mouseleave={onMouseLeaveEvent}
		class="label-container"
		transform="translate(0,{label.y})"
	>
		{#if labelBBox}
			<rect
				x={-3}
				width={labelBBox.width + 6}
				y={labelBBox.y - 18}
				height={labelBBox.height}
				rx="2px"
				stroke="none"
				fill={backgroundColor}
			></rect>
		{/if}

		<g bind:contentRect={labelBBox}>
			{#each labelArray as line, i}
				<text y={18 * i} fill={textColor}>{line}</text>
			{/each}
		</g>
	</g>
{/if}
