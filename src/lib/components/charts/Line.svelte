<script lang="ts">
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { nice } from 'd3-array';
	import { area, curveLinear } from 'd3-shape';
	import { format } from 'd3-format';
	import {
		parseChartData,
		getPaletteColor,
		getMarkerKey,
		makeCurlyBrace,
		makeQuadtree
	} from './chartHelpers';
	import { marginLabels } from './labelHelpers';
	import { shortenPeriodFormatter } from '$lib/utils';
	import { markerPaths, ONScolours } from '$lib/config';
	import AreasLegend from '../modals/AreasLegend.svelte';

	let {
		data,
		metadata,
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
	let leftMargin = $state(0);
	let yTickLabelWidths = $state({});

	function updateLeftMargin(el, index) {
		yTickLabelWidths[index] = el.getBoundingClientRect().width;
		const maxWidth = Math.max(...Object.values(yTickLabelWidths));
		leftMargin = maxWidth + 12;
	}

	let rightMargin = $derived(width < widthThreshold ? 20 : 200);
	let widthInner = $derived(width - rightMargin - leftMargin);
	let suffix = $derived(metadata.suffix);
	let prefix = $derived(metadata.prefix);

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

	let quadtree = $derived(
		makeQuadtree(
			_data?.array,
			xScale ? (d) => xScale(d.date) : null,
			yScale ? (d) => yScale(d[yKey]) : null
		)
	);

	let linesCount = $derived(_data ? Object.keys(_data.keyed).length : 0);
	let lineOpacity = $derived(linesCount && linesCount < 30 ? 0.8 : linesCount < 100 ? 0.5 : 0.2);
	let lineStroke = $derived(linesCount < 30 ? '1.5px' : linesCount < 100 ? '1.25px' : '1px');
	let linesGrey = $derived(linesCount < 30 ? ONScolours.grey40 : ONScolours.grey50);

	let hovered = $derived(_data?.keyed?.[hoveredArea]);
	let hoveredCodesNames = $derived(
		hovered ? [{ areacd: hovered[0].areacd, areanm: hovered[0].areanm }] : []
	);
	let finalHoveredValue = $derived(hovered ? hovered[hovered.length - 1][yKey] : null);

	let formatPeriodShort = $derived(shortenPeriodFormatter(formatPeriod));
	// const formatYTick = format(',.0f');

	let pointsCount = $derived(_data ? new Set(_data.array.map((d) => d.period)).size : 0);
	const pointGap = 22;
	let pointSpace = $derived(width / (pointsCount - 1));

	const maxTickGap = 172; // in pixels
	let nXTicks = $derived(Math.max(2, Math.floor(width / maxTickGap)));

	// Shift ticks if necessary to ensure that they match actual values in the dataset (and de-dupe)
	function snapXTicks(ticks, _data) {
		const uniqueDates: number[] = Array.from(new Set(_data.array.map((d) => +d.date)));
		const newTicks = [];
		for (const tick of ticks) {
			if (!uniqueDates.includes(+tick)) {
				const diffs = uniqueDates.map((d) => Math.abs(+tick - d));
				const minDiff = Math.min(...diffs);
				const snappedTick = uniqueDates[diffs.indexOf(minDiff)];
				newTicks.push(snappedTick);
			} else newTicks.push(+tick);
		}
		return Array.from(new Set(newTicks)).map((d) => new Date(d));
	}

	function makeXTicks(xScale, _data) {
		if (!xScale || !_data) return [];
		const initialTicks = xScale.ticks(nXTicks);
		const tickDiff = _data.dateDomain[1] - initialTicks[initialTicks.length - 1];
		const newTicks = initialTicks.map((d) => new Date(+d + tickDiff));
		const tickGap = newTicks[1] - newTicks[0];
		const firstGap = newTicks[0] - _data.dateDomain[0];
		if (firstGap > tickGap) newTicks.unshift(new Date(newTicks[0] - tickGap));
		return snapXTicks(newTicks, _data);
	}
	let xTicks = $derived(makeXTicks(xScale, _data));

	let labelHeights: { [key: string]: number } = $state({});
	let labelLookup: any[] | null = $derived(
		marginLabels({
			selected: selectedData,
			heights: selectedData.map((d) => labelHeights[d[0][idKey]] || 10),
			yScale,
			yKey
		})
	);

	const getCIArea = area()
		.x((d) => xScale(d.date))
		.y0((d) => yScale(d.lci_95))
		.y1((d) => yScale(d.uci_95))
		.curve(curveLinear);

	$inspect({ labelLookup });
	$inspect({ data });
	$inspect({ yDomain });
</script>

{#snippet line(
	arr: any[],
	width = 1,
	color = ONScolours.grey60,
	opacity = 1,
	marker: string | null = null
)}
	{#if pointSpace > pointGap}
		<polyline
			points={arr.map((d) => [xScale(d.date), yScale(d[yKey])].join(',')).join(' ')}
			stroke={color}
			stroke-width={width}
			stroke-linecap="round"
			marker-start={marker ? `url(#${marker})` : null}
			marker-mid={marker ? `url(#${marker})` : null}
			marker-end={marker ? `url(#${marker})` : null}
			{opacity}
		/>
	{:else}
		<polyline
			points={arr.map((d) => [xScale(d.date), yScale(d[yKey])].join(',')).join(' ')}
			stroke={color}
			stroke-width={width}
			stroke-linecap="round"
			marker-start={marker ? `url(#${marker})` : null}
			marker-end={marker ? `url(#${marker})` : null}
			{opacity}
		/>
	{/if}
{/snippet}

{#snippet ribbon(arr, color = ONScolours.grey40, opacity = 0.3, id = '')}
	<path d={getCIArea(arr)} fill={color} stroke="none" {opacity} style:pointer-events="none" />
{/snippet}

{#snippet elbow(yPosOrig: number, yPosAdj: number, elbowX: number, xMax: number)}
	{#if elbowX && yPosAdj !== yPosOrig}
		<polyline
			stroke={ONScolours.grey60}
			fill="none"
			points={[
				`${xMax + 2 + 14 + pointRadius},${yPosAdj}`,
				`${elbowX},${yPosAdj}`,
				`${elbowX},${yPosOrig}`,
				`${xMax + 2 + pointRadius},${yPosOrig}`
			].join(' ')}
		>
		</polyline>
	{:else if false}
		<polyline
			stroke={ONScolours.grey60}
			fill="none"
			points={[`-14,${yPosAdj}`, `-2,${yPosOrig}`].join(' ')}
		>
		</polyline>
	{/if}
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

<p class="ons-u-vh">Line chart for {metadata.label}. The data is available to download below.</p>
<div
	bind:clientWidth={width}
	class="line-wrapper"
	style:padding-left="{leftMargin}px"
	style:padding-bottom="35px"
	style:padding-right="{rightMargin}px"
	style:padding-top={showIntervals && 'uci_95' in data ? '0px' : '20px'}
	aria-hidden="true"
>
	{#if showIntervals && 'uci_95' in data}
		<div class="legend-container">
			<svg width="300" height="60">
				<!-- <rect x="2.5" y="1" width="25" height="25" fill={ONScolours.grey35}></rect> -->
				<path d="M14 15  L46 15 L46 45  L14 35" stroke="none" fill={ONScolours.grey35}></path>
				<line x1="10" y1="22.5" x2="50" y2="28.5" stroke={ONScolours.grey100} stroke-width="3.5" />
				<circle
					cx="30"
					cy="25.5"
					r="5"
					fill={ONScolours.grey100}
					stroke={ONScolours.white}
					stroke-width="1"
				/>
				<!-- arrow ci -->
				<path
					d="
					M30,42 L30,54 L75,54
        			M30,42 L26,48
        			M30,42 L34,48
					"
					stroke={ONScolours.grey100}
					fill="none"
					stroke-width="1.2"
				>
				</path>
				<text x="80" y="54" text-anchor="start" class="legend-text">
					<tspan y="54" x="80" dy="0.35em">95% confidence interval</tspan>
				</text>
				<!-- arrow estimate -->
				<path
					d="
					M75,28.5 L54,28.5
        			M54,28.5 L60,24.5
        			M54,28.5 L60,32.5"
					stroke={ONScolours.grey100}
					stroke-width="1.2"
				></path>
				<text x="80" y="29" text-anchor="start" class="legend-text">
					<tspan y="29" x="80" dy="0.35em">Estimated value</tspan>
				</text>
			</svg>
		</div>
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
				{#key yDomain}
					{#each yScale.ticks(5) as yTick, i}
						<div class="line-y-tick" style:top="{yScale(yTick)}px"></div>
						<div use:updateLeftMargin={i} class="line-y-tick-label" style:top="{yScale(yTick)}px">
							{prefix}{formatValue(yTick)}{suffix}
						</div>
					{/each}
				{/key}
			</div>
			<div class="margin-labels" style:right="-{rightMargin}px">
				{#if width >= widthThreshold && hoveredArea}
					<div
						class="margin-label-hovered"
						aria-live="assertive"
						style:left="{xScale(_data.dateDomain[1]) + 10}px"
						style:top="{yScale(finalHoveredValue)}px"
						style:max-width="{rightMargin - dodgedLabelGap}px"
					>
						{hovered?.[0]?.areanm}
					</div>
				{/if}
				{#if width >= widthThreshold}
					<div class="margin-labels-selected" style:visibility={hoveredArea ? 'hidden' : null}>
						{#key _data}
							{#each selectedData as arr, i}
								{@const id = arr[0][idKey]}
								{@const yPos = labelLookup?.[i]?.y ?? yScale(arr[arr.length - 1][yKey])}
								{@const isLabelDodged = yPos !== yScale(arr[arr.length - 1][yKey])}
								<div
									bind:clientHeight={labelHeights[id]}
									data-id={id}
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
						{/key}
					</div>
				{/if}
			</div>
			<svg
				viewBox="0 0 {widthInner} {height}"
				class="line-chart"
				preserveAspectRatio="none"
				onmousemove={(ev) => {
					const datum = quadtree?.find?.(ev.layerX, ev.layerY);
					if (datum) hoveredArea = datum[idKey];
				}}
				onmouseout={() => (hoveredArea = null)}
				onblur={() => (hoveredArea = null)}
				role="tooltip"
			>
				<defs>
					{#each Object.entries(markerPaths) as path, i}
						<marker
							id={path[0]}
							viewBox="-4 -4 8 8"
							markerWidth="14"
							markerHeight="14"
							markerUnits="userSpaceOnUse"
							stroke={ONScolours.white}
							stroke-width="0.4"
						>
							<path d={path[1]} style:fill={getPaletteColor(i, selectedData.length)} />
						</marker>
					{/each}
				</defs>
				<g opacity={hoveredArea ? 0.2 : 1}>
					{#each Object.values(_data.keyed) as arr, i}
						{@render line(arr, lineStroke, linesGrey, lineOpacity)}
					{/each}
					{#if showIntervals && 'uci_95' in data}
						{#each selectedData as arr, i}
							{@render ribbon(arr, getPaletteColor(i, selectedData.length), 0.3, arr[0][idKey])}
						{/each}
					{/if}
					{#each [...selectedData].reverse() as arr}
						{@const selectedIndex = selected.indexOf(arr[0][idKey])}
						{@const marker = getMarkerKey(selectedIndex, selected.length)}
						{@render line(arr, 4.5, ONScolours.white, 1, marker)}
						{@render line(arr, 3, getPaletteColor(selectedIndex, selected.length), 1, marker)}
					{/each}
				</g>
				<g>
					{#if hoveredArea}
						{#if showIntervals && 'uci_95' in data}
							{@render ribbon(hovered, ONScolours.highlightOrangeDark, 0.3, hoveredArea)}
						{/if}
						{@render line(hovered, 4.5, ONScolours.white, 1)}
						{@render line(hovered, 3, ONScolours.highlightOrangeDark, 1)}
						{#if pointSpace > pointGap}
							{#each hovered as c}
								<circle
									cx={xScale(c.date)}
									cy={yScale(c[yKey])}
									r="5"
									fill={ONScolours.highlightOrangeDark}
									stroke={ONScolours.white}
								></circle>
							{/each}
						{:else}
							<circle
								cx={xScale(hovered[0].date)}
								cy={yScale(hovered[0][yKey])}
								r="5"
								fill={ONScolours.highlightOrangeDark}
								stroke={ONScolours.white}
							></circle>
							<circle
								cx={xScale(hovered[hovered.length - 1].date)}
								cy={yScale(hovered[hovered.length - 1][yKey])}
								r="5"
								fill={ONScolours.highlightOrangeDark}
								stroke={ONScolours.white}
							></circle>
						{/if}
					{/if}
				</g>
				{#if width >= widthThreshold && labelLookup?.[0] && !hovered}
					<g>
						{#each selectedData as arr, i}
							{@const yPosAdj = labelLookup?.[i]?.y || yScale(arr[arr.length - 1][yKey])}
							{@const yPosOrig = yScale(arr[arr.length - 1][yKey])}
							{@const xMax = xScale(_data.dateDomain[1])}
							{@const elbowX =
								xScale(_data.dateDomain[1]) + pointRadius + 6 + labelLookup?.[i]?.elbow}
							{@render elbow(yPosOrig, yPosAdj, elbowX, xMax)}
						{/each}
					</g>
				{/if}
			</svg>
		{/if}
	</div>
</div>

<style>
	.legend-container {
		display: flex;
		height: 20px;
		padding-bottom: 80px;
	}
	.legend-text {
		color: var(--ons-color-black);
		line-height: 16px;
		font-size: 16px;
		padding-left: 12px;
		margin: 0;
	}
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
		position: relative;
	}
	.line-chart polyline {
		vector-effect: non-scaling-stroke;
		stroke-linecap: round;
		fill: none;
		pointer-events: none;
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
		color: var(--ons-color-white);
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
		height: 8px;
		border-left: 1px solid var(--ons-color-grey-60);
	}

	.y-baseline {
		position: absolute;
		height: 100%;
		left: 0%;
		border-left: 1px solid var(--ons-color-grey-60);
	}

	.x-baseline {
		position: absolute;
		width: 100%;
		border-bottom: 2px solid var(--ons-color-grey-60);
		transform: translateY(-0.5px);
	}

	.line-y-tick {
		position: absolute;
		right: 100%;
		width: 8px;
		border-top: 1px solid var(--ons-color-grey-60);
	}

	.line-x-tick-label {
		position: absolute;
		top: calc(100% + 5px);
		transform: translateX(-50%);
		font-size: 18px;
		white-space: nowrap;
	}

	.line-y-tick-label {
		position: absolute;
		right: calc(100% + 10px);
		transform: translateY(-50%);
		font-size: 18px;
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
		font-size: 18px;
		font-weight: bold;
		text-align: left;
		line-height: 0.95;
		color: var(--ons-color-highlight-orange-dark);
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
		font-size: 18px;
		font-weight: bold;
		line-height: 0.95;
		padding-top: 4px;
		padding-bottom: 4px;
		text-align: left;
	}
</style>
