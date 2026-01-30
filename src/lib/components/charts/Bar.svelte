<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { parseChartData, contrastColor, makeCurlyBrace } from './chartHelpers';
	import { marginLabels } from './labelHelpers';
	import { ONSpalette, ONStextPalette, ONScolours } from '$lib/config';
	import { pluralise } from '@onsvisual/robo-utils';

	let {
		data,
		xKey = 'period',
		yKey = 'value',
		idKey = 'areacd',
		labelKey = 'areanm',
		formatValue = (d) => d,
		formatPeriod = (d) => d,
		confidenceIntervals,
		selected = [],
		hoveredArea = null,
		geoLevel
	} = $props();

	let width = $state();
	const widthThreshold = 550;
	let leftMargin = $derived(width < widthThreshold ? 20 : 150);
	const rightMargin = 30;
	let widthInner = $derived(width - rightMargin - leftMargin);

	let _data = $derived(parseChartData(data, yKey, xKey, idKey));
	let sorted = $derived(_data ? [..._data.array].sort((a, b) => b[yKey] - a[yKey]) : []);
	let hovered = $derived(_data.keyed[hoveredArea]?.[0]);
	let _selected = $derived(_data ? selected.map((cd) => _data.keyed[cd]).filter((d) => d) : []);

	const maxHeight = 500;
	const maxBarHeight = 30;
	const barGapRatio = 0.5; // Proportion of bar height
	const minSelectedBarHeight = 10; // Number of pixels
	const maxUnscaledBarsCount = Math.floor(500 / (maxBarHeight * (1 + barGapRatio)));

	let height = $derived(
		!_data || _data.array.length > maxUnscaledBarsCount
			? maxHeight
			: _data.array.length * maxBarHeight + (_data.array.length + 1) * (maxBarHeight * barGapRatio)
	);

	function makeYScale(data, selected) {
		// Assumes "data" is pre-sorted from large to small
		const lookup = {};
		const count = data.length;
		const areaCodes = data.map((d) => d[idKey]);
		const selectedCount = selected.filter((cd) => areaCodes.includes(cd)).length;
		const unselectedCount = count - selectedCount;

		const rawBarHeight =
			count > maxUnscaledBarsCount ? maxHeight / (count + (count + 1) * barGapRatio) : maxBarHeight;
		const selectedBarsScaled = selectedCount > 0 && rawBarHeight < minSelectedBarHeight;
		const barHeight = selectedBarsScaled
			? (maxHeight - selectedCount * minSelectedBarHeight) /
				(unselectedCount + (count + 1) * barGapRatio)
			: rawBarHeight;
		// const barGap = count < 100 ? barHeight * barGapRatio : 0;
		const barGap = barHeight * barGapRatio;

		let y = 0;
		for (const d of data) {
			y += barGap;
			const height =
				selectedBarsScaled && selected.includes(d[idKey]) ? minSelectedBarHeight : barHeight;
			lookup[d[idKey]] = { y, height };
			y += height;
		}

		return (id) => lookup[id];
	}

	function setBarColour(id) {
		const index = selected.indexOf(id);
		if (index === -1) {
			return ONScolours.grey40;
		}

		return ONSpalette[index % ONSpalette.length];
	}

	let yScale = $derived(sorted ? makeYScale(sorted, selected) : null);

	let labelLookup = $state();
	async function makeLabelLookup(el, params) {
		labelLookup = await marginLabels(el, params);
	}

	const yScaleVar = (d) => yScale(d).y;

	let xScale = $derived(
		_data
			? confidenceIntervals
				? scaleLinear()
						.domain([
							Math.min(0, Math.min(...data.lci.filter((el) => el !== null && el !== undefined))),
							Math.max(...data.uci.filter((el) => el !== null && el !== undefined))
						])
						.range([0, widthInner])
				: scaleLinear()
						.domain([Math.min(0, _data.valueDomain[0]), _data.valueDomain[1]])
						.range([0, widthInner])
			: null
	);

	let hoveredIndex = $derived(hoveredArea ? sorted.findIndex((d) => d[idKey] === hoveredArea) : -1);

	$inspect({ labelLookup });
</script>

{#snippet bar(b, fill = ONScolours.grey40, opacity = 1, id = '', i)}
	<rect
		class="chart-bars"
		x={0}
		y={yScale(b[idKey]).y}
		width={xScale(b[yKey])}
		height={yScale(b[idKey]).height}
		{fill}
		{opacity}
		on:pointerenter={() => {
			hoveredArea = id;
		}}
		on:pointerleave={() => {
			hoveredArea = null;
		}}
		style:pointer-events={fill === ONScolours.grey40 ? null : 'none'}
	/>
{/snippet}

{#snippet estimate(b, fill = ONScolours.grey40, width = 2, opacity = 1, id = '', i)}
	<rect
		class="chart-estimate"
		x={xScale(b[yKey]) - width / 2}
		y={yScale(b[idKey]).y}
		{width}
		height={yScale(b[idKey]).height}
		{fill}
		stroke="white"
		stroke-width="0.5"
		{opacity}
		on:pointerenter={() => {
			hoveredArea = id;
		}}
		on:pointerleave={() => {
			hoveredArea = null;
		}}
		style:pointer-events={fill === ONScolours.grey40 ? null : 'none'}
	/>
{/snippet}

{#snippet confidence(b, fill = ONScolours.grey40, opacity = 1, id = '', i)}
	<rect
		class="chart-estimate"
		x={xScale(b.lci)}
		y={yScale(b[idKey]).y}
		width={xScale(b.uci) - xScale(b.lci)}
		height={yScale(b[idKey]).height}
		{fill}
		stroke-width="0.2"
		{opacity}
		on:pointerenter={() => {
			hoveredArea = id;
		}}
		on:pointerleave={() => {
			hoveredArea = null;
		}}
		style:pointer-events={fill === ONScolours.grey40 ? null : 'none'}
	/>
{/snippet}

{#if width < widthThreshold}
	<ul class="top-labels">
		<!-- {#if !hoveredArea}
      <li class="top-label-geo" style="background:{'grey'}">
        {pluralise(geoLevel.label)}
      </li>
    {/if} -->

		{#if _selected.length && !hoveredArea}
			{#each _selected as a, i}
				<li class="top-label-selected" style="background:{ONSpalette[i]}">
					{a?.[0]?.areanm}
				</li>
			{/each}
		{/if}

		{#if hoveredArea}
			<li class="top-label-hovered" style="background:#f39431">
				{hovered?.areanm}
			</li>
		{/if}
	</ul>
{/if}

<div
	bind:clientWidth={width}
	class="bar-wrapper"
	style:padding-right="{rightMargin}px"
	style:padding-top="36px"
	style:padding-bottom="25px"
	style:padding-left="{leftMargin}px"
>
	{#if confidenceIntervals}
		<div class="legend-container">
			<svg aria-hidden="true" {width} height="90" class="bar-chart-legend">
				<line x1="10" y1="15" x2="170" y2="15" stroke="#222" opacity="0.2" stroke-width="20px"
				></line>
				<!-- <rect x="8" width="4" y="7" height="16" fill="#222" stroke="white" stroke-width="1px"></rect> -->
				<!-- <rect x="168" width="4" y="7" height="16" fill="#222" stroke="white" stroke-width="1px"></rect> -->
				<rect x="87" width="6" y="3" height="24" fill="#222" stroke="white" stroke-width="1.5px"
				></rect>

				<path
					d={makeCurlyBrace(10, 30, 170, 30, 10, 0.5)}
					stroke="#222"
					fill="none"
					stroke-width="1.5px"
				></path>

				<text
					x="90"
					y="60"
					font-size="18px"
					stroke="#222"
					fill="#222"
					stroke-width="0px"
					text-anchor="middle">95% confidence</text
				>
				<text
					x="90"
					y="80"
					font-size="18px"
					stroke="#222"
					fill="#222"
					stroke-width="0px"
					text-anchor="middle">interval range</text
				>
			</svg>
		</div>
	{/if}
	<div class="bar-inner">
		<div class="line-y-axis">
			<div class="y-baseline"></div>
		</div>
		<div class="line-x-axis">
			<div class="x-baseline" style:top="0"></div>
			{#each xScale.ticks(5) as xTick}
				<div class="line-x-tick" style:left="{xScale(xTick)}px"></div>
				<div class="line-x-tick-label" style:left="{xScale(xTick)}px">
					{formatValue(xTick)}
				</div>
			{/each}
		</div>
		<div class="margin-labels">
			{#if width >= widthThreshold && hoveredArea}
				<div
					class="margin-label-hovered"
					style="top: {yScale(hovered[idKey]).y +
						yScale(hovered[idKey]).height / 2}px; color: {ONScolours.highlightOrange}"
				>
					{hovered?.[labelKey]}
				</div>
			{/if}
			<!-- {#if width >= widthThreshold}
        <div class="margin-label-geo" style="top: {yScale(sorted[0][idKey]).y + yScale(sorted[0][idKey]).height / 2}px;">
          {pluralise(geoLevel.label)}
        </div>
      {/if} -->
			{#if width >= widthThreshold && sorted.length <= maxUnscaledBarsCount && !hovered}
				{#each sorted as s}
					<div
						class="margin-label-geo-all"
						style="top:{yScale(s[idKey]).y + yScale(s[idKey]).height / 2}px;"
					>
						{s[labelKey]}
					</div>
				{/each}
			{/if}
			<div
				class="margin-labels-selected"
				use:makeLabelLookup={{ selected: _selected, yScaleVar, yKey: idKey }}
			>
				{#if width >= widthThreshold && !hoveredArea}
					{#each _selected as a, i (a[0][idKey])}
						{@const yPos = labelLookup?.[i]?.y || yScale?.(a[0][idKey])?.y}
						{@const height = yScale?.(a[0][idKey])?.height}
						{@const isLabelDodged = labelLookup?.[i]?.y !== yScale?.(a[0][idKey])?.y}
						<div
							class="margin-label-selected"
							style="top: {yPos ? yPos + height / 2 : 0}px;right:{isLabelDodged
								? 'calc(100% + 16px)'
								: 'calc(100% + 8px)'};color:{ONStextPalette[i]}"
						>
							{a[0][labelKey]}
						</div>
					{/each}
				{/if}
			</div>
		</div>
		<svg
			viewBox="0 0 {widthInner} {height}"
			class="bar-chart"
			preserveAspectRatio="none"
			style:height="{height}px"
		>
			{#if _data && xScale && yScale}
				<g opacity={hoveredArea ? 0.5 : 1}>
					{#each sorted as b, i (b[idKey])}
						{#if !confidenceIntervals}
							{@render bar(b, setBarColour(b[idKey]), 1, b[idKey], i)}
						{:else}
							{@render bar(b, setBarColour(b[idKey]), 0.3, b[idKey], i)}
							{@render confidence(b, ONScolours.white, 1, b[idKey], i)}
							{@render confidence(b, setBarColour(b[idKey]), 0.6, b[idKey], i)}
							{@render estimate(b, setBarColour(b[idKey]), 3, 1, b[idKey], i)}
						{/if}
					{/each}
				</g>
				<g>
					{#if hoveredArea && hoveredIndex !== -1}
						{#if !confidenceIntervals}
							{@render bar(hovered, ONScolours.highlightOrangeDark, 1, hoveredArea, hoveredIndex)}
						{:else}
							{@render bar(hovered, ONScolours.highlightOrangeDark, 0.2, hoveredArea, hoveredIndex)}
							{@render confidence(hovered, ONScolours.white, 1, hoveredArea, hoveredIndex)}
							{@render confidence(
								hovered,
								ONScolours.highlightOrangeDark,
								0.6,
								hoveredArea,
								hoveredIndex
							)}
							{@render estimate(
								hovered,
								ONScolours.highlightOrangeDark,
								3,
								1,
								hoveredArea,
								hoveredIndex
							)}
						{/if}
					{/if}
				</g>
			{/if}
			{#if labelLookup?.[0] && !hovered}
				<g>
					{#each _selected as a, i (a[0][idKey])}
						{@const yPosAdj = labelLookup?.[i]?.y}
						{@const yPosOrig = yScale(a[0][idKey]).y}
						{@const height = yScale(a[0][idKey]).height}
						{@const elbowX = xScale(0) - 6 - labelLookup?.[i]?.elbow}
						{#if Math.abs(yPosAdj - yPosOrig) > 0.75}
							<polyline
								stroke={ONScolours.grey60}
								fill="none"
								points="-14,{yPosAdj + height / 2}
                {elbowX},{yPosAdj + height / 2}
                {elbowX},{yPosOrig + height / 2} 
                -2,{yPosOrig + height / 2}"
							>
							</polyline>
						{:else if Math.abs(yPosAdj - yPosOrig) > 0}
							<polyline
								stroke={ONScolours.grey60}
								fill="none"
								points="-14,{yPosOrig + height / 2}
                -2,{yPosOrig + height / 2}"
							>
							</polyline>
						{:else}{/if}
					{/each}
				</g>
			{/if}
		</svg>
	</div>
</div>

<style>
	.legend-container {
		position: relative;
		height: 100px;
	}

	.bar-chart-legend {
		forced-color-adjust: auto;
		position: absolute;
		top: -40px;
		left: -20px;
	}

	.bar-wrapper {
		display: block;
		position: relative;
	}
	.bar-inner {
		display: block;
		position: relative;
	}
	.bar-chart {
		width: 100%;
		overflow: visible;
		display: block;
	}

	.y-baseline {
		position: absolute;
		height: 100%;
		left: 0%;
		border-left: 1px solid grey;
	}

	.line-x-axis,
	.line-y-axis {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		pointer-events: none;
	}

	.line-x-tick {
		position: absolute;
		width: 1px;
		bottom: 100%;
		height: 10px;
		border-left: 1px solid grey;
	}

	.line-x-tick-label {
		position: absolute;
		bottom: calc(100% + 14px);
		transform: translateX(-50%);
		font-size: 14px;
		white-space: nowrap;
		line-height: 1;
	}

	.x-baseline {
		position: absolute;
		width: 100%;
		border-bottom: 2px solid grey;
		transform: translateY(-1px);
	}

	.top-labels {
		list-style: none;
		padding: 0;
		margin: 0 0 20px 0;
		min-height: 40px;
		color: white;
		font-size: 18px;
		font-weight: bold;
	}
	.top-label-selected,
	.top-label-geo,
	.top-label-hovered {
		display: inline-block;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		margin: 0.2rem;
	}

	.margin-labels {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
	}

	.margin-label-hovered {
		position: absolute;
		transform: translateY(-50%);
		font-size: 16px;
		font-weight: bold;
		max-width: 140px;
		text-align: right;
		line-height: 1.1;
		right: calc(100% + 8px);
	}

	.margin-label-selected {
		position: absolute;
		transform: translateY(-50%);
		font-size: 16px;
		font-weight: bold;
		max-width: 140px;
		text-align: right;
		line-height: 0.95;
		padding-top: 4px;
		padding-bottom: 4px;
	}

	.margin-label-geo,
	.margin-label-geo-all {
		position: absolute;
		transform: translateY(-50%);
		font-size: 16px;
		font-weight: bold;
		color: grey;
		max-width: 140px;
		text-align: right;
		line-height: 1.1;
		right: calc(100% + 8px);
	}
</style>
