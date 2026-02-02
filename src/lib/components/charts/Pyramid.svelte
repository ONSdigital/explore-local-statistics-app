<script lang="ts">
	import { scaleLinear, scaleBand } from 'd3-scale';
	import { parsePyramidData } from './chartHelpers';
	import { ONSpalette } from '$lib/config';
	import { contrastColor } from './chartHelpers';

	let {
		data,
		selected = [],
		hovered = $bindable(),
		formatValue = (d) => d,
		idKey = 'areacd',
		xKey = 'value',
		yKey = 'age',
		zKey = 'sex'
	} = $props();

	const barHeight = 18;
	const barGap = 1; // gap in pixels
	const gutter = 70;
	const bottomMargin = 20;

	let _data = $derived(parsePyramidData(data, idKey));
	let mode = $derived(_data?.keysLength <= selected.length ? 'simple' : 'advanced');

	let w = $state(400);
	let hoveredPos = $state();

	let xRange = $derived([0, (w - gutter) / 2]);
	let xDomain = $derived(
		!_data?.valueDomain || _data?.valueDomain?.[1] < 5 ? [0, 5] : _data?.valueDomain
	);
	let xScale = $derived(scaleLinear().domain(xDomain).range(xRange));
	let yRange = $derived([barHeight * (_data?.categoryDomain?.length || 18), 0]);
	let yScale = $derived(
		scaleBand()
			.domain(_data?.categoryDomain || ['Female', 'Male'])
			.range(yRange)
			.paddingInner(barGap / barHeight)
	);

	function sumBySex(area, sex) {
		const areaData = _data.keyed[area] || [];
		return areaData.filter((d) => d.sex === sex).reduce((acc, d) => acc + d.value, 0);
	}

	function makeLine(dat, xScale, sex) {
		const scale =
			sex === 'female'
				? (d) => xRange[1] - xScale(d[xKey])
				: (d) => xRange[1] + gutter + xScale(d[xKey]);
		return dat
			.filter((d) => d[zKey] === _data.groupDomain[sex === 'female' ? 0 : 1])
			.flatMap((d) => [
				[scale(d), yScale(d[yKey]) + yScale.bandwidth() + barGap / 2], // bottom left
				[scale(d), yScale(d[yKey]) - barGap / 2] // top left
			])
			.map((p) => p.join(','))
			.join(' ');
	}
</script>

{#snippet bar(d)}
	{@const xPos =
		d[zKey] === _data.groupDomain[0] ? xRange[1] - xScale(d[xKey]) : xRange[1] + gutter}
	<rect
		class="chart-rect"
		x={xPos}
		y={yScale(d[yKey])}
		width={xScale(d[xKey])}
		height={yScale.bandwidth()}
		fill={ONSpalette[0]}
	/>
{/snippet}

{#snippet mark(d)}
	{@const xPos =
		d[zKey] === _data.groupDomain[0]
			? xRange[1] - xScale(d[xKey])
			: xScale(d[xKey]) + xRange[1] + gutter}
	<line
		class="chart-mark-hoverable"
		x1={xPos}
		y1={yScale(d[yKey])}
		x2={xPos}
		y2={yScale(d[yKey]) + yScale.bandwidth()}
	/>
	<line
		class="chart-mark"
		x1={xPos}
		y1={yScale(d[yKey])}
		x2={xPos}
		y2={yScale(d[yKey]) + yScale.bandwidth()}
	/>
{/snippet}

{#snippet polyline(points, color = 'grey', width = 2)}
	<polyline class="chart-polyline" stroke="white" stroke-width={width + 2} {points} />
	<polyline class="chart-polyline" stroke={color} stroke-width={width} {points} />
{/snippet}

{#snippet tick(t, sex)}
	{@const xPos = sex === 'female' ? xRange[1] - xScale(t) : xScale(t) + xRange[1] + gutter}
	<line x1={xPos} y1={yRange[0]} x2={xPos} y2={yRange[0] + 8} />
	<text x={xPos} y={yRange[0] + 22} text-anchor="middle" font-size="14">
		{t}%
	</text>
{/snippet}

<div class="chart-container" bind:clientWidth={w}>
	<svg class="chart" viewBox="0 0 {w} {yRange[0] + bottomMargin}">
		{#if _data}
			<g class="chart-y-axis">
				{#each _data.categoryDomain as yTick}
					<text class="chart-y-tick" x={w / 2} y={yScale(yTick) + yScale.bandwidth() / 2} dy={2}>
						{yTick}
					</text>
				{/each}
				<line
					class="chart-baseline"
					x1={xScale(0) + xRange[1] + gutter}
					y1={0}
					x2={xScale(0) + xRange[1] + gutter}
					y2={yRange[0]}
				/>
				<line
					class="chart-baseline"
					x1={xScale(0) + xRange[1]}
					y1={0}
					x2={xScale(0) + xRange[1]}
					y2={yRange[0]}
				/>
			</g>
			<g class="chart-x-axis">
				{#each xScale.ticks(3) as t}
					{@render tick(t, 'female')}
					{@render tick(t, 'male')}
				{/each}
			</g>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			{#if mode === 'simple'}
				<g class="chart-marks">
					{#each _data.keyed[selected[0]] as d}
						{@render bar(d)}
					{/each}
				</g>
			{:else}
				<g
					class="chart-marks"
					onmouseleave={() => {
						hovered = null;
						hoveredPos = null;
					}}
				>
					{#each Object.entries(_data.keyed) as areaData (areaData[0])}
						<g
							onmouseenter={(e) => {
								hovered = areaData[0];
								hoveredPos = { x: e.offsetX, y: e.offsetY };
							}}
						>
							{#each areaData[1] as d}
								{@render mark(d)}
							{/each}
						</g>
					{/each}
				</g>
			{/if}

			{#if selected.length}
				{@const maxIndex = selected.length - 1}
				<g class="chart-selected">
					{#each [...selected].reverse() as area, i}
						{#if _data?.keyed?.[area]}
							{@render polyline(
								makeLine(_data.keyed[area], xScale, 'female'),
								ONSpalette[maxIndex - i],
								i === maxIndex ? 3 : 2
							)}
							{@render polyline(
								makeLine(_data.keyed[area], xScale, 'male'),
								ONSpalette[maxIndex - i],
								i === maxIndex ? 3 : 2
							)}
						{/if}
					{/each}
				</g>
			{/if}
			{#if _data?.keyed?.[hovered]}
				<g class="chart-hovered">
					{@render polyline(makeLine(_data.keyed[hovered], xScale, 'female'), 'orange', 3)}
					{@render polyline(makeLine(_data.keyed[hovered], xScale, 'male'), 'orange', 3)}
				</g>
			{/if}
		{/if}
	</svg>
	<div class="chart-annotations">
		{#each _data?.groupDomain || [] as group, i}
			<div
				class="chart-legend"
				style:text-align={i === 0 ? 'left' : 'right'}
				style:left={i === 0 ? 0 : null}
				style:right={i === 1 ? 0 : null}
			>
				<span>{group}</span>
				{#if hovered || selected.length}
					{@const color = hovered ? 'orange' : ONSpalette[0]}
					{@const sum = sumBySex(hovered || selected[0], group)}
					{#if sum}
						<br /><span
							class="chart-label"
							style:background={color}
							style:color={contrastColor(color)}>{formatValue(sum)}%</span
						>
					{/if}
				{/if}
			</div>
		{/each}
		{#if hovered && hoveredPos}
			<div
				class="chart-label chart-area-label"
				style:left="{hoveredPos.x}px"
				style:top="{hoveredPos.y}px"
				style:transform="translate({hoveredPos.x < w / 2 ? -100 : 0}%,-100%)"
			>
				{_data?.keyed?.[hovered]?.[0]?.areanm}
			</div>
		{/if}
	</div>
</div>

<style>
	.chart-container {
		display: block;
		position: relative;
		width: 100%;
		margin: 0.75rem 0;
	}
	.chart {
		overflow: visible;
	}
	.chart-annotations {
		position: absolute;
		top: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.chart-legend {
		position: absolute;
		top: 0;
		margin-top: -8px;
	}
	.chart-label {
		display: block;
		font-weight: bold;
		padding: 4px 6px;
		border-radius: 4px;
		font-weight: bold;
		line-height: 1.2;
	}
	.chart-area-label {
		position: absolute;
		background-color: orange;
	}
	.chart-baseline {
		stroke: #b3b3b3;
		stroke-width: 1.5px;
	}
	.chart-rect {
		stroke: none;
		opacity: 0.3;
	}
	.chart-mark {
		stroke: lightgrey;
		stroke-width: 1px;
	}
	.chart-mark-hoverable {
		stroke: rgba(255, 255, 255, 0);
		stroke-width: 6px;
	}
	.chart-y-tick {
		text-anchor: middle;
		alignment-baseline: middle;
		font-size: 14px;
	}

	.chart-hovered,
	.chart-selected,
	.chart-area-label {
		pointer-events: none;
	}

	.chart-polyline {
		fill: none;
	}

	.chart-x-axis text {
		fill: #333;
		font-family: 'Open Sans';
	}
	.chart-x-axis line {
		stroke: #999;
	}
</style>
