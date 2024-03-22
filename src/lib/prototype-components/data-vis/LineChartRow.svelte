<script lang="ts">
	import AxisY from '$lib/prototype-components/data-vis/line-chart-row/AxisY.svelte';
	import AxisX from '$lib/prototype-components/data-vis/line-chart-row/AxisX.svelte';
	import Line from '$lib/prototype-components/data-vis/line-chart-row/Line.svelte';
	import Label from '$lib/prototype-components/data-vis/line-chart-row/Label.svelte';
	import ConfidenceIntervals from '$lib/prototype-components/data-vis/line-chart-row/ConfidenceIntervals.svelte';

	import { scaleLinear } from 'd3-scale';
	import { tick } from 'svelte';

	export let indicator,
		xDomain,
		yDomain,
		selectedFilteredChartData,
		comparisonFilteredChartData,
		chartWidth,
		chartHeight,
		hoverChartData,
		yAxisMaxTickWidth,
		xAxisFinalTickWidth,
		maxLabelWidth,
		timePeriodsArray,
		selectionsObject,
		additionalFilteredChartData,
		customLookup,
		showConfidenceIntervals;

	$: x = scaleLinear().domain(xDomain).range([0, chartWidth]);

	$: yDistance = Math.abs(yDomain[1] - yDomain[0]);
	$: yDistancePowerBelow = 10 ** Math.floor(Math.log10(yDistance));

	$: tickInterval =
		yDistance / yDistancePowerBelow > 5
			? yDistancePowerBelow * 2
			: yDistance / yDistancePowerBelow > 2
				? yDistancePowerBelow
				: yDistancePowerBelow / 2;

	function findHighestDivisibleAbove(targetNumber, divisor) {
		// Calculate the remainder when dividing the target number by the divisor
		let remainder = targetNumber % divisor;

		// If the remainder is 0, the target number is already divisible by the divisor
		if (remainder === 0) {
			return targetNumber;
		}

		// Calculate the difference needed to reach the next multiple of the divisor
		let difference = divisor - remainder;

		// Calculate the highest number above the target number that is divisible by the divisor
		let highestDivisibleAbove = targetNumber + difference;

		return highestDivisibleAbove;
	}

	function findSmallestDivisibleBelow(targetNumber, divisor) {
		// Calculate the remainder when dividing the target number by the divisor
		let remainder = targetNumber % divisor;

		// If the remainder is 0, the target number is already divisible by the divisor
		if (remainder === 0) {
			return targetNumber;
		}

		// Calculate the difference needed to reach the previous multiple of the divisor
		let difference = remainder;

		// Calculate the smallest number below the target number that is divisible by the divisor
		let smallestDivisibleBelow = targetNumber - difference;

		return smallestDivisibleBelow;
	}

	$: yDomainAdjusted = [
		indicator.metadata.canBeNegative === 'F'
			? Math.max(0, findSmallestDivisibleBelow(yDomain[0], tickInterval))
			: findSmallestDivisibleBelow(yDomain[0], tickInterval),
		indicator.metadata.suffix === '%'
			? Math.min(100, findHighestDivisibleAbove(yDomain[1], tickInterval))
			: findHighestDivisibleAbove(yDomain[1], tickInterval)
	];

	$: y = scaleLinear().domain(yDomainAdjusted).range([chartHeight, 0]);

	$: additionalLines = showConfidenceIntervals
		? []
		: selectionsObject['areas-rows-additional-visible'].map((el) => ({
				role: el.role,
				data: additionalFilteredChartData.filter((elm) => el.areacd === elm.areacd),
				areacd: el.areacd
			}));

	$: linesArray = [
		...additionalLines,
		comparisonFilteredChartData &&
		comparisonFilteredChartData.length > 0 &&
		!showConfidenceIntervals
			? {
					role: selectionsObject['areas-rows-comparison-visible'].role,
					data: comparisonFilteredChartData
				}
			: null,
		selectedFilteredChartData && selectedFilteredChartData.length > 0
			? { role: 'main', data: selectedFilteredChartData }
			: null
	].filter((el) => el);
</script>

<AxisY
	selectedIndicator={indicator}
	{chartHeight}
	bind:yAxisMaxTickWidth
	{y}
	yDomain={yDomainAdjusted}
></AxisY>
<AxisX {timePeriodsArray} {chartHeight} {chartWidth} {xDomain} {x} bind:xAxisFinalTickWidth></AxisX>

<g class="lines-container">
	<g class="primary-lines" style="opacity :{hoverChartData.length > 0 ? 0.2 : 1}">
		{#if showConfidenceIntervals}
			{#each linesArray as area, i}
				<ConfidenceIntervals {area} {xDomain} {x} {y} {customLookup}></ConfidenceIntervals>
			{/each}
		{/if}
		{#each linesArray as area, i}
			<Line {area} {xDomain} {x} {y} {customLookup} linesCount={linesArray.length}></Line>
		{/each}
	</g>
	{#if hoverChartData.length > 0}
		{#if showConfidenceIntervals}
			<ConfidenceIntervals area={{ role: 'selected', data: hoverChartData }} {xDomain} {x} {y}
			></ConfidenceIntervals>
		{/if}

		<Line
			area={{ role: 'selected', data: hoverChartData }}
			{xDomain}
			{x}
			{y}
			{customLookup}
			linesCount={1}
		></Line>
	{/if}
</g>

<g class="label-container" transform="translate({chartWidth},0)">
	{#if hoverChartData.length > 1}
		<Label
			{indicator}
			{xDomain}
			data={hoverChartData}
			{y}
			bind:maxLabelWidth
			role="selected"
			hover={true}
			{chartHeight}
		></Label>
	{:else if selectedFilteredChartData.length > 1}
		<Label
			{indicator}
			{xDomain}
			data={selectedFilteredChartData}
			{y}
			bind:maxLabelWidth
			role="main"
			hover={false}
			{chartHeight}
		></Label>
	{/if}
</g>

<!-- {#if hoverChartData.length > 0}
	<ConfidenceIntervals area={{ role: 'selected', data: hoverChartData }} {xDomain} {x} {y}
	></ConfidenceIntervals>
{/if} -->

<!-- <AxisY selectedIndicator={indicator} {chartHeight} bind:yAxisMaxTickWidth {y} {yDomain}></AxisY>
<AxisX {timePeriodsArray} {chartHeight} {xDomain} {x} bind:xAxisFinalTickWidth></AxisX>

<g class="lines-container">
	<g class="primary-lines" style="opacity :{hoverId ? 0.2 : 1}">
		{#each linesArray as area, i}
			<Line {area} {xDomain} {x} {y}></Line>
		{/each}
	</g>
	{#if hoverId}
		<Line area={{ role: 'selected', data: hoverChartData }} {xDomain} {x} {y}></Line>
	{/if}
</g>

<g class="label-container" transform="translate({chartWidth},0)">
	{#if hoverId}
		<Label {indicator} {xDomain} data={hoverChartData} {y} bind:maxLabelWidth role="selected"
		></Label>
	{:else}
		<Label
			{indicator}
			{xDomain}
			data={selectedAreaFilteredChartData}
			{y}
			bind:maxLabelWidth
			role="main"
		></Label>
	{/if}
</g> -->

<!-- {#if hoverId}
	<ConfidenceIntervals
		area={hoverAreaWithDataAdded
			? hoverAreaWithDataAdded
			: visibleAreasWithDataAdded[0].find((el) => el.areacd === hoverId)}
		{xDomain}
		{x}
		{y}
	></ConfidenceIntervals>
{/if}  -->
