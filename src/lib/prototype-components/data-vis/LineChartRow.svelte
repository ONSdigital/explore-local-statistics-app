<script lang="ts">
	import AxisY from '$lib/prototype-components/data-vis/line-chart-row/AxisY.svelte';
	import AxisX from '$lib/prototype-components/data-vis/line-chart-row/AxisX.svelte';
	import Line from '$lib/prototype-components/data-vis/line-chart-row/Line.svelte';
	import Label from '$lib/prototype-components/data-vis/line-chart-row/Label.svelte';
	import ConfidenceIntervals from '$lib/prototype-components/data-vis/line-chart/ConfidenceIntervals.svelte';

	import { scaleLinear } from 'd3-scale';

	export let indicator,
		xDomain,
		yDomain,
		chartHeight,
		chartWidth,
		hoverChartData,
		hoverId,
		selectedAreaFilteredChartData,
		comparisonAreaFilteredChartData,
		timePeriodsArray,
		chosenComparisonMeasureOrArea;
	export let yAxisMaxTickWidth, xAxisFinalTickWidth, maxLabelWidth;

	$: x = scaleLinear().domain(xDomain).range([0, chartWidth]);

	$: y = scaleLinear().domain(yDomain).range([chartHeight, 0]);

	/*export let selectedIndicator,
		timePeriodsArray,
		chartWidth,
		chartHeight,
		visibleAreasWithDataAdded,
		xDomain,
		yDomain,
		isHoverLabelVisible,
		hoverId,
		hoverAreaWithDataAdded,
		yAxisMaxTickWidth,
		xAxisFinalTickWidth,
		maxLabelWidth;

	$: x = scaleLinear().domain(xDomain).range([0, chartWidth]);

	$: y = scaleLinear().domain(yDomain).range([chartHeight, 0]);

	$: hoverAreaWithDataAdded = hoverId
		? visibleAreasWithDataAdded[1].find((el) => el.areacd === hoverId)
		: undefined;*/

	$: linesArray = [
		{
			role:
				'label1' in chosenComparisonMeasureOrArea ? 'median' : chosenComparisonMeasureOrArea.role,
			data: comparisonAreaFilteredChartData
		},
		{ role: 'main', data: selectedAreaFilteredChartData }
	];
</script>

<AxisY selectedIndicator={indicator} {chartHeight} bind:yAxisMaxTickWidth {y} {yDomain}></AxisY>
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
</g>

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
