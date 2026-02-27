<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { parseChartData, makeCurlyBrace, getPaletteColor } from './chartHelpers';
	import { marginLabels } from './labelHelpers';
	import { ONScolours } from '$lib/config';
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
		showIntervals,
		selected = [],
		hoveredArea = null,
		geoLevel,
		mode = 'default'
	} = $props();

	let width = $state();
	const widthThreshold = 550;
	let leftMargin = $derived(width < widthThreshold ? 20 : 250);
	const rightMargin = 30;
	let widthInner = $derived(width - rightMargin - leftMargin);

	let _data = $derived(parseChartData(data, yKey, xKey, idKey, true));
	let hovered = $derived(_data.keyed[hoveredArea]?.[0]);
	let hoveredCodesNames = $derived(
		hovered ? [{ areacd: hovered.areacd, areanm: hovered.areanm }] : []
	);
	let suffix = $derived(metadata.suffix);
	let prefix = $derived(metadata.prefix);

	let selectedData = $derived(_data ? selected.map((cd) => _data.keyed[cd]).filter((d) => d) : []);
	let selectedCodesNames = $derived(
		selectedData.map((d) => {
			return { areacd: d[0].areacd, areanm: d[0].areanm };
		})
	);

	const maxHeight = 500;
	const maxBarHeight = 25;
	// const barGapRatio = 0.5; // Proportion of bar height
	const barGapRatio = $derived(_data.array.length > 100 ? 0 : 0.5);
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

		return getPaletteColor(index, selected.length);
	}

	function setEstimateColour(id) {
		const index = selected.indexOf(id);
		if (index === -1) {
			return ONScolours.grey100;
		}

		return ONScolours.black;
	}

	function setEstimateStroke(id) {
		const index = selected.indexOf(id);
		if (index === -1) {
			return '0.3';
		}

		return '0.6';
	}

	function setConfidenceStroke(id) {
		const index = selected.indexOf(id);
		if (index === -1) {
			return '0.1';
		}

		return '0.4';
	}

	function setBarOpacity(id) {
		const index = selected.indexOf(id);
		if (index === -1) {
			return '0.3';
		}
		return '0.55';
	}

	let yScale = $derived(_data.array ? makeYScale(_data.array, selected) : null);
	let yScaleFn = $derived(yScale ? (d) => yScale?.(d)?.y : () => null);

	let labelHeights: { [key: string]: number } = $state({});
	let labelLookup: any[] | null = $derived(
		marginLabels({
			selected: selectedData,
			heights: selectedData.map((d) => labelHeights[d[0][idKey]] || 10),
			yScale: yScaleFn,
			yKey: idKey
		})
	);

	let xScale = $derived(
		_data
			? scaleLinear()
					.domain([Math.min(0, _data.valueDomain[0]), _data.valueDomain[1]])
					.range([0, widthInner])
			: null
	);
	const maxTickGap = 140; // in pixels
	let nXTicks = $derived(Math.max(2, Math.floor(width / maxTickGap)));

	$inspect({ labelLookup });
</script>

{#snippet bar(b, fill = ONScolours.grey40, opacity = 1, id = '')}
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

{#snippet estimate(b, fill = ONScolours.black, width = 2, strokeWidth = 0.5, opacity = 1, id = '')}
	<rect
		class="chart-estimate"
		x={xScale(b[yKey]) - width / 2}
		y={yScale(b[idKey]).y}
		{width}
		height={yScale(b[idKey]).height}
		{fill}
		stroke={ONScolours.white}
		stroke-width={strokeWidth}
		{opacity}
		on:pointerenter={() => {
			hoveredArea = id;
		}}
		on:pointerleave={() => {
			hoveredArea = null;
		}}
		style:pointer-events={fill === ONScolours.black ? null : 'none'}
	/>
{/snippet}

{#snippet confidence(b, fill = ONScolours.grey40, opacity = 1, strokeWidth = 0.1, id = '')}
	{#if b.lci_95 != null && b.uci_95 != null}
		<rect
			class="chart-estimate"
			x={xScale(b.lci_95)}
			y={yScale(b[idKey]).y}
			width={xScale(b.uci_95) - xScale(b.lci_95)}
			height={yScale(b[idKey]).height}
			{fill}
			{opacity}
			stroke="white"
			stroke-width={strokeWidth}
			on:pointerenter={() => {
				hoveredArea = id;
			}}
			on:pointerleave={() => {
				hoveredArea = null;
			}}
			style:pointer-events={fill === ONScolours.grey40 ? null : 'none'}
		/>
	{/if}
{/snippet}

{#snippet elbow(yPosOrig: number, yPosAdj: number, elbowX: number, height: number)}
	{#if yPosAdj !== yPosOrig}
		<polyline
			stroke={ONScolours.grey60}
			fill="none"
			points="-14,{yPosAdj + height / 2}
                {elbowX},{yPosAdj + height / 2}
                {elbowX},{yPosOrig + height / 2} 
                -2,{yPosOrig + height / 2}"
		>
		</polyline>
	{:else if false}
		<polyline
			stroke={ONScolours.grey60}
			fill="none"
			points="-14,{yPosOrig + height / 2}
                -2,{yPosOrig + height / 2}"
		>
		</polyline>
	{/if}
{/snippet}

{#if width < widthThreshold && mode == 'embed'}
	<ul class="top-labels">
		{#if selectedData.length && !hovered}
			<AreasLegend selectedAreas={selectedCodesNames} useMarkerShapes={false} inlineItems={true}
			></AreasLegend>
		{/if}
		<AreasLegend
			selectedAreas={hoveredCodesNames}
			useMarkerShapes={true}
			inlineItems={true}
			hovered={true}
		></AreasLegend>
		{#if hovered}{/if}
	</ul>
{/if}

<p class="ons-u-vh">Bar chart for {metadata.label}. The data is available to download below.</p>
<div
	bind:clientWidth={width}
	class="bar-wrapper"
	style:padding-right="{rightMargin}px"
	style:padding-top="36px"
	style:padding-bottom="25px"
	style:padding-left="{leftMargin}px"
	aria-hidden="true"
>
	{#if showIntervals}
		<div class="legend-container">
			<svg
				aria-hidden="true"
				width="200"
				height="90"
				class="bar-chart-legend"
				style="overflow: visible;"
			>
				<line
					x1="10"
					y1="15"
					x2="100"
					y2="15"
					stroke={ONScolours.black}
					opacity="0.2"
					stroke-width="15px"
				></line>
				<rect
					x="52"
					width="5"
					y="5"
					height="20"
					fill={ONScolours.black}
					stroke={ONScolours.white}
					stroke-width="1.3px"
				></rect>

				<path
					d={makeCurlyBrace(10, 30, 100, 30, 10, 0.5)}
					stroke={ONScolours.black}
					fill="none"
					stroke-width="1.5px"
				></path>

				<text
					x="55"
					y="60"
					font-size="16px"
					stroke={ONScolours.black}
					fill={ONScolours.black}
					stroke-width="0px"
					text-anchor="middle">95% confidence</text
				>
				<text
					x="55"
					y="80"
					font-size="16px"
					stroke={ONScolours.black}
					fill={ONScolours.black}
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
			{#each xScale.ticks(nXTicks) as xTick}
				<div class="line-x-tick" style:left="{xScale(xTick)}px"></div>
				<div class="line-x-tick-label" style:left="{xScale(xTick)}px">
					{prefix}{formatValue(xTick)}{suffix}
				</div>
			{/each}
		</div>
		<div class="margin-labels">
			{#if width >= widthThreshold}
				{#if hovered}
					<div
						class="margin-label-hovered"
						style:top="{yScale(hovered[idKey]).y + yScale(hovered[idKey]).height / 2}px"
						style:max-width="{leftMargin - 16}px"
						style:left="-8px"
					>
						{hovered?.[labelKey]}
					</div>
				{/if}

				{#if _data.array.length <= maxUnscaledBarsCount && !hovered}
					<!-- add a filtering stage here to ensure selected areas aren't shown -->
					{#each _data.array as s}
						<div
							class="margin-label-geo-all"
							style:top="{yScale(s[idKey]).y + yScale(s[idKey]).height / 2}px"
							style:max-width="{leftMargin - 16}px"
							style:left="-8px"
						>
							{s[labelKey]}
						</div>
					{/each}
				{/if}
				<div class="margin-labels-selected" style:visibility={hovered ? 'hidden' : null}>
					{#key _data}
						{#each selectedData as a, i (a[0][idKey])}
							{@const id = a[0][idKey]}
							{@const yPos = labelLookup?.[i]?.y || yScale?.(a[0][idKey])?.y}
							{@const height = yScale?.(a[0][idKey])?.height || 0}
							{@const isLabelDodged = yPos !== yScale?.(a[0][idKey])?.y}
							<div
								bind:clientHeight={labelHeights[id]}
								data-id={id}
								class="margin-label-selected"
								style:top="{yPos ? yPos + height / 2 : 0}px"
								style:left={isLabelDodged ? '-16px' : '-8px'}
								style:color={getPaletteColor(i, selectedData.length, 'text')}
								style:max-width="{leftMargin - 16}px"
							>
								{a[0][labelKey]}
							</div>
						{/each}
					{/key}
				</div>
			{/if}
		</div>
		<svg
			viewBox="0 0 {widthInner} {height}"
			class="bar-chart"
			preserveAspectRatio="none"
			style:height="{height}px"
		>
			{#if _data && xScale && yScale}
				<g opacity={hovered ? 0.5 : 1}>
					{#each _data.array as b, i (b[idKey])}
						{#if !showIntervals}
							{@render bar(b, setBarColour(b[idKey]), 1, b[idKey])}
						{:else}
							{@render bar(b, setBarColour(b[idKey]), setBarOpacity(b[idKey]), b[idKey])}
							{@render confidence(b, ONScolours.white, 1, 0, b[idKey], i)}
							{@render confidence(
								b,
								setBarColour(b[idKey]),
								1,
								setConfidenceStroke(b[idKey]),
								b[idKey],
								i
							)}
							{@render estimate(
								b,
								setBarColour(b[idKey]),
								3,
								setEstimateStroke(b[idKey]),
								1,
								b[idKey],
								i
							)}
							{@render estimate(
								b,
								setEstimateColour(b[idKey]),
								3,
								setEstimateStroke(b[idKey]),
								0.6,
								b[idKey],
								i
							)}
							{#if b.uci_95 > 0 && b.lci_95 > 0}
								<rect
									x={xScale(b.lci_95) - 0.25}
									y={yScale(b[idKey]).y}
									width="0.8"
									height={yScale(b[idKey]).height}
									fill={ONScolours.white}
								>
								</rect>
							{/if}
						{/if}
					{/each}
				</g>
				<g>
					{#if hovered}
						{#if !showIntervals}
							{@render bar(hovered, ONScolours.highlightOrangeDark, 1, hoveredArea)}
						{:else}
							{@render bar(hovered, ONScolours.highlightOrangeDark, 0.55, hoveredArea)}
							{@render confidence(hovered, ONScolours.white, 1, 0.1, hoveredArea)}
							{@render confidence(hovered, ONScolours.highlightOrangeDark, 1, 0.1, hoveredArea)}
							{@render estimate(hovered, ONScolours.highlightOrangeDark, 3, 0.5, 1, hoveredArea)}
							{@render estimate(hovered, ONScolours.black, 3, 0.5, 0.6, hoveredArea)}
							{#if hovered.uci_95 && hovered.lci_95}
								<rect
									x={xScale(hovered.lci_95) - 0.25}
									y={yScale(hovered[idKey]).y}
									width="0.8"
									height={yScale(hovered[idKey]).height}
									fill={ONScolours.white}
								>
								</rect>
							{/if}
						{/if}
					{/if}
				</g>
			{/if}
			{#if width >= widthThreshold && labelLookup?.[0] && !hovered}
				<g>
					{#each selectedData as a, i (a[0][idKey])}
						{@const yPosAdj = labelLookup?.[i]?.y || yScale(a[0][idKey]).y}
						{@const yPosOrig = yScale(a[0][idKey]).y}
						{@const height = yScale(a[0][idKey]).height}
						{@const elbowX = xScale(0) - 6 - labelLookup?.[i]?.elbow}
						{@render elbow(yPosOrig, yPosAdj, elbowX, height)}
					{/each}
				</g>
			{/if}
		</svg>
	</div>
</div>

<style>
	.hidden {
		visibility: hidden;
	}
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
		border-left: 1px solid var(--ons-color-grey-60);
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
		height: 8px;
		border-left: 1px solid var(--ons-color-grey-60);
	}

	.line-x-tick-label {
		position: absolute;
		bottom: calc(100% + 12px);
		transform: translateX(-50%);
		font-size: 18px;
		white-space: nowrap;
		line-height: 1;
	}

	.x-baseline {
		position: absolute;
		width: 100%;
		border-bottom: 2px solid var(--ons-color-grey-60);
		transform: translateY(-1px);
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

	.margin-labels-selected {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
	}

	.margin-label-hovered {
		position: absolute;
		transform: translate(-100%, -50%);
		font-size: 18px;
		font-weight: bold;
		text-align: right;
		line-height: 0.95;
		color: var(--ons-color-highlight-orange-dark);
	}

	.margin-label-selected {
		position: absolute;
		transform: translate(-100%, -50%);
		font-size: 18px;
		font-weight: bold;
		text-align: right;
		line-height: 0.95;
		padding-top: 4px;
		padding-bottom: 4px;
	}

	.margin-label-geo-all {
		position: absolute;
		transform: translate(-100%, -50%);
		font-size: 18px;
		font-weight: bold;
		color: var(--ons-color-grey-60);
		max-width: 140px;
		text-align: right;
		line-height: 0.95;
	}
</style>
