<script>
	import {
		addThousandsSeparator,
		roundNumber,
		generateDivisibleNumbersWithinRange
	} from '$lib/utils';

	export let indicator, chartWidth, y, yDomain;

	$: yDistance = Math.abs(yDomain[1] - yDomain[0]);
	$: yDistancePowerBelow = 10 ** Math.floor(Math.log10(yDistance));

	$: tickInterval =
		yDistance / yDistancePowerBelow > 5
			? yDistancePowerBelow * 2
			: yDistance / yDistancePowerBelow > 2
				? yDistancePowerBelow
				: yDistancePowerBelow / 2;

	$: ticks = generateDivisibleNumbersWithinRange(yDomain, tickInterval);
</script>

<g class="x-axis-container">
	<line y1="0" y2="0" x1={y(yDomain[1])} x2={y(yDomain[0])}></line>

	{#each ticks as d, i}
		<g class="tick" transform="translate({y(d)},0)">
			<line y1="0" y2="-4"></line>

			<text text-anchor="middle" x="0" y="-10"
				>{indicator.metadata.prefix + addThousandsSeparator(d) + indicator.metadata.suffix}</text
			>
		</g>
	{/each}
</g>

<style>
	line {
		stroke: #222;
	}
</style>
