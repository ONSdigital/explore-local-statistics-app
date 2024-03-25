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

<rect
	width={Math.max(0, y(area.data.value))}
	y={-Math.min(area.height / 2, 50)}
	height={Math.min(area.height, 100)}
	fill={color.color}
	stroke="none"
></rect>

{#if showConfidenceIntervals && area.data.lci && area.data.uci}
	<!-- <rect
		x={y(area.data.lci)}
		width={y(area.data.uci) - y(area.data.lci)}
		y="-10"
		height="20"
		fill={'white'}
		stroke="none"
		opacity="1"
	></rect>

	<rect
		x={y(area.data.lci)}
		width={y(area.data.uci) - y(area.data.lci)}
		y={-10}
		height="20"
		fill={color.color}
		stroke="none"
		opacity="0.25"
	></rect> -->
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
