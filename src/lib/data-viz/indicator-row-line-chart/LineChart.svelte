<script lang="ts">
	import AxisY from './axis/AxisY.svelte';
	import AxisX from './axis/AxisX.svelte';
	import Line from './Line.svelte.svelte';
	import Label from './Label.svelte';
	import ConfidenceIntervals from './../shared/ConfidenceIntervals.svelte';

	import { scaleLinear } from 'd3-scale';

	import { findHighestDivisibleAbove } from '$lib/util/charts/findHighestDivisibleAbove';
	import { findSmallestDivisibleBelow } from '$lib/util/charts/findSmallestDivisibleBelow';

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

	//calculating where the ticks on the y-axis should be
	$: yDistance = Math.abs(yDomain[1] - yDomain[0]);
	$: yDistancePowerBelow = 10 ** Math.floor(Math.log10(yDistance));

	$: tickInterval =
		yDistance / yDistancePowerBelow > 5
			? yDistancePowerBelow * 2
			: yDistance / yDistancePowerBelow > 2
				? yDistancePowerBelow
				: yDistancePowerBelow / 2;

	//adjust yDomain based on where y-aixs ticks need to be (e.g. we might need to increase the scale slightly to fit the last tick on)
	$: yDomainAdjusted = [
		indicator.metadata.canBeNegative === 'F'
			? Math.max(0, findSmallestDivisibleBelow(yDomain[0], tickInterval))
			: findSmallestDivisibleBelow(yDomain[0], tickInterval),
		indicator.metadata.suffix === '%'
			? Math.min(100, findHighestDivisibleAbove(yDomain[1], tickInterval))
			: findHighestDivisibleAbove(yDomain[1], tickInterval)
	];

	$: y = scaleLinear().domain(yDomainAdjusted).range([chartHeight, 0]);

	//get data for any additional areas to be visualised
	$: additionalLines = showConfidenceIntervals
		? []
		: selectionsObject['areas-rows-additional-visible'].map((el) => ({
				role: el.role,
				data: additionalFilteredChartData.filter((elm) => el.areacd === elm.areacd),
				areacd: el.areacd
			}));

	//create data array
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
				<ConfidenceIntervals {area} {x} {y} {customLookup}></ConfidenceIntervals>
			{/each}
		{/if}
		{#each linesArray as area, i}
			<Line {area} {xDomain} {x} {y} {customLookup} linesCount={linesArray.length}></Line>
		{/each}
	</g>
	{#if hoverChartData.length > 0}
		{#if showConfidenceIntervals}
			<ConfidenceIntervals area={{ role: 'selected', data: hoverChartData }} {x} {y}
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
			data={selectedFilteredChartData}
			{y}
			bind:maxLabelWidth
			role="main"
			hover={false}
			{chartHeight}
		></Label>
	{/if}
</g>
