<script lang="ts">
	import AxisX from '$lib/prototype-components/data-vis/bar-chart/AxisX.svelte';
	import Bar from '$lib/prototype-components/data-vis/bar-chart/Bar.svelte';
	import PlaceholderLabels from '$lib/prototype-components/data-vis/bar-chart/PlaceholderLabels.svelte';
	import Labels from '$lib/prototype-components/data-vis/bar-chart/Labels.svelte';

	import { scaleLinear } from 'd3-scale';
	import { areaPluralObject } from '$lib/config';

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
		dataArray,
		labelSpace,
		width,
		xAxisFinalTickWidth;

	// allow negative values to be drawn
	$: yMin = indicator.metadata.canBeNegative === 'F' ? 0 : yDomain[0];
	$: y = scaleLinear().domain([yMin, yDomain[1]]).range([0, chartWidth]);

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

	let labelRectArray = [];

	$: maxLabelWidth =
		labelRectArray.length > 0
			? Math.max(120, ...labelRectArray.map((el, i) => (i < labelRectArray.length ? el.width : 0)))
			: maxLabelWidth;

	$: dataArrayStep1 = [selectedBar, ...additionalBars, ...relatedBars]
		.filter((el) => el && el.data)
		.sort((a, b) => b.data.value - a.data.value);

	let relatedBarHeight = 20;
	$: primaryBarHeight = relatedBars.length > 200 ? 140 : relatedBars.length > 40 ? 40 : 20;
	$: yAxisPadding = relatedBars.length > 200 ? 30 : relatedBars.length > 40 ? 20 : 10;

	$: dataArrayStep2 = dataArrayStep1.map((el, index) => {
		let previousBars = dataArrayStep1.filter((elm, i) => i < index);

		return {
			...el,
			position:
				index === 0
					? yAxisPadding + (el.role === 'related' ? relatedBarHeight / 2 : primaryBarHeight / 2)
					: previousBars.length * 10 +
						yAxisPadding +
						previousBars.filter((elm) => elm.role === 'related').length * relatedBarHeight +
						previousBars.filter((elm) => elm.role != 'related').length * primaryBarHeight +
						(el.role === 'related' ? relatedBarHeight / 2 : primaryBarHeight / 2),
			height: el.role === 'related' ? relatedBarHeight : primaryBarHeight
		};
	});

	$: totalHeight =
		dataArrayStep2[dataArrayStep2.length - 1].position +
		dataArrayStep2[dataArrayStep2.length - 1].height / 2 +
		yAxisPadding;

	$: dataArrayStep3 = dataArrayStep2.map((el) => ({
		...el,
		position: el.position / (totalHeight / chartHeight),
		height: el.height / (totalHeight / chartHeight)
	}));

	$: hoverAreaWithDataAdded = hoverId
		? dataArrayStep3.filter((el) => el).find((el) => el.areacd === hoverId)
		: null;

	$: minBarHeight = Math.min(...dataArrayStep3.map((el) => el.height));

	$: primaryBars =
		minBarHeight > 25 ? dataArrayStep3 : dataArrayStep3.filter((el) => el.role != 'related');

	function findLastIndex(arr, condition) {
		const reversedArray = arr.slice().reverse();
		const reversedIndex = reversedArray.findIndex(condition);
		return reversedIndex === -1 ? -1 : arr.length - 1 - reversedIndex;
	}

	function findIndexOfLowest(arr, condition) {
		return arr.findIndex(condition);
	}

	$: maxGroupValueLatest = findLastIndex(dataArrayStep3, (el) => el.role === 'related');
	$: minGroupValueLatest = findIndexOfLowest(dataArrayStep3, (el) => el.role === 'related');

	$: maxPrimaryValueLatest = findLastIndex(dataArrayStep3, (el) => el.role != 'related');
	$: minPrimaryValueLatest = findIndexOfLowest(dataArrayStep3, (el) => el.role != 'related');

	$: chooseGroupLabelValue =
		maxGroupValueLatest < maxPrimaryValueLatest && minGroupValueLatest < minPrimaryValueLatest
			? 'min'
			: minPrimaryValueLatest < minGroupValueLatest && maxPrimaryValueLatest < maxGroupValueLatest
				? 'max'
				: Math.abs(maxGroupValueLatest - maxPrimaryValueLatest) >
					  Math.abs(minPrimaryValueLatest - minGroupValueLatest)
					? 'max'
					: 'min';

	$: relatedLabel =
		selectionsObject[relatedID + '-visible'] && filteredChartDataAreaGroup.length > 0
			? {
					areacd: 'related',
					areanm: selectionsObject[relatedID + '-visible'].label,
					role: 'related',
					labelPosition:
						chooseGroupLabelValue === 'min'
							? dataArrayStep3[minGroupValueLatest].position
							: dataArrayStep3[maxGroupValueLatest].position,
					groupLabel: true
				}
			: undefined;

	$: labels = [
		...(relatedLabel && minBarHeight <= 25 ? [relatedLabel] : []),
		...primaryBars.map((el) => ({ ...el, labelPosition: el.position }))
	].sort((a, b) => a.labelPosition - b.labelPosition);

	let labelArray = [];

	$: fontSize = width < 600 || labels.length > 12 ? 16 : 18;
</script>

<AxisX {indicator} {chartWidth} {y} yDomain={[yMin, yDomain[1]]} bind:xAxisFinalTickWidth></AxisX>

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
			bind:hoverId
		></Bar>
	</g>
{/each}

<line x1={y(0)} x2={y(0)} y1="0" y2={chartHeight} stroke="#222"></line>

<PlaceholderLabels lines={labels} {labelSpace} bind:labelArray {fontSize}></PlaceholderLabels>

{#if labels && labelArray && labelArray.every((element) => element !== null) && labelArray.length > 0}
	<Labels
		lines={labels}
		{labelArray}
		{chartHeight}
		{chartWidth}
		{customLookup}
		bind:hoverId
		{fontSize}
		bind:isHoverLabelVisible
		bind:maxLabelWidth
		{hoverAreaWithDataAdded}
		{labelSpace}
		{y}
	></Labels>
{/if}

<!-- <Labels
	{visibleAreasWithDataAdded}
	bind:isHoverLabelVisible
	bind:hoverId
	{hoverAreaWithDataAdded}
	bind:maxLabelWidth
	{chartWidth}
	{chartHeight}
	{y}
></Labels> -->

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
