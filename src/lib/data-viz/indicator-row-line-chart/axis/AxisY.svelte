<script>
	import { addThousandsSeparator } from '$lib/util/charts/addThousandsSeparator';
	import { roundNumber } from '$lib/util/charts/roundNumber';
	import { generateDivisibleNumbersWithinRange } from '$lib/util/charts/generateDivisibleNumbersWithinRange';

	export let selectedIndicator, chartHeight, yAxisMaxTickWidth, y, yDomain;

	$: yDistance = Math.abs(yDomain[1] - yDomain[0]);
	$: yDistancePowerBelow = 10 ** Math.floor(Math.log10(yDistance));

	$: tickInterval =
		yDistance / yDistancePowerBelow > 5
			? yDistancePowerBelow * 2
			: yDistance / yDistancePowerBelow > 2
				? yDistancePowerBelow
				: yDistancePowerBelow / 2;

	$: ticks = yDomain;

	$: maxValue = ticks ? Math.max(...ticks) : 0;

	let ticksWidthArray = [];

	$: yAxisMaxTickWidth =
		ticksWidthArray.length > 0
			? Math.max(...ticksWidthArray.map((e) => e.width))
			: yAxisMaxTickWidth;
</script>

<g class="y-axis-container">
	<line x1="0" x2="0" y1={y(yDomain[1])} y2={y(yDomain[0])}></line>

	{#each ticks.filter((e, i) => i === 0 || i === ticks.length - 1) as d, i}
		<g class="tick" transform="translate(0,{y(d)})">
			<line x1="0" x2="-8"></line>

			<text bind:contentRect={ticksWidthArray[i]} text-anchor="end" x="-10" y="5" font-size="16px"
				>{selectedIndicator.metadata.prefix +
					(maxValue >= 1000000
						? addThousandsSeparator(d / 1000000) + 'm'
						: maxValue >= 100000
							? addThousandsSeparator(d / 1000) + 'k'
							: addThousandsSeparator(d.toFixed(0))) +
					selectedIndicator.metadata.suffix}</text
			>
		</g>
	{/each}
</g>

<style>
	line {
		stroke: #222;
	}
</style>
