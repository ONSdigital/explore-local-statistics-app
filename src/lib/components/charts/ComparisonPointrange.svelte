<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { ONScolours } from '$lib/config';

	let { data, xKey = 'value', idKey = 'areacd', xDomain, chartWidth } = $props();
	let leftMargin = $state(0);
	const barHeight = 20;

	let xScale = $derived(xDomain ? scaleLinear().domain(xDomain).range([0, 300]) : null);
</script>

<div class="pointrange-individual" style:padding-left="{leftMargin}px">
	<svg
		viewBox="0 0 {chartWidth} 90"
		class="pointrange-svg"
		aria-hidden="true"
		style:height="90px"
		overflow="visible"
	>
		{#if xScale && data}
			<line
				stroke-dasharray="3"
				x1={xScale(xDomain[0])}
				x2={xScale(xDomain[1])}
				y1={45}
				y2={45}
				stroke="black"
				stroke-width="0.5"
			>
			</line>
			{#if data.lci_95 != null && data.uci_95 != null}
				<rect
					class="confidence-bar"
					x={xScale(data.lci_95)}
					y={45 - barHeight / 2}
					width={xScale(data.uci_95) - xScale(data.lci_95)}
					height={barHeight}
					fill={ONScolours.oceanBlue}
					opacity="1"
				/>
			{/if}
			{#if data.value != null}
				{@const centerY = 45}
				{@const diamondConst = 6}
				<rect
					x={xScale(data.value) - diamondConst}
					y={centerY - diamondConst}
					width={diamondConst * 2}
					height={diamondConst * 2}
					fill="white"
					stroke="black"
					stroke-width="1.75px"
					transform={`rotate(45 ${xScale(data.value)} ${centerY})`}
				/>
			{/if}
		{/if}
	</svg>
</div>

<style>
	.pointrange-individual {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 90px;
	}
	.pointrange-svg {
		display: block;
	}
</style>
