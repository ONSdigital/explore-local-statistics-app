<script lang="ts">
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { nice } from 'd3-array';
	import { format } from 'd3-format';
	import { area, curveLinear } from 'd3-shape';
	import { parseChartData, contrastColor, getPaletteColor, getMarkerPath } from './chartHelpers';
	import { shortenPeriodFormatter } from '$lib/utils';
	import { ONScolours } from '$lib/config';

	let {
		data,
		metadata,
		xKey = 'period',
		yKey = 'value',
		idKey = 'areacd',
		labelKey = 'areanm',
		formatPeriod = (d) => d,
		formatValue = (d) => d,
		valuePrefix = null,
		valueSuffix = null,
		showIntervals = false,
		selected = []
	} = $props();

	// Ensure that there are at least 2 unique time periods in the data
	function isValidLineData(data) {
		return data?.[xKey] && new Set(data[xKey]).size > 1;
	}

	const formatYTick = format('~s');

	let _data = $derived(isValidLineData(data) ? parseChartData(data, yKey, xKey, idKey) : null);
	let _selected = $derived(
		_data
			? selected
					.map((cd, i) => ({ i, data: _data.keyed[cd] }))
					.filter((d) => Array.isArray(d.data) && d.data.length > 1)
			: []
	);

	let xScale = $derived(_data ? scaleTime().domain(_data.dateDomain).range([0, 100]) : null);
	let yDomain = $derived(_data ? nice(..._data.valueDomain, 2) : null);
	let yScale = $derived(yDomain ? scaleLinear().domain(yDomain).range([100, 0]) : null);

	let formatPeriodShort = $derived(shortenPeriodFormatter(formatPeriod));

	let margins = $state({ left: 0, right: 0 });
	function updateMargins(el, params) {
		const width = el.getBoundingClientRect().width;
		if (width > margins[params.side]) margins[params.side] = width;
	}
	const getCIArea = area()
		.x((d) => xScale(d.date))
		.y0((d) => yScale(d.lci_95))
		.y1((d) => yScale(d.uci_95))
		.curve(curveLinear);
</script>

{#snippet ribbon(arr, color, opacity = 0.3)}
	{#if showIntervals && arr.i == 0 && arr.data.every((d) => d.lci_95 != null && d.uci_95 != null)}
		<path
			d={getCIArea(arr.data)}
			fill={color}
			stroke="none"
			{opacity}
			style:pointer-events="none"
		/>
	{/if}
{/snippet}

{#snippet line(arr, width = 2, color = ONScolours.grey60)}
	<polyline
		points={arr.map((d) => [xScale(d.date), yScale(d[yKey])].join(',')).join(' ')}
		stroke={color}
		stroke-width={width}
	/>
{/snippet}

{#snippet marker(d, path, color)}
	<svg
		viewBox="-4 -4 8 8"
		class="sparkline-marker"
		style:top="{yScale(d[yKey])}%"
		style:left="{xScale(d.date)}%"
	>
		<path d={path} fill={color} vector-effect="non-scaling-stroke" />
	</svg>
{/snippet}

{#snippet label(d, diff, color)}
	<div
		use:updateMargins={{ side: 'right' }}
		class="sparkline-label"
		style:background={color}
		style:color={contrastColor(color)}
		style:top="{yScale(d[yKey])}%"
	>
		{diff > 0 ? '+' : ''}{valuePrefix}{formatValue(diff)}{valueSuffix}
	</div>
{/snippet}

{#if _data && _selected?.length && xScale && yScale}
	{@const target = _selected[_selected.length - 1].data}
	{@const diff = target[target.length - 1][yKey] - target[0][yKey]}
	{@const direction = diff < 0 ? 'decreased' : 'increased'}
	<p class="ons-u-vh">
		Line chart for {metadata.label} ({metadata.subText}) in {data.areanm[0]}. Between {formatPeriodShort(
			_data.dateDomain[0]
		)} and {formatPeriodShort(_data.dateDomain[1])}
		{metadata.label}
		{direction} by {formatValue(Math.abs(diff))}.
	</p>
	<div
		class="sparkline-wrapper"
		style:padding-left="{margins.left + 10}px"
		style:padding-right="{margins.right + 10}px"
		style:padding-top="10px"
		style:padding-bottom="25px"
		aria-hidden="true"
	>
		<div class="sparkline-container">
			<svg
				viewBox="0 0 100 100"
				class="sparkline-svg"
				preserveAspectRatio="none"
				style:height="90px"
			>
				<g class="sparkline-lines">
					{#key _selected}
						{@const count = selected.length}
						{#each [..._selected].reverse() || [] as d}
							{@render line(d.data, 2, getPaletteColor(d.i, count))}
							{@render ribbon(d, getPaletteColor(d.i, count))}
						{/each}
					{/key}
				</g>
			</svg>
			<div class="sparkline-x-axis">
				{#each _data?.dateDomain || [] as xTick}
					<div class="sparkline-x-tick" style:left="{xScale(xTick)}%"></div>
					<div class="sparkline-x-tick-label" style:left="{xScale(xTick)}%">
						{formatPeriodShort(xTick)}
					</div>
				{/each}
			</div>
			<div class="sparkline-y-axis">
				<div class="sparkline-y-baseline"></div>
				{#each yDomain || [] as yTick, i}
					<div class="sparkline-y-tick" style:top="{yScale(yTick)}%"></div>
					<div
						use:updateMargins={{ side: 'left' }}
						class="sparkline-y-tick-label"
						style:top="{yScale(yTick)}%"
					>
						{formatYTick(yTick)}
					</div>
				{/each}
			</div>
			<div class="sparkline-annotations">
				{#key _selected}
					{@const count = selected.length}
					{#each [..._selected].reverse() || [] as d}
						{@const datum = d.data[d.data.length - 1]}
						{@const diff = datum[yKey] - d.data[0][yKey]}
						{@render marker(datum, getMarkerPath(d.i, count), getPaletteColor(d.i, count))}
						{#if d.i === 0}{@render label(datum, diff, getPaletteColor(d.i, count))}{/if}
					{/each}
				{/key}
			</div>
		</div>
	</div>
{:else}
	<div class="no-data-message ons-u-fs-s">Time series data not available.</div>
{/if}

<style>
	.sparkline-wrapper {
		display: block;
		position: relative;
	}
	.sparkline-container {
		display: block;
		position: relative;
	}
	.sparkline-x-axis,
	.sparkline-y-axis,
	.sparkline-annotations {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
	}
	.sparkline-x-tick {
		position: absolute;
		top: 100%;
		height: 8px;
		border-left: 1px solid var(--ons-color-grey-40);
	}
	.sparkline-x-tick-label {
		position: absolute;
		top: calc(100% + 4px);
		transform: translateX(-50%);
		font-size: 14px;
		white-space: nowrap;
	}
	.sparkline-y-baseline {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		border-left: 1px solid var(--ons-color-grey-40);
	}
	.sparkline-y-tick {
		position: absolute;
		right: 100%;
		width: 8px;
		border-top: 1px solid var(--ons-color-grey-40);
	}
	.sparkline-y-tick-label {
		position: absolute;
		right: calc(100% + 12px);
		transform: translateY(-50%);
		font-size: 14px;
		white-space: nowrap;
		text-transform: lowercase;
	}
	.sparkline-svg {
		display: block;
		width: 100%;
		overflow: visible;
	}
	.sparkline-svg polyline {
		vector-effect: non-scaling-stroke;
		fill: none;
	}
	.sparkline-marker,
	.sparkline-label {
		position: absolute;
		white-space: nowrap;
	}
	.sparkline-marker {
		width: 18px;
		height: 18px;
		transform: translate(-50%, -50%);
		stroke: var(--ons-color-white);
		stroke-width: 1px;
	}
	.sparkline-label {
		left: calc(100% + 10px);
		transform: translateY(-50%);
		padding: 4px 6px;
		border-radius: 4px;
		font-size: 14px;
		font-weight: bold;
		line-height: 1.2;
	}
	.no-data-message {
		display: flex;
		align-items: flex-end;
		height: 100%;
		padding-bottom: 24px;
	}
</style>
