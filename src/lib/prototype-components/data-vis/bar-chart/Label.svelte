<script lang="ts">
	import { colorsLookup } from '$lib/config';

	export let label,
		hoverId,
		labelRect,
		customLookup,
		fontSize = 18,
		connectingLineInfo;

	$: color =
		label.datum.role != 'related' && hoverId === label.datum.areacd
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

	const onMouseEnterEvent = () => {
		if (label.datum.role != 'related') {
			hoverId = label.datum.areacd;
		}
	};

	const onMouseLeaveEvent = () => {
		hoverId = undefined;
	};

	$: textArray = label.datum.labelText;
</script>

{#if hoverId && hoverId != label.datum.areacd ? 0 : 1}
	<g class="label-group">
		<g>
			{#if label.labelOffset === 'down'}
				<path
					transform="translate(-17,-6)"
					d="M5 {label.targetY} l{(10 *
						(connectingLineInfo.groupLength - connectingLineInfo.groupPosition)) /
						(connectingLineInfo.groupLength + 1)} 0 l0 {label.y - label.targetY} L15 {label.y}"
					stroke={color.color}
					fill="none"
					stroke-width="1px"
				></path>
			{:else if label.labelOffset === 'up'}
				<path
					transform="translate(-17,-6)"
					d="M5 {label.targetY} l{(10 * (connectingLineInfo.groupPosition + 1)) /
						(connectingLineInfo.groupLength + 1)} 0 l0 {label.y - label.targetY} L15 {label.y}"
					stroke={color.color}
					fill="none"
					stroke-width="1px"
				></path>
			{:else}
				<path
					transform="translate(-17,-6)"
					d="M5 {label.targetY} l10 0"
					stroke={color.color}
					fill="none"
					stroke-width="1px"
				></path>
			{/if}
		</g>

		<g
			transform="translate(-20,{label.y}
			)"
			on:mouseenter={onMouseEnterEvent}
			on:mouseleave={onMouseLeaveEvent}
		>
			{#if labelRect}
				<rect
					x={-labelRect.width}
					y={-labelRect.height / 2 - fontSize / 4.5}
					width={labelRect.width + 6}
					height={Math.max(
						0,
						labelRect.height -
							fontSize / 4.5 +
							(/[qgyp]/.test(textArray[textArray.length - 1]) ? 2 : 0)
					)}
					fill={color.color}
					stroke="none"
					stroke-width="1.5px"
					rx="2px"
				></rect>
			{/if}

			<g bind:contentRect={labelRect}>
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
		</g>
	</g>
{/if}
<!-- {#if hoverId === label.datum.areacd || !hoverId}
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
{/if} -->
