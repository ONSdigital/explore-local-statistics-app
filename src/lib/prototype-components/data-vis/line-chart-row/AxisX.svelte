<script lang="ts">
	import { generateNumbersIncrementFromMaxValue } from '$lib/utils';

	export let timePeriodsArray, chartHeight, xDomain, x, xAxisFinalTickWidth;

	let xAxisFinalTick;
	$: xAxisFinalTickWidth = xAxisFinalTick ? xAxisFinalTick.width : null;
</script>

<g class="x-axis-container" transform="translate(0,{chartHeight})">
	<line y1="0" y2="0" x1={x(xDomain[0])} x2={x(xDomain[1])}></line>

	{#each [timePeriodsArray[0], timePeriodsArray[timePeriodsArray.length - 1]] as d, i}
		<g class="tick" transform="translate({x(d.xDomainNumb)},0)">
			<line y1="0" y2="8"></line>

			{#if i === 0}
				<text bind:contentRect={xAxisFinalTick} text-anchor="middle" y={25}>{d.xDomainNumb}</text>
			{:else}
				<text text-anchor="middle" y={25}>{d.xDomainNumb}</text>
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
