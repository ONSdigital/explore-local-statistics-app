<script lang="ts">
	import { generateNumbersIncrementFromMaxValue } from '$lib/util/charts/generateNumbersIncrementFromMaxValue';

	export let timePeriodsArray, chartHeight, xDomain, x, xAxisFinalTickWidth, chartWidth;

	//xAxisTickRects is used to calculate the width of ticks, which is used to set padding and decide how many ticks to render (e.g. it prevents overlapping ticks)
	let xAxisTickRects = [];

	$: xAxisFinalTick = xAxisTickRects.length > 0 ? xAxisTickRects[0] : null;
	$: xAxisFinalTickWidth = xAxisFinalTick ? xAxisFinalTick.width : null;

	$: maxWidth = xAxisTickRects.length > 0 ? Math.max(...xAxisTickRects.map((el) => el.width)) : 0;
</script>

<g class="x-axis-container" transform="translate(0,{chartHeight})">
	{#each [timePeriodsArray[0], timePeriodsArray[timePeriodsArray.length - 1]] as d, i}
		<g class="tick" transform="translate({x(d.xDomainNumb)},0)">
			<line y1={[3, 0][i]} y2="12"></line>

			{#if maxWidth + 20 < chartWidth}
				<text bind:contentRect={xAxisTickRects[i]} text-anchor="middle" y={26}>{d.labelShort}</text>
			{:else}
				<text text-anchor="middle" y={26}>{String(d.label).substring(2, 4)}</text>
			{/if}
		</g>
	{/each}
</g>

<style>
	line {
		stroke: #222;
	}

	text {
		font-size: 16px;
	}
</style>
