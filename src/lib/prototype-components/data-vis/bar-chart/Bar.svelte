<script lang="ts">
	import { colorsLookup } from '$lib/config';
	import { splitTextIntoRows } from '$lib/utils.js';

	export let data, area, y, chartHeight, labelBBox;

	$: labelArray = area.areanm.length > 25 ? splitTextIntoRows(area.areanm, 2) : [area.areanm];
</script>

<rect
	y={-(chartHeight - 100) / data.length / 2}
	height={(chartHeight - 100) / data.length}
	width={y(area.data[0].value)}
	fill={colorsLookup[area.role].color}
	stroke="none"
></rect>

<g bind:contentRect={labelBBox}>
	{#each labelArray as line, i}
		<text
			x="-5"
			y={-5 + 18 * i - labelArray.length * 18 + (chartHeight - 100) / data.length / 2}
			fill={colorsLookup[area.role].color}
			stroke={colorsLookup[area.role].color}
			stroke-width="0.5px"
			text-anchor="end">{line}</text
		>
	{/each}
</g>
