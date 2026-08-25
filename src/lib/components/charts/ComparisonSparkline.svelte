<script lang="ts">
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { ONScolours } from '$lib/config';
	import { area, curveLinear } from 'd3-shape';
	import { Icon } from '@onsvisual/svelte-components';

	let {
		data,
		comparisonData,
		formatValue = (d) => d,
		xKey = 'period',
		yKey = 'value',
		idKey = 'areacd',
		labelKey = 'areanm',
		yDomain,
		xDomain,
		prefix,
		suffix,
		chartWidth
	} = $props();

	let xScale = $derived(xDomain ? scaleTime().domain(xDomain).range([0, 100]) : null);
	let yScale = $derived(yDomain ? scaleLinear().domain(yDomain).range([90, 0]) : null);

	const getCIArea = area()
		.x((d) => xScale(d.period))
		.y0((d) => yScale(d.lci_95))
		.y1((d) => yScale(d.uci_95))
		.curve(curveLinear);

	let diff = $derived(data[data.length - 1].value - data[0].value);
	let direction = diff === 0 ? 'no change' : diff < 0 ? 'lower' : 'higher';
	let suffix2 = $derived(suffix === '%' ? ' pp' : suffix);

	let posCol = '#BEE2f0';
	let negCol = '#ABBDC5';
	$inspect(data);
</script>

{#snippet ribbon(rows, color = ONScolours.grey40, opacity = 0.7)}
	{#if rows?.length}
		<path d={getCIArea(rows)} fill={color} stroke="none" {opacity} style:pointer-events="none" />
	{/if}
{/snippet}
{#snippet line(rows, color, dash = 'none', strokewidth = 1.5, width = 1.5)}
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
	style:padding-left="0px"
	style:padding-top="0px"
	style:padding-bottom="0px"
	style:padding-right="0px"
>
	<svg viewBox="0 0 100 90" class="sparkline-svg" style:height="90px" overflow="visible">
		{#if comparisonData?.length}
			{@render ribbon(comparisonData, ONScolours.grey60, 0.3)}
			{@render line(comparisonData, ONScolours.grey60, 1.5, 1)}
		{/if}
		{#if data?.length}
			{@render ribbon(data, ONScolours.oceanBlue, 0.2)}
			{@render line(data, ONScolours.oceanBlue, 'none', 2)}
		{/if}
	</svg>
	<div
		class="change-box"
		style:padding="5px;"
		style:background-color={diff === 0 ? ONScolours.grey25 : diff > 0 ? posCol : negCol}
	>
		{#if diff !== 0}
			<Icon type="arrow" rotation={diff > 0 ? 270 : 90} />
			<strong>{prefix}{formatValue(Math.abs(diff))}{suffix2}</strong>
		{/if}
		{direction}
	</div>
</div>

<style>
	.sparkline-individual {
		display: flex;
		align-items: center;
		height: 90px;
		width: 100%;
	}
	.sparkline-svg {
		min-width: 0;
		display: block;
	}
	.change-box {
		margin-left: 26px;
		/* 20px to match column gap, plus 6 to match the diamond padding around the pointrange */
	}
</style>
