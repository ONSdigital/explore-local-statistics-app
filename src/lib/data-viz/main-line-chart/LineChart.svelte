<script lang="ts">
	import AxisY from './axis/AxisY.svelte';
	import AxisX from './axis/AxisX.svelte';
	import Line from './Line.svelte';
	import Labels from '$lib/prototype-components/data-vis/line-chart/Labels.svelte';
	import DummyLabels from './dummy-labels/DummyLabels.svelte';
	import ConfidenceIntervals from '../shared/ConfidenceIntervals.svelte';

	import { scaleLinear } from 'd3-scale';
	import DummyLabels from './dummy-labels/DummyLabels.svelte';

	export let selectedArea,
		selectionsObject,
		indicator,
		timePeriodsArray,
		chartWidth,
		chartHeight,
		filteredChartDataSelected,
		filteredChartDataAdditionals,
		filteredChartDataAreaGroup,
		xDomain,
		yDomain,
		isHoverLabelVisible,
		hoverId,
		yAxisMaxTickWidth,
		xAxisFinalTickWidth,
		maxLabelWidth,
		customLookup,
		showConfidenceIntervals,
		additionalID,
		relatedID,
		labelSpace,
		filteredChartDataAreaGroupLatest,
		width;

	$: x = scaleLinear().domain(xDomain).range([0, chartWidth]);
	$: y = scaleLinear().domain(yDomain).range([chartHeight, 0]);

	//get data for selected area
	$: selectedLine = selectedArea
		? {
				areacd: selectedArea.areacd,
				areanm: selectedArea.areanm,
				role: 'main',
				data: filteredChartDataSelected
			}
		: null;

	//get data for any additional areas to be visualised
	$: additionalLines = selectionsObject[additionalID + '-visible']
		.map((el) => ({
			areacd: el.areacd,
			areanm: el.areanm,
			role: el.role,
			data: filteredChartDataAdditionals.filter((elm) => elm.areacd === el.areacd)
		}))
		.filter((el) => el.data.length > 0);

	//get data for group of areas to be visualised (e.g. all local authorities in London)
	$: groupLines = selectionsObject[relatedID + '-visible']
		? selectionsObject[relatedID + '-visible'].areas
				.map((el) => ({
					areacd: el.areacd,
					areanm: el.areanm,
					role: 'related',
					data: filteredChartDataAreaGroup.filter((elm) => elm.areacd === el.areacd)
				}))
				.filter((el) => el.data.length > 0)
		: [];

	//find the max and min areas from our area group based on their value in the latest time period
	$: maxGroupValueLatest = Math.max(...filteredChartDataAreaGroupLatest.map((el) => y(el.value)));
	$: minGroupValueLatest = Math.min(...filteredChartDataAreaGroupLatest.map((el) => y(el.value)));

	//find the max and min areas from our primary areas based on their value in the latest time period
	$: primaryLines = [selectedLine, ...additionalLines].filter((el) => el && el.data.length > 0);

	$: maxPrimaryValueLatest = y(Math.max(...primaryLines.map((el) => el.data[0].value)));
	$: minPrimaryValueLatest = y(Math.min(...primaryLines.map((el) => el.data[0].value)));

	//now work out if the gap between the maxGroup and maxPrimary exceeds the gap between minGroup and minPrimary, this is used to place the related areas label so that it is placed as far from other labels as possible
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
		selectionsObject[relatedID + '-visible'] && filteredChartDataAreaGroupLatest.length > 0
			? {
					areacd: 'related',
					areanm: selectionsObject[relatedID + '-visible'].label,
					role: 'related',
					labelPosition:
						chooseGroupLabelValue === 'min' ? minGroupValueLatest : maxGroupValueLatest,
					groupLabel: true
				}
			: undefined;

	//define labels - sort based on preferred label position
	$: labels = [
		...(relatedLabel ? [relatedLabel] : []),
		...primaryLines.map((el) => ({ ...el, labelPosition: y(el.data[0].value) }))
	].sort((a, b) => a.labelPosition - b.labelPosition);

	//labelArray is bound and defined in the dummylabels component - it is used to work out how much vertical and horizontal space each label will need
	let labelArray = [];

	$: fontSize = width < 600 || labels.length > 6 ? 16 : 18;

	//if the user is hovering over an area - find which area that is and grab its data
	$: hoverAreaWithDataAdded = hoverId
		? [selectedLine, ...additionalLines, ...groupLines]
				.filter((el) => el)
				.find((el) => el.areacd === hoverId)
		: null;
</script>

<AxisY {indicator} {chartHeight} bind:yAxisMaxTickWidth {y} {yDomain} {fontSize}></AxisY>
<AxisX
	{timePeriodsArray}
	{chartHeight}
	{xDomain}
	{x}
	bind:xAxisFinalTickWidth
	{fontSize}
	{chartWidth}
></AxisX>

<g class="lines-container">
	<g opacity={hoverId ? 0.2 : 1}>
		{#each groupLines as area, index}
			<Line
				{area}
				bind:hoverId
				{xDomain}
				{x}
				{y}
				{customLookup}
				background={true}
				linesCount={groupLines.length}
			></Line>
		{/each}

		{#if showConfidenceIntervals}
			{#each primaryLines as line}
				{#if !hoverAreaWithDataAdded && line && line.data.filter((el) => el.lci && el.uci).length > 0}
					<ConfidenceIntervals area={line} {xDomain} {x} {y} {customLookup}></ConfidenceIntervals>
				{/if}
			{/each}
		{/if}
		{#each additionalLines as area, index}
			<Line
				{area}
				bind:hoverId
				{xDomain}
				{x}
				{y}
				{customLookup}
				background={false}
				linesCount={groupLines.length}
			></Line>
		{/each}
		{#if selectedLine}
			<Line
				area={selectedLine}
				bind:hoverId
				{xDomain}
				{x}
				{y}
				{customLookup}
				background={false}
				linesCount={groupLines.length}
			></Line>
		{/if}
	</g>
</g>
{#if hoverAreaWithDataAdded}
	{#if showConfidenceIntervals}
		<ConfidenceIntervals area={hoverAreaWithDataAdded} {xDomain} {x} {y} {customLookup} hover={true}
		></ConfidenceIntervals>
	{/if}
	<Line
		hover={true}
		area={hoverAreaWithDataAdded}
		bind:hoverId
		{xDomain}
		{x}
		{y}
		{customLookup}
		background={false}
		linesCount={groupLines.length}
	></Line>
{/if}

<DummyLabels lines={labels} {labelSpace} bind:labelArray {fontSize}></DummyLabels>

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
		{y}
	></Labels>
{/if}
