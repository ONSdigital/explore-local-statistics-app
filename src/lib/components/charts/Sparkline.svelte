<script lang="ts">
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { nice } from 'd3-array';
	import { format } from 'd3-format';
	import { parseChartData, contrastColor, getPaletteColor, getMarkerPath } from './chartHelpers';
	import { shortenPeriodFormatter } from '$lib/utils';

	let {
		data,
		xKey = 'period',
		yKey = 'value',
		idKey = 'areacd',
		labelKey = 'areanm',
		formatPeriod = (d) => d,
		formatValue = (d) => d,
		valuePrefix = null,
		valueSuffix = null,
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
					.reverse()
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
</script>

{#snippet line(arr, width = 2, color = 'grey')}
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
	<div
		class="sparkline-wrapper"
		style:padding-left="{margins.left + 10}px"
		style:padding-right="{margins.right + 10}px"
		style:padding-top="10px"
		style:padding-bottom="25px"
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
						{#each _selected || [] as d}
							{@render line(d.data, 2, getPaletteColor(d.i, _selected.length))}
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
					{@const count = _selected.length}
					{#each _selected || [] as d}
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
	<p class="ons-u-fs-s">Time series data not available.</p>
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
		border-left: 1px solid #b3b3b3;
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
		border-left: 1px solid #b3b3b3;
	}
	.sparkline-y-tick {
		position: absolute;
		right: 100%;
		width: 8px;
		border-top: 1px solid #b3b3b3;
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
		stroke: white;
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
</style>
