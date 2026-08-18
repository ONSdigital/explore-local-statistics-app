<script lang="ts">
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { ONScolours } from '$lib/config';
	import { area, curveLinear } from 'd3-shape';

	let {
		data,
		comparisonData,
		xKey = 'period',
		yKey = 'value',
		idKey = 'areacd',
		labelKey = 'areanm',
		yDomain,
		xDomain
	} = $props();
	let leftMargin = $state(0);

	let xScale = $derived(xDomain ? scaleTime().domain(xDomain).range([0, 100]) : null);
	let yScale = $derived(yDomain ? scaleLinear().domain(yDomain).range([70, 0]) : null);

	const getCIArea = area()
		.x((d) => xScale(d.period))
		.y0((d) => yScale(d.lci_95))
		.y1((d) => yScale(d.uci_95))
		.curve(curveLinear);
</script>

{#snippet ribbon(rows, color = ONScolours.grey40, opacity = 0.7)}
	{#if rows?.length}
		<path d={getCIArea(rows)} fill={color} stroke="none" {opacity} style:pointer-events="none" />
	{/if}
{/snippet}
{#snippet line(rows, color, dash = 'none', strokewidth = 1.25, width = 1.5)}
	{#if rows?.length}
		<polyline
			points={rows.map((d) => [xScale(d.period), yScale(d.value)].join(',')).join(' ')}
			stroke={color}
			stroke-width={strokewidth}
			fill="none"
			stroke-dasharray={dash}
			{width}
		/>
	{/if}
{/snippet}
<div
	class="sparkline-individual"
	style:padding-left="{leftMargin}px"
	style:padding-top="10px"
	style:padding-bottom="10px"
>
	<svg viewBox="0 0 100 70" class="sparkline-svg" style:height="90px">
		{#if comparisonData?.length}
			<!-- {@render ribbon(comparisonData)} -->
			<!-- no confidence intervals for comparison line(?) ^ -->
			{@render line(comparisonData, ONScolours.grey60, 2.5, 0.85)}
		{/if}
		{#if data?.length}
			{@render ribbon(data, ONScolours.nightBlue, 0.3)}
			{@render line(data, ONScolours.nightBlue)}
		{/if}
	</svg>
</div>
