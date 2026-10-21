<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { ONScolours } from '$lib/config';

	let {
		data,
		xDomain,
		comparisonData = null,
		refInset = 0,
		chartWidth,
		CIsStyle,
		formatPeriod = (d) => d,
		valuePeriod,
		fullSeriesMissing
	} = $props();
	let leftMargin = $state(0);
	const barHeight = 20;
	const rowHeight = 70;
	const refLineWidth = 2.5;

	let xScale = $derived(xDomain ? scaleLinear().domain(xDomain).range([0, chartWidth]) : null);

	let reference = $derived.by(() => {
		if (!xScale || !comparisonData) return null;
		const hasInterval = comparisonData.lci_95 != null && comparisonData.uci_95 != null;
		return {
			barX: hasInterval ? xScale(comparisonData.lci_95) : null,
			barWidth: hasInterval ? xScale(comparisonData.uci_95) - xScale(comparisonData.lci_95) : null,
			lineX: comparisonData.value != null ? xScale(comparisonData.value) : null
		};
	});
	let refY = $derived(refInset > 0 ? refInset : -0.5);
	let refHeight = $derived(rowHeight + 0.5 - refY);
	$inspect(data);
</script>

<div class="pointrange-individual" style:padding-left="{leftMargin}px">
	<svg
		viewBox="0 0 {chartWidth} {rowHeight}"
		class="pointrange-svg"
		aria-hidden="true"
		style:height="{rowHeight}px"
		style:width="{chartWidth}px"
		overflow="visible"
	>
		{#if xScale && data}
			<rect
				x={xScale(xDomain[0])}
				width={xScale(xDomain[1]) - xScale(xDomain[0])}
				y={10}
				height={rowHeight - 20}
				fill={ONScolours.grey10}
				opacity="01"
			>
			</rect>
		{/if}
		{#if reference}
			{#if reference.barX != null}
				<rect
					class="reference-bar"
					x={reference.barX}
					y={refY}
					width={reference.barWidth}
					height={refHeight}
				/>
			{/if}
			{#if reference.lineX != null}
				<rect
					class="reference-line"
					x={reference.lineX - refLineWidth / 2}
					y={refY}
					width={refLineWidth}
					height={refHeight}
				/>
			{/if}
		{/if}
		{#if data}
			<!-- <line
				stroke-dasharray="5"
				x1={xScale(xDomain[0])}
				x2={xScale(xDomain[1])}
				y1={rowHeight/2}
				y2={rowHeight/2}
				stroke="black"
				stroke-width="0.5"
			>
			</line> -->
			{#if data.lci_95 != null && data.uci_95 != null}
				<rect
					class="confidence-bar"
					x={xScale(data.lci_95)}
					y={35 - barHeight / 2}
					width={xScale(data.uci_95) - xScale(data.lci_95)}
					height={barHeight}
					fill={ONScolours.oceanBlue}
					opacity="1"
				/>
			{/if}
			{#if data.value != null}
				{@const centerY = 35}
				{@const diamondConst = 6}
				<rect
					class={(data.lci_95 != null && data.uci_95 != null) || CIsStyle
						? 'value-diamond-within-ci'
						: 'value-diamond'}
					x={xScale(data.value) - diamondConst}
					y={centerY - diamondConst}
					width={diamondConst * 2}
					height={diamondConst * 2}
					stroke-width="1.75px"
					transform={`rotate(45 ${xScale(data.value)} ${centerY})`}
				/>
			{/if}
		{:else if !fullSeriesMissing}
			<!-- adding as foreign object because we are within svg now -->
			<foreignObject x="0" y="0" width={chartWidth} height={rowHeight}>
				<div xmlns="http://www.w3.org/1999/xhtml" class="no-data-to-date">
					<span class="no-data-label">Data unavailable for {formatPeriod(valuePeriod)}</span>
				</div>
			</foreignObject>
		{/if}
	</svg>
</div>

<style>
	.no-data-to-date {
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		color: var(--ons-color-grey-75);
		text-align: center;
	}

	.no-data-label {
		padding: 0.25rem 0.5rem;
		background-color: rgba(255, 255, 255, 0.85);
		line-height: 1.2;
	}

	.pointrange-individual {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 70px;
	}
	.pointrange-svg {
		display: block;
	}
	.value-diamond-within-ci {
		fill: white;
		stroke: black;
	}
	.value-diamond {
		fill: var(--ons-color-ocean-blue);
		stroke: var(--ons-color-ocean-blue);
	}
	.reference-bar {
		fill: var(--ons-color-grey-25);
	}
	.reference-line {
		fill: var(--ons-color-grey-60);
	}
</style>
