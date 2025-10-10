<script lang="ts">
	import { generateNumbersIncrementFromMaxValue } from '$lib/utils';

	export let timePeriodsArray, chartHeight, xDomain, x, xAxisFinalTickWidth, chartWidth;

	let xAxisTickRects = [];

	$: xAxisFinalTick = xAxisTickRects.length > 0 ? xAxisTickRects[0] : null;
	$: xAxisFinalTickWidth = xAxisFinalTick ? xAxisFinalTick.width : null;

	$: maxWidth = xAxisTickRects.length > 0 ? Math.max(...xAxisTickRects.map((el) => el.width)) : 0;
</script>

<g class="x-axis-container" transform="translate(0,{chartHeight})">
	<!-- <line y1="0" y2="0" x1={x(xDomain[0])} x2={x(xDomain[1])}></line> -->

	{#each [timePeriodsArray[0], timePeriodsArray[timePeriodsArray.length - 1]] as d, i}
		<g class="tick" transform="translate({x(d.xDomainNumb)},0)">
			<line y1={[3, 0][i]} y2="12"></line>

			<!-- {#if maxWidth + 20 < chartWidth} -->
			<text bind:contentRect={xAxisTickRects[i]} text-anchor="middle" y={26}>{d.labelShort}</text>
			<!-- {:else} -->
			<!-- <text text-anchor="middle" y={26}>{String(d.label).substring(2, 4)}</text> -->
			<!-- {/if} -->
		</g>
	{/each}
</g>

<style>
	line {
		stroke: #222;
		forced-color-adjust: auto;
	}

	text {
		font-size: 16px;
		forced-color-adjust: auto;
	}
</style>
