<script lang="ts">
	import AxisY from '$lib/prototype-components/data-vis/line-chart/AxisY.svelte';
	import AxisX from '$lib/prototype-components/data-vis/line-chart/AxisX.svelte';
	import Line from '$lib/prototype-components/data-vis/line-chart/Line.svelte';
	import Labels from '$lib/prototype-components/data-vis/line-chart/Labels.svelte';
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
		relatedID;

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

	$: console.log(relatedID);

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

	$: hoverAreaWithDataAdded = hoverId
		? [selectedLine, ...additionalLines, ...groupLines]
				.filter((el) => el)
				.find((el) => el.areacd === hoverId)
		: null;

	$: console.log(hoverAreaWithDataAdded);
</script>

<AxisY {indicator} {chartHeight} bind:yAxisMaxTickWidth {y} {yDomain}></AxisY>
<AxisX {timePeriodsArray} {chartHeight} {xDomain} {x} bind:xAxisFinalTickWidth></AxisX>

<g class="lines-container">
	<!-- {#each [...visibleAreasWithDataAdded[0], ...visibleAreasWithDataAdded[1]].reverse() as area, index}
		<Line {area} bind:hoverId {xDomain} {x} {y}></Line>
	{/each} -->
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
		{#each [selectedLine, ...additionalLines] as line}
			{#if !hoverAreaWithDataAdded && line && line.data.filter((el) => el.lci && el.uci).length > 0}
				<ConfidenceIntervals area={line} {xDomain} {x} {y} {customLookup}></ConfidenceIntervals>
			{/if}
		{/each}
		{#if hoverAreaWithDataAdded}
			<ConfidenceIntervals
				area={hoverAreaWithDataAdded}
				{xDomain}
				{x}
				{y}
				{customLookup}
				hover={true}
			></ConfidenceIntervals>
		{/if}
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
{#if hoverAreaWithDataAdded}
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

<Labels
	lines={[selectedLine, ...additionalLines].filter((el) => el && el.data.length > 0)}
	bind:isHoverLabelVisible
	bind:hoverId
	{hoverAreaWithDataAdded}
	bind:maxLabelWidth
	{chartWidth}
	{chartHeight}
	{y}
	{customLookup}
></Labels>
