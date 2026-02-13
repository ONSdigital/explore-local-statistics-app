<script lang="ts">
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { nice } from 'd3-array';
	import { area, curveLinear } from 'd3-shape';
	import { format } from 'd3-format';
	import { parseChartData, getPaletteColor, getMarkerPath, makeCurlyBrace } from './chartHelpers';
	import { marginLabels } from './labelHelpers';
	import { shortenPeriodFormatter } from '$lib/utils';
	import { markerPaths, ONScolours } from '$lib/config';
	import AreasLegend from '../modals/AreasLegend.svelte';

	let {
		data,
		xKey = 'period',
		yKey = 'value',
		idKey = 'areacd',
		labelKey = 'areanm',
		formatValue = (d) => d,
		formatPeriod = (d) => d,
		selected = [],
		hoveredArea = null,
		geoLevel,
		showIntervals,
		mode = 'default'
	} = $props();

	const height = 500;
	const widthThreshold = 550;
	const pointRadius = 5;
	const dodgedLabelGap = 26;

	let width = $state(680);
	let leftMargin = $state(40);
	function updateLeftMargin(el) {
		const width = el.getBoundingClientRect().width;
		if (width > leftMargin) leftMargin = width + 15;
	}
	let rightMargin = $derived(width < widthThreshold ? 20 : 180);
	let widthInner = $derived(width - rightMargin - leftMargin);

	let _data = $derived(parseChartData(data, yKey, xKey, idKey));
	let selectedData = $derived(_data ? selected.map((cd) => _data.keyed[cd]).filter((d) => d) : []);
	let selectedCodesNames = $derived(
		selectedData.map((d) => {
			return { areacd: d[0].areacd, areanm: d[0].areanm };
		})
	);

	let xScale = $derived(_data ? scaleTime().domain(_data.dateDomain).range([0, widthInner]) : null);

	let yDomain = $derived(_data ? nice(..._data.valueDomain, 5) : null);
	let yScale = $derived(yDomain ? scaleLinear().domain(yDomain).range([height, 0]) : null);

	let linesCount = $derived(_data ? Object.keys(_data.keyed).length : null);
	let lineOpacity = $derived(linesCount && linesCount < 30 ? 0.5 : linesCount < 100 ? 0.35 : 0.2);
	let lineStroke = $derived(linesCount < 30 ? '2px' : linesCount < 100 ? '1.75px' : '1.5px');

	let hovered = $derived(_data?.keyed?.[hoveredArea]);
	let hoveredCodesNames = $derived(
		hovered ? [{ areacd: hovered[0].areacd, areanm: hovered[0].areanm }] : []
	);
	let finalHoveredValue = $derived(hovered ? hovered[hovered.length - 1][yKey] : null);

	let formatPeriodShort = $derived(shortenPeriodFormatter(formatPeriod));
	const formatYTick = format(',.0f');
	// function updateLeftMargin(el) {
	//   const width = el.getBoundingClientRect().width;
	//   if (width > leftMargin) leftMargin = width;
	// }

	const maxTickGap = 100; // in pixels
	let nXTicks = $derived(Math.floor(width / maxTickGap));

	function makeXTicks(xScale, _data) {
		if (!xScale || !_data) return [];
		const initialTicks = xScale.ticks(nXTicks);
		const tickDiff = _data.dateDomain[1] - initialTicks[initialTicks.length - 1];
		// fix gap appearing on left hand side
		// STILL TO FIX - LEAP YEARS ISSUE
		const newTicks = initialTicks.map((d) => new Date(+d + tickDiff));
		const tickGap = newTicks[1] - newTicks[0];
		const firstGap = newTicks[0] - _data.dateDomain[0];
		if (firstGap > tickGap) newTicks.unshift(new Date(newTicks[0] - tickGap));
		return newTicks;
	}
	let xTicks = $derived(makeXTicks(xScale, _data));

	let labelLookup: any[] | null = $state.raw(null);
	async function makeLabelLookup(el: HTMLElement, params: { [key: string]: any }) {
		const parent = el.parentNode;
		const siblings = parent?.getElementsByTagName?.('div');
		if (siblings?.length === params.selected?.length) {
			console.log('updating line chart label lookup');
			labelLookup = marginLabels(parent, params);
		}
	}
	const yScaleVar = (d) => yScale(d);

	const getCIArea = area()
		.x((d) => xScale(d.date))
		.y0((d) => yScale(d.lci_95))
		.y1((d) => yScale(d.uci_95))
		.curve(curveLinear);

	$inspect({ labelLookup });
	$inspect({ _data });
	$inspect({ yDomain });
</script>

{#snippet line(
	arr,
	width = 1,
	color = ONScolours.grey40,
	opacity = 1,
	id = '',
	hoverableBuffer = false,
	marker = null
)}
	<polyline
		points={arr.map((d) => [xScale(d.date), yScale(d[yKey])].join(',')).join(' ')}
		stroke={color}
		stroke-width={width}
		{opacity}
		marker-start="url(#{marker})"
		marker-mid="url(#{marker})"
		marker-end="url(#{marker})"
		onpointerenter={() => hoverableBuffer && (hoveredArea = id)}
		onpointerleave={() => hoverableBuffer && (hoveredArea = null)}
		style:pointer-events={color === ONScolours.grey40 ? null : 'none'}
	/>
{/snippet}

{#snippet ribbon(arr, color = ONScolours.grey40, opacity = 0.3, id = '')}
	<path
		d={getCIArea(arr)}
		fill={color}
		stroke="none"
		{opacity}
		onpointerenter={() => {
			hoveredArea = id;
		}}
		onpointerleave={() => {
			hoveredArea = null;
		}}
		style:pointer-events={color === ONScolours.grey40 ? null : 'none'}
	/>
{/snippet}

{#if width < widthThreshold && mode == 'embed'}
	<ul class="top-labels">
		{#if selectedData.length && !hoveredArea}
			<AreasLegend selectedAreas={selectedCodesNames} useMarkerShapes={true} inlineItems={true}
			></AreasLegend>
		{/if}

		{#if hoveredArea}
			<AreasLegend
				selectedAreas={hoveredCodesNames}
				useMarkerShapes={true}
				inlineItems={true}
				hovered={true}
			></AreasLegend>
			<!-- <li class="top-label-hovered" style="background:#f39431">
				{hovered?.[0]?.areanm}
			</li> -->
		{/if}
	</ul>
{/if}

<div
	bind:clientWidth={width}
	class="line-wrapper"
	style:padding-left="{leftMargin}px"
	style:padding-bottom="25px"
	style:padding-right="{rightMargin}px"
>
	{#if showIntervals}
		<svg aria-hidden="true" width="350" height="50" class="bar-chart-legend">
			<path d="M10 15  L50 15 L50 45  L10 35" stroke="none" fill="#222" opacity="0.2"></path>
			<path d="M10 25  L50 30" stroke="#222" fill="none" stroke-width="2px"></path>
			<circle cx="10" cy="25" r="4" stroke="white" fill="#222" stroke-width="1px"></circle>
			<circle cx="50" cy="30" r="4" stroke="white" fill="#222" stroke-width="1px"></circle>
			<text x="70" y="35" font-size="18px" stroke="#222" fill="#222" stroke-width="0px"
				>95% confidence interval range</text
			>
			<path
				d={makeCurlyBrace(55, 15, 55, 45, -10, 0.5)}
				stroke="#222"
				fill="none"
				stroke-width="1px"
			></path>
		</svg>
	{/if}
	<div class="line-inner">
		{#if _data && xScale && yScale}
			<div class="line-x-axis">
				{#if yDomain?.[0] <= 0 && yDomain?.[1] >= 0}
					<div class="x-baseline" style:top="{yScale(0)}px"></div>
				{/if}
				{#each xTicks as xTick}
					<div class="line-x-tick" style:left="{xScale(xTick)}px"></div>
					<div class="line-x-tick-label" style:left="{xScale(xTick)}px">
						{formatPeriodShort(xTick)}
					</div>
				{/each}
			</div>
			<div class="line-y-axis">
				<div class="y-baseline"></div>
				{#each yScale.ticks(5) as yTick, i}
					<div class="line-y-tick" style:top="{yScale(yTick)}px"></div>
					<div use:updateLeftMargin class="line-y-tick-label" style:top="{yScale(yTick)}px">
						{formatYTick(yTick)}
					</div>
				{/each}
			</div>
			<div class="margin-labels" style:right="-{rightMargin}px">
				{#if width >= widthThreshold && hoveredArea}
					<div
						class="margin-label-hovered"
						style:color={ONScolours.highlightOrangeDark}
						style:left="{xScale(_data.dateDomain[1]) + 10}px"
						style:top="{yScale(finalHoveredValue)}px"
						style:max-width="{rightMargin - dodgedLabelGap}px"
					>
						{hovered?.[0]?.areanm}
					</div>
				{/if}
				{#key _data}
					<div class="margin-labels-selected" style:visibility={hoveredArea ? 'hidden' : null}>
						{#if width >= widthThreshold}
							{console.log({ labelLookup })}
							{#each selectedData as arr, i}
								{@const yPos = labelLookup?.[i]?.y ?? yScale(arr[arr.length - 1][yKey])}
								{@const isLabelDodged = yPos !== yScale(arr[arr.length - 1][yKey])}
								<div
									use:makeLabelLookup={{ selected: selectedData, yScaleVar, yKey }}
									class="margin-label-selected"
									style:left="{isLabelDodged
										? xScale(_data.dateDomain[1]) + dodgedLabelGap
										: xScale(_data.dateDomain[1]) + dodgedLabelGap / 2}px"
									style:top="{yPos}px"
									style:color={getPaletteColor(i, selectedData.length, 'text')}
									style:max-width="{rightMargin - dodgedLabelGap}px"
								>
									{arr?.[0][labelKey]}
								</div>
							{/each}
						{/if}
					</div>
				{/key}
			</div>
			<svg viewBox="0 0 {widthInner} {height}" class="line-chart" preserveAspectRatio="none">
				<defs>
					{#each Object.entries(markerPaths) as path, i}
						<marker
							id={path[0]}
							viewBox="-4 -4 8 8"
							markerWidth="14"
							markerHeight="14"
							markerUnits="userSpaceOnUse"
							stroke="white"
							stroke-width="0.4"
						>
							<path d={path[1]} style:fill={getPaletteColor(i, selectedData.length)} />
						</marker>
					{/each}
				</defs>
				<g opacity={hoveredArea ? 0.2 : 1}>
					{#each Object.values(_data.keyed) as arr, i}
						{@render line(arr, lineStroke, ONScolours.grey40, lineOpacity, arr[0][idKey], false)}
						{@render line(arr, 30, ONScolours.grey40, 0, arr[0][idKey], true)}
					{/each}
					{#if showIntervals}
						{#each selectedData as arr, i}
							{@render ribbon(arr, getPaletteColor(i, selectedData.length), 0.3, arr[0][idKey])}
						{/each}
					{/if}
					{#each selectedData as arr}
						{@const selectedIndex = selected.indexOf(arr[0][idKey])}
						{@const marker = Object.keys(markerPaths).find(
							(key) => markerPaths[key] === getMarkerPath(selectedIndex, selectedData.length)
						)}
						{@render line(arr, 4.5, 'white', 1, arr[0][idKey], false, marker)}
						{@render line(
							arr,
							3,
							getPaletteColor(selectedIndex, selectedData.length),
							1,
							arr[0][idKey],
							false,
							marker
						)}
					{/each}
					<!-- {#each selectedData as s, sIndex}
						{#each s as c}
							<circle
								cx={xScale(c.date)}
								cy={yScale(c[yKey])}
								r={pointRadius}
								fill={ONSpalette[sIndex]}
								stroke="white"
							></circle>
						{/each}
					{/each} -->
				</g>
				<g>
					{#if hoveredArea}
						{#if showIntervals}
							{@render ribbon(hovered, ONScolours.highlightOrangeDark, 0.3, hoveredArea)}
						{/if}
						{@render line(hovered, 4.5, ONScolours.white, 1, hoveredArea)}
						{@render line(hovered, 3, ONScolours.highlightOrangeDark, 1, hoveredArea)}
						{#each hovered as c}
							<circle
								cx={xScale(c.date)}
								cy={yScale(c[yKey])}
								r="5"
								fill={ONScolours.highlightOrangeDark}
								stroke={ONScolours.white}
							></circle>
						{/each}
					{/if}
				</g>
				{#if width >= widthThreshold && labelLookup?.[0] && !hovered}
					<g>
						{#each selectedData as arr, i}
							{@const yPosAdj = labelLookup?.[i]?.y}
							{@const yPosOrig = yScale(arr[arr.length - 1][yKey])}
							{@const elbowX =
								xScale(_data.dateDomain[1]) + pointRadius + 6 + labelLookup?.[i]?.elbow}
							<!-- {@const labelHeight = labelHeights?.[i]} -->
							{#if Math.abs(yPosAdj - yPosOrig) > 0.7}
								<polyline
									stroke={ONScolours.grey60}
									fill="none"
									points="
                {xScale(_data.dateDomain[1]) + 2 + 14 + pointRadius},{yPosAdj}
                {elbowX},{yPosAdj}
                {elbowX},{yPosOrig} 
                {xScale(_data.dateDomain[1]) + 2 + pointRadius},{yPosOrig}"
								>
								</polyline>
							{:else if Math.abs(yPosAdj - yPosOrig) > 0}
								<polyline
									stroke={ONScolours.grey60}
									fill="none"
									points="-14,{yPosAdj}
                -2,{yPosOrig}"
								>
								</polyline>
							{:else}{/if}
						{/each}
					</g>
				{/if}
			</svg>
		{/if}
	</div>
</div>

<style>
	.line-wrapper {
		display: block;
		position: relative;
		overflow: visible;
	}
	.line-inner {
		display: block;
		position: relative;
	}
	.line-chart {
		width: 100%;
		overflow: visible;
		display: block;
	}
	.line-chart polyline,
	.line-chart line {
		vector-effect: non-scaling-stroke;
		fill: none;
	}

	.line-chart circle {
		vector-effect: non-scaling-stroke;
		vector-effect: non-scaling-size;
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
		top: 100%;
		height: 10px;
		border-left: 1px solid grey;
	}

	.y-baseline {
		position: absolute;
		height: 100%;
		left: 0%;
		border-left: 1px solid grey;
	}

	.x-baseline {
		position: absolute;
		width: 100%;
		border-bottom: 2px solid grey;
		transform: translateY(-1px);
	}

	.line-y-tick {
		position: absolute;
		right: 100%;
		width: 8px;
		border-top: 1px solid grey;
	}

	.line-x-tick-label {
		position: absolute;
		top: calc(100% + 10px);
		transform: translateX(-50%);
		font-size: 14px;
		white-space: nowrap;
	}

	.line-y-tick-label {
		position: absolute;
		right: calc(100% + 10px);
		transform: translateY(-50%);
		font-size: 14px;
		white-space: nowrap;
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
		text-align: left;
		line-height: 1.1;
	}
	.margin-labels-selected {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
	}

	.margin-label-selected {
		position: absolute;
		transform: translateY(-50%);
		font-size: 16px;
		font-weight: bold;
		line-height: 0.95;
		padding-top: 4px;
		padding-bottom: 4px;
		text-align: left;
	}
</style>
