<script lang="ts">
	import AxisY from '$lib/prototype-components/data-vis/line-chart/AxisY.svelte';
	import AxisX from '$lib/prototype-components/data-vis/line-chart/AxisX.svelte';
	import Line from '$lib/prototype-components/data-vis/line-chart/Line.svelte';
	import Labels from '$lib/prototype-components/data-vis/line-chart/Labels.svelte';
	import PlaceholderLabels from '$lib/prototype-components/data-vis/line-chart/PlaceholderLabels.svelte';
	import ConfidenceIntervals from '$lib/prototype-components/data-vis/line-chart/ConfidenceIntervals.svelte';

	import { scaleLinear } from 'd3-scale';

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

	/*$: hoverAreaWithDataAdded = hoverId
		? visibleAreasWithDataAdded[1].find((el) => el.areacd === hoverId)
		: undefined;*/

	$: selectedLine = selectedArea
		? {
				areacd: selectedArea.areacd,
				areanm: selectedArea.areanm,
				role: 'main',
				data: filteredChartDataSelected
			}
		: null;

	$: additionalLines = selectionsObject[additionalID + '-visible']
		.map((el) => ({
			areacd: el.areacd,
			areanm: el.areanm,
			role: el.role,
			data: filteredChartDataAdditionals.filter((elm) => elm.areacd === el.areacd)
		}))
		.filter((el) => el.data.length > 0);

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

	$: console.log(groupLines);

	$: hoverAreaWithDataAdded = hoverId
		? [selectedLine, ...additionalLines, ...groupLines]
				.filter((el) => el)
				.find((el) => el.areacd === hoverId)
		: null;

	$: primaryLines = [selectedLine, ...additionalLines].filter((el) => el && el.data.length > 0);

	$: maxGroupValueLatest = Math.max(...filteredChartDataAreaGroupLatest.map((el) => y(el.value)));
	$: minGroupValueLatest = Math.min(...filteredChartDataAreaGroupLatest.map((el) => y(el.value)));

	$: maxPrimaryValueLatest = y(Math.max(...primaryLines.map((el) => el.data[0].value)));
	$: minPrimaryValueLatest = y(Math.min(...primaryLines.map((el) => el.data[0].value)));

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
					labelPosition: chooseGroupLabelValue === 'min' ? minGroupValueLatest : maxGroupValueLatest
				}
			: undefined;

	$: labels = [
		...(relatedLabel ? [relatedLabel] : []),
		...primaryLines.map((el) => ({ ...el, labelPosition: y(el.data[0].value) }))
	].sort((a, b) => a.labelPosition - b.labelPosition);

	let labelArray = [];

	$: fontSize = width < 600 || labels.length > 6 ? 16 : 18;
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
	<!-- {#each [...visibleAreasWithDataAdded[0], ...visibleAreasWithDataAdded[1]].reverse() as area, index}
		<Line {area} bind:hoverId {xDomain} {x} {y}></Line>
	{/each} -->
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
	lines={[selectedLine, ...additionalLines].filter((el) => el && el.data.length > 0)}
	bind:isHoverLabelVisible
	bind:hoverId
	{hoverAreaWithDataAdded}
	bind:maxLabelWidth
	{chartWidth}
	{chartHeight}
	{y}
	{customLookup}
></Labels> -->
