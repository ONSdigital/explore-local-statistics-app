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

	$: relatedBars = selectionsObject[relatedID + '-visible']
		? selectionsObject[relatedID + '-visible'].areas.map((el) => ({
				areacd: el.areacd,
				areanm: el.areanm,
				role: 'related',
				data: filteredChartDataAreaGroup.find((elm) => elm.areacd === el.areacd)
			}))
		: [];

	$: console.log(relatedBars);

	//$: data = .sort((a, b) => b.data[0].value - a.data[0].value);

	let labelRectArray = [];

	$: maxLabelWidth =
		labelRectArray.length > 0
			? Math.max(120, ...labelRectArray.map((el, i) => (i < labelRectArray.length ? el.width : 0)))
			: maxLabelWidth;

	$: dataArrayStep1 = [selectedBar, ...additionalBars, ...relatedBars]
		.filter((el) => el && el.data)
		.sort((a, b) => b.data.value - a.data.value);

	let relatedBarHeight = 20;
	$: primaryBarHeight = relatedBars.length > 200 ? 100 : 20;

	$: dataArrayStep2 = dataArrayStep1.map((el, index) => {
		let previousBars = dataArrayStep1.filter((elm, i) => i < index);

		return {
			...el,
			position:
				index === 0
					? 10 + (el.role === 'related' ? relatedBarHeight / 2 : primaryBarHeight / 2)
					: previousBars.length * 10 +
						10 +
						previousBars.filter((elm) => elm.role === 'related').length * relatedBarHeight +
						previousBars.filter((elm) => elm.role != 'related').length * primaryBarHeight +
						(el.role === 'related' ? relatedBarHeight / 2 : primaryBarHeight / 2),
			height: el.role === 'related' ? relatedBarHeight : primaryBarHeight
		};
	});

	$: totalHeight =
		dataArrayStep2[dataArrayStep2.length - 1].position +
		dataArrayStep2[dataArrayStep2.length - 1].height / 2 +
		10;

	$: dataArrayStep3 = dataArrayStep2.map((el) => ({
		...el,
		position: el.position / (totalHeight / chartHeight),
		height: el.height / (totalHeight / chartHeight)
	}));

	$: console.log(dataArrayStep2);
</script>

<AxisX {indicator} {chartWidth} {y} yDomain={[0, yDomain[1]]}></AxisX>

<line x1="0" x2="0" y1="0" y2={chartHeight} stroke="#222"></line>

{#each dataArrayStep3 as area, index}
	<g transform="translate(0,{area.position})">
		<Bar
			{area}
			{y}
			{chartHeight}
			{totalHeight}
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
