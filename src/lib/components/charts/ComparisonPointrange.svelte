<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { ONScolours } from '$lib/config';

	let { data, xKey = 'value', idKey = 'areacd', xDomain } = $props();
	let height = $derived(30);
	let width = $state(300);
	let leftMargin = $state(0);
	const barHeight = 20;

	let xScale = $derived(xDomain ? scaleLinear().domain(xDomain).range([0, width]) : null);
</script>

<div
	bind:clientWidth={width}
	class="pointrange-individual"
	style:padding-left="{leftMargin}px"
	style:padding-bottom="3px"
	style:padding-top="20px"
>
	<svg {width} {height} style="overflow: visible; display: block;">
		{#if xScale && data && data.lci_95 != null && data.uci_95 != null}
			<rect
				class="confidence-bar"
				x={xScale(data.lci_95)}
				y="0"
				width={xScale(data.uci_95) - xScale(data.lci_95)}
				height={barHeight}
				fill={ONScolours.nightBlue}
				opacity="0.5"
			/>
		{/if}
		<!-- <circle
			class="value-point"
			cx={xScale(data.value)}
			cy={barHeight / 2}
			r={barHeight / 3}
			fill="white"
			stroke="black"
			stroke-width="2px"
		>
		</circle> -->
		{#if xScale && data.value != null}
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
	</svg>
</div>
