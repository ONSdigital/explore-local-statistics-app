<script lang="ts">
	import AxisX from '$lib/prototype-components/data-vis/bar-chart/AxisX.svelte';
	import Bar from '$lib/prototype-components/data-vis/bar-chart/Bar.svelte';

	import { scaleLinear } from 'd3-scale';

	export let indicator,
		latestPeriod,
		chartWidth,
		chartHeight,
		yDomain,
		isHoverLabelVisible,
		hoverId,
		hoverAreaWithDataAdded,
		maxLabelWidth,
		filteredChartDataSelected,
		filteredChartDataAdditionals,
		filteredChartDataAreaGroup,
		selectionsObject,
		selectedArea,
		customLookup,
		showConfidenceIntervals,
		additionalID,
		relatedID,
		dataArray;

	$: y = scaleLinear().domain([0, yDomain[1]]).range([0, chartWidth]);

	$: selectedBar = selectedArea
		? {
				areacd: selectedArea.areacd,
				areanm: selectedArea.areanm,
				role: 'main',
				data: filteredChartDataSelected[0]
			}
		: null;

	$: additionalBars = selectionsObject[additionalID + '-visible']
		.map((el) => ({
			areacd: el.areacd,
			areanm: el.areanm,
			role: el.role,
			data: filteredChartDataAdditionals.find((elm) => elm.areacd === el.areacd)
		}))
		.filter((el) => el.data);

	//$: data = .sort((a, b) => b.data[0].value - a.data[0].value);

	let labelRectArray = [];

	$: maxLabelWidth =
		labelRectArray.length > 0
			? Math.max(120, ...labelRectArray.map((el, i) => (i < labelRectArray.length ? el.width : 0)))
			: maxLabelWidth;

	$: dataArray = [selectedBar, ...additionalBars]
		.filter((el) => el && el.data)
		.sort((a, b) => b.data.value - a.data.value);
</script>

<AxisX {indicator} {chartWidth} {y} yDomain={[0, yDomain[1]]}></AxisX>

<line x1="0" x2="0" y1="0" y2={chartHeight} stroke="#222"></line>

{#each dataArray as area, index}
	<g transform="translate(0,{(index + 1) * 50})">
		<Bar
			{area}
			{y}
			{chartHeight}
			bind:labelBBox={labelRectArray[index]}
			{customLookup}
			{showConfidenceIntervals}
		></Bar>
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
