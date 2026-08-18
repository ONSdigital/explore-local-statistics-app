<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { ONScolours } from '$lib/config';

	let { data, xKey = 'value', idKey = 'areacd', xDomain, chartWidth } = $props();
	let leftMargin = $state(0);
	const barHeight = 20;

	let xScale = $derived(xDomain ? scaleLinear().domain(xDomain).range([0, 300]) : null);
</script>

<div
	class="pointrange-individual"
	style:padding-left="{leftMargin}px"
	style:padding-bottom="5px"
	style:padding-top="5px"
>
	<svg viewBox="0 0 {chartWidth} 20" class="pointrange-svg" aria-hidden="true" style:width="300px">
		{#if xScale && data}
			<line
				stroke-dasharray="3"
				x1={xScale(xDomain[0])}
				x2={xScale(xDomain[1])}
				y1={barHeight / 2}
				y2={barHeight / 2}
				stroke="black"
			>
			</line>
			{#if data.lci_95 != null && data.uci_95 != null}
				<!-- adding white rect below to hide dashed line, but will need to make sure that comparison area line sits above this hmmm. -->
				<rect
					class="confidence-bar-white-trick"
					x={xScale(data.lci_95)}
					y="0"
					width={xScale(data.uci_95) - xScale(data.lci_95)}
					height={barHeight}
					fill={ONScolours.white}
					opacity="1"
				/>
				<rect
					class="confidence-bar"
					x={xScale(data.lci_95)}
					y="0"
					width={xScale(data.uci_95) - xScale(data.lci_95)}
					height={barHeight}
					fill={ONScolours.nightBlue}
					opacity="0.6"
				/>
			{/if}
			{#if data.value != null}
				{@const diamondConst = barHeight / 3}
				<rect
					class="value-point"
					x={xScale(data.value) - diamondConst}
					y={barHeight / 2 - diamondConst}
					width={diamondConst * 2}
					height={diamondConst * 2}
					fill="white"
					stroke="black"
					stroke-width="1.75px"
					transform="rotate(45 {xScale(data.value)} {barHeight / 2})"
				/>
			{/if}
		{/if}
	</svg>
</div>
