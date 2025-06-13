<script>
	import {
		addThousandsSeparator,
		roundNumber,
		generateDivisibleNumbersWithinRange
	} from '$lib/utils';

	export let indicator, chartWidth, y, yDomain, xAxisFinalTickWidth;

	$: yDistance = Math.abs(yDomain[1] - yDomain[0]);
	$: yDistancePowerBelow = 10 ** Math.floor(Math.log10(yDistance));

	$: tickInterval =
		yDistance / yDistancePowerBelow > 5
			? yDistancePowerBelow * 2
			: yDistance / yDistancePowerBelow > 2
				? yDistancePowerBelow
				: yDistancePowerBelow / 2;

	$: ticks = generateDivisibleNumbersWithinRange(yDomain, tickInterval);

	let xAxisTickRects = [];

	$: xAxisFinalTick = xAxisTickRects.length > 0 ? xAxisTickRects[0] : null;
	$: xAxisFinalTickWidth = xAxisFinalTick ? xAxisFinalTick.width : null;

	$: maxWidth = xAxisTickRects.length > 0 ? Math.max(...xAxisTickRects.map((el) => el.width)) : 0;

	$: console.log(maxWidth * ticks.length >= 0.75 * chartWidth);
</script>

<g class="x-axis-container">
	<line y1="0" y2="0" x1={y(yDomain[1])} x2={y(yDomain[0])}></line>

	{#each ticks as d, i}
		<g
			class="tick"
			transform="translate({y(d)},0)"
			opacity={maxWidth * ticks.length < 0.75 * chartWidth ? 1 : 0}
		>
			<line y1="0" y2="-4"></line>

			<text text-anchor="middle" x="0" y="-10" bind:contentRect={xAxisTickRects[i]}
				>{indicator.metadata.prefix + addThousandsSeparator(d) + indicator.metadata.suffix}</text
			>
		</g>
	{/each}

	{#if maxWidth * ticks.length >= 0.75 * chartWidth}
		{#each ticks.filter((el, i) => i === 0 || i === ticks.length - 1) as d, i}
			<g class="tick" transform="translate({y(d)},0)">
				<line y1="0" y2="-4"></line>

				<text text-anchor="middle" x="0" y="-10" bind:contentRect={xAxisTickRects[i]}
					>{indicator.metadata.prefix + addThousandsSeparator(d) + indicator.metadata.suffix}</text
				>
			</g>
		{/each}
	{/if}
</g>

<style>
	line {
		stroke: #222;
	}
</style>
