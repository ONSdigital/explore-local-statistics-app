<script lang="ts">
	import { generateNumbersIncrementFromMaxValue } from '$lib/utils';

	export let timePeriodsArray, chartHeight, xDomain, x, xAxisFinalTickWidth, fontSize, chartWidth;

	$: xDistance = Math.abs(xDomain[1] - xDomain[0]);

	$: tickInterval = xDistance >= 15 ? 5 : xDistance >= 6 ? 2 : 1;

	$: ticks = generateNumbersIncrementFromMaxValue(xDomain, tickInterval);

	let xAxisTickRects = [];

	$: xAxisFinalTick = xAxisTickRects.length > 0 ? xAxisTickRects[0] : null;
	$: xAxisFinalTickWidth = xAxisFinalTick ? xAxisFinalTick.width : null;

	$: maxWidth = xAxisTickRects.length > 0 ? Math.max(...xAxisTickRects.map((el) => el.width)) : 0;

	$: filteredTicks = timePeriodsArray.filter((el) => ticks.includes(parseInt(el.xDomainNumb)));

	$: console.log(maxWidth);
</script>

<g class="x-axis-container" transform="translate(0,{chartHeight})">
	<line y1="0" y2="0" x1={x(xDomain[0])} x2={x(xDomain[1])}></line>

	{#each filteredTicks as d, i}
		<g
			class="tick"
			transform="translate({x(d.xDomainNumb)},0)"
			opacity={maxWidth * filteredTicks.length < 0.75 * chartWidth ? 1 : 0}
		>
			<line y1="0" y2="8"></line>

			{#if i === 0}
				<text font-size={fontSize} bind:contentRect={xAxisTickRects[i]} text-anchor="middle" y={25}
					>{d.label}</text
				>
			{:else}
				<text font-size={fontSize} text-anchor="middle" y={25}>{d.label}</text>
			{/if}
		</g>
	{/each}

	{#if maxWidth * filteredTicks.length >= 0.75 * chartWidth}
		{#each timePeriodsArray.filter((el) => xDomain.includes(el.xDomainNumb)) as d, i}
			<g class="tick" transform="translate({x(d.xDomainNumb)},0)">
				<line y1="0" y2="8"></line>

				{#if i === 0}
					<text
						font-size={fontSize}
						bind:contentRect={xAxisTickRects[i]}
						text-anchor="middle"
						y={25}>{d.label}</text
					>
				{:else}
					<text font-size={fontSize} text-anchor="middle" y={25}>{d.label}</text>
				{/if}
			</g>
		{/each}
	{/if}
</g>

<style>
	line {
		stroke: #222;
	}
</style>
