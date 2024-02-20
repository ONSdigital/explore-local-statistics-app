<script lang="ts">
	import AxisX from '$lib/prototype-components/data-vis/bar-chart/AxisX.svelte';
	import Bar from '$lib/prototype-components/data-vis/bar-chart/Bar.svelte';

	import { scaleLinear } from 'd3-scale';

	export let selectedIndicator,
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

	//$: x = scaleLinear().domain(xDomain).range([0, chartWidth]);

	$: y = scaleLinear().domain([0, yDomain[1]]).range([0, chartWidth]);

	/*$: hoverAreaWithDataAdded = hoverId
		? visibleAreasWithDataAdded[1].find((el) => el.areacd === hoverId)
		: undefined;*/

	$: data = [...visibleAreasWithDataAdded[0], ...visibleAreasWithDataAdded[1]].sort(
		(a, b) => b.data[0].value - a.data[0].value
	);

	let labelRectArray = [];

	$: maxLabelWidth =
		labelRectArray.length > 0
			? Math.max(120, ...labelRectArray.map((el, i) => (i < labelRectArray.length ? el.width : 0)))
			: maxLabelWidth;
</script>

<AxisX {selectedIndicator} {chartWidth} {y} yDomain={[0, yDomain[1]]}></AxisX>

<line x1="0" x2="0" y1="0" y2={chartHeight} stroke="#222"></line>

{#each data as area, index}
	<g transform="translate(0,{50 + (chartHeight - 100) * (index / (data.length - 1))})">
		<Bar {area} {data} {y} {chartHeight} bind:labelBBox={labelRectArray[index]}></Bar>
	</g>
{/each}

<!-- <AxisY {selectedIndicator} {chartHeight} bind:yAxisMaxTickWidth {y} {yDomain}></AxisY>
<AxisX {timePeriodsArray} {chartHeight} {xDomain} {x} bind:xAxisFinalTickWidth></AxisX>

{#if hoverId}
	<ConfidenceIntervals
		area={hoverAreaWithDataAdded
			? hoverAreaWithDataAdded
			: visibleAreasWithDataAdded[0].find((el) => el.areacd === hoverId)}
		{xDomain}
		{x}
		{y}
	></ConfidenceIntervals>
{/if}

<g class="lines-container">
	{#each [...visibleAreasWithDataAdded[0], ...visibleAreasWithDataAdded[1]].reverse() as area, index}
		<Line {area} bind:hoverId {xDomain} {x} {y}></Line>
	{/each}
</g>

<Labels
	{visibleAreasWithDataAdded}
	bind:isHoverLabelVisible
	bind:hoverId
	{hoverAreaWithDataAdded}
	bind:maxLabelWidth
	{chartWidth}
	{chartHeight}
	{y}
></Labels> -->
