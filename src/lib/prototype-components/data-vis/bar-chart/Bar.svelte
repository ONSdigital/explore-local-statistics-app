<script lang="ts">
	import { colorsLookup } from '$lib/config';
	import { splitTextIntoRows } from '$lib/utils.js';

	export let area, y, chartHeight, labelBBox, customLookup, showConfidenceIntervals, totalHeight;

	$: labelArray = area.areanm.length > 25 ? splitTextIntoRows(area.areanm, 2) : [area.areanm];

	$: color = area
		? area.role === 'custom'
			? Object.keys(customLookup).length > colorsLookup.custom.length
				? colorsLookup.customExceedThreshold
				: colorsLookup.custom[area.areacd in customLookup ? customLookup[area.areacd] : 0]
			: colorsLookup[area.role]
		: { color: null, constrast: null };
</script>

{#if !showConfidenceIntervals}
	<rect
		width={Math.max(0, y(area.data.value))}
		y={-Math.min(area.height / 2, 50)}
		height={Math.min(area.height, 100)}
		fill={color.color}
		stroke="none"
	></rect>
{:else}
	<rect
		width={Math.max(0, y(area.data.value))}
		y={-Math.min(area.height / 2, 50)}
		height={Math.min(area.height, 100)}
		fill={color.color}
		stroke="none"
		opacity="0.2"
	></rect>
{/if}

{#if showConfidenceIntervals && area.data.lci && area.data.uci}
	<rect
		x={y(area.data.lci)}
		width={Math.max(y(area.data.uci) - y(area.data.lci), 0)}
		y={-Math.min(area.height / 4, 20)}
		height={Math.min(area.height / 2, 40)}
		fill={'white'}
		stroke="none"
		opacity="1"
	></rect>

	<rect
		x={y(area.data.lci)}
		width={Math.max(0, y(area.data.uci) - y(area.data.lci))}
		y={-Math.min(area.height / 4, 20)}
		height={Math.min(area.height / 2, 40)}
		fill={color.color}
		stroke="white"
		opacity="0.6"
		stroke-width={Math.min(area.height / 4, 20) > 4 ? '1px' : '0px'}
	></rect>
	<rect
		x={y(area.data.lci) - 1}
		width={2}
		y={-Math.min(area.height / 4, 20) - Math.min(area.height / 4, 20) / 4}
		height={Math.min(area.height / 2, 40) + Math.min(area.height / 4, 20) / 2}
		fill={color.color}
		stroke={'white'}
		opacity="1"
		stroke-width="0.5px"
	></rect>

	<rect
		x={y(area.data.uci) - 1}
		width={2}
		y={-Math.min(area.height / 4, 20) - Math.min(area.height / 4, 20) / 4}
		height={Math.min(area.height / 2, 40) + Math.min(area.height / 4, 20) / 2}
		fill={color.color}
		stroke={'white'}
		opacity="1"
		stroke-width="0.5px"
	></rect>
{/if}

{#if showConfidenceIntervals}
	<rect
		x={Math.max(0, y(area.data.value)) - 2}
		y={-Math.min(area.height / 2, 50)}
		width="4"
		height={Math.min(area.height, 100)}
		fill={color.color}
		stroke="white"
		stroke-width={Math.min(area.height / 4, 20) > 1 ? '1px' : '0.5px'}
	></rect>
{/if}

<!-- <g transform="translate(-5,10)">
	{#if labelBBox}
		<rect
			x={-7 - labelBBox.width}
			width={labelBBox.width + 6}
			y={[labelBBox.y - 22, labelBBox.y - 28][labelArray.length - 1]}
			height={[22, 38][labelArray.length - 1]}
			rx="2px"
			stroke="none"
			fill={color.color}
		></rect>
	{/if}

	<g bind:contentRect={labelBBox}>
		{#each labelArray as line, i}
			<text
				x="-5"
				y={labelArray.length === 1 ? -5 : [-11, 6][i]}
				fill={color.contrast}
				stroke={color.contrast}
				stroke-width="0.5px"
				text-anchor="end">{line}</text
			>
		{/each}
	</g>
</g> -->

<!-- <rect
	y={-(chartHeight - 100)}
	height={chartHeight - 100}
	width={y(area.data.value)}
	fill={colorsLookup[area.role].color}
	stroke="none"
></rect>

<g bind:contentRect={labelBBox}>
	{#each labelArray as line, i}
		<text
			x="-5"
			y={-5 + 18 * i - labelArray.length}
			fill={colorsLookup[area.role].color}
			stroke={colorsLookup[area.role].color}
			stroke-width="0.5px"
			text-anchor="end">{line}</text
		>
	{/each}
</g> -->
