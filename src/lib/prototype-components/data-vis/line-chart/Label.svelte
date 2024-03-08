<script lang="ts">
	import { splitTextIntoRows } from '$lib/utils.js';
	import { colorsLookup } from '$lib/config';

	export let label, hoverId, labelBBox, customLookup;

	$: color =
		hoverId === label.datum.areacd
			? colorsLookup.selected
			: label
				? label.datum.role === 'custom'
					? Object.keys(customLookup).length > colorsLookup.custom.length
						? colorsLookup.customExceedThreshold
						: colorsLookup.custom[
								label.datum.areacd in customLookup ? customLookup[label.datum.areacd] : 0
							]
					: colorsLookup[label.datum.role]
				: { color: null, constrast: null };

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
				fill={color.color}
			></rect>
		{/if}

		<g bind:contentRect={labelBBox}>
			{#each labelArray as line, i}
				<text y={18 * i} fill={color.contrast}>{line}</text>
			{/each}
		</g>
	</g>
{/if}
