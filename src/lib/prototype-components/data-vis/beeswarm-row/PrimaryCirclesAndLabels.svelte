<script lang="ts">
	import { AccurateBeeswarm } from 'accurate-beeswarm-plot';
	import { scaleLinear } from 'd3-scale';
	import { calculateLabelMidpoints, doLinesInOneDSpaceOverlap } from '$lib/utils.js';
	import { chartConfigurations } from '$lib/config.js';

	import PrimaryCircle from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryCircle.svelte';
	import PrimaryLabel from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryLabel.svelte';
	import PrimaryLine from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryLine.svelte';
	import HoverCircle from '$lib/prototype-components/data-vis/beeswarm-row/HoverCircle.svelte';
	import HoverLabel from '$lib/prototype-components/data-vis/beeswarm-row/HoverLabel.svelte';
	import HoverLabelName from '$lib/prototype-components/data-vis/beeswarm-row/HoverLabelName.svelte';

	export let metadata,
		indicator,
		comparisonFilteredChartDataBeeswarmWithRole,
		selectedFilteredChartDataBeeswarmWithRole,
		additionalFilteredChartDataBeeswarm,
		x,
		xDomain,
		chartWidth,
		chartHeight,
		spaceForOutliers,
		customLookup,
		selectionsObject,
		hoverAreaId,
		hoverIndicatorId,
		showConfidenceIntervals;

	$: primaryCircleDataStep1 = (
		showConfidenceIntervals
			? [selectedFilteredChartDataBeeswarmWithRole, comparisonFilteredChartDataBeeswarmWithRole]
			: [
					selectedFilteredChartDataBeeswarmWithRole,
					comparisonFilteredChartDataBeeswarmWithRole,
					...additionalFilteredChartDataBeeswarm
				]
	)
		.filter((el) => el)
		.map((el) => ({
			...el,
			xPosition:
				el.value < xDomain[0]
					? -spaceForOutliers / 2
					: el.value > xDomain[1]
						? chartWidth + spaceForOutliers / 2
						: x(el.value),
			lciXPosition: !el.lci
				? null
				: el.lci < xDomain[0]
					? -spaceForOutliers / 2
					: el.lci > xDomain[1]
						? chartWidth + spaceForOutliers / 2
						: x(el.lci),
			uciXPosition: !el.uci
				? null
				: el.uci < xDomain[0]
					? -spaceForOutliers / 2
					: el.uci > xDomain[1]
						? chartWidth + spaceForOutliers / 2
						: x(el.uci)
		}));

	$: doConfidenceIntervalsOverlap =
		primaryCircleDataStep1.length === 2 && showConfidenceIntervals
			? doLinesInOneDSpaceOverlap(
					primaryCircleDataStep1[0][
						primaryCircleDataStep1[0].lciXPosition ? 'lciXPosition' : 'xPosition'
					] - 10,
					primaryCircleDataStep1[0][
						primaryCircleDataStep1[0].uciXPosition ? 'uciXPosition' : 'xPosition'
					] + 10,
					primaryCircleDataStep1[1][
						primaryCircleDataStep1[1].lciXPosition ? 'lciXPosition' : 'xPosition'
					] - 10,
					primaryCircleDataStep1[1][
						primaryCircleDataStep1[1].uciXPosition ? 'uciXPosition' : 'xPosition'
					] + 10
				)
			: false;

	$: primaryCircleDataStep2 = showConfidenceIntervals
		? primaryCircleDataStep1.map((el, i) => ({
				y: doConfidenceIntervalsOverlap ? chartConfigurations.beeswarmRow.primaryRadius * 2 * i : 0,
				x: el.xPosition,
				datum: el
			}))
		: [
				...new AccurateBeeswarm(
					primaryCircleDataStep1,
					chartConfigurations.beeswarmRow.primaryRadius * 0.5,
					(d) => d.xPosition
				)
					.oneSided()
					.calculateYPositions()
			].reverse();

	$: comparison = primaryCircleDataStep2.find((el) => el.datum.priority && el.datum.role != 'main');
	$: selected = primaryCircleDataStep2.find((el) => el.datum.priority && el.datum.role === 'main');

	$: y = scaleLinear()
		.domain([0, Math.max((3 * chartHeight) / 4, ...primaryCircleDataStep2.map((el) => el.y))])
		.range([0, -chartHeight + 15]);

	let comparisonLabelWidth, selectedAreaLabelWidth;

	$: labelMidpoints = calculateLabelMidpoints(
		comparison ? comparison.x : null,
		selected ? selected.x : null,
		comparisonLabelWidth,
		selectedAreaLabelWidth,
		chartWidth,
		spaceForOutliers
	);

	$: hoverArea = hoverAreaId
		? primaryCircleDataStep2.find((el) => el.datum.areacd === hoverAreaId)
		: null;
</script>

<!-- <g class="primary-circles-group" transform="translate(0,{chartHeight})">
	{#each primaryCircleDataStep2 as circle}
		<PrimaryCircle {circle} {y} outline={true} {customLookup}></PrimaryCircle>
	{/each}
</g> -->

<g opacity={hoverAreaId ? 0 : 1}>
	<g class="labels-outline-group">
		{#if comparison}
			<g class="comparison-label-group">
				<PrimaryLine
					label={comparison}
					labelMidpoint={labelMidpoints.comparison}
					{y}
					{indicator}
					labelRectWidth={comparisonLabelWidth}
					{chartHeight}
				></PrimaryLine>
			</g>
		{/if}
		{#if selected}
			<g class="comparison-label-group">
				<PrimaryLine
					label={selected}
					labelMidpoint={labelMidpoints.selectedArea}
					{y}
					{indicator}
					labelRectWidth={selectedAreaLabelWidth}
					{chartHeight}
				></PrimaryLine>
			</g>
		{/if}
	</g>

	<g class="primary-circles-group" transform="translate(0,{chartHeight})">
		{#each primaryCircleDataStep2.filter((el) => !el.datum.priority) as circle}
			<PrimaryCircle {circle} {y} {customLookup} bind:hoverAreaId bind:hoverIndicatorId {indicator}
			></PrimaryCircle>
		{/each}
	</g>

	<g class="primary-circles-group" transform="translate(0,{chartHeight})">
		{#each primaryCircleDataStep2.filter((el) => el.datum.priority) as circle}
			<PrimaryCircle
				{circle}
				{y}
				{customLookup}
				bind:hoverAreaId
				bind:hoverIndicatorId
				{indicator}
				{showConfidenceIntervals}
			></PrimaryCircle>
		{/each}
	</g>

	<g class="labels-group">
		{#if comparison}
			<g class="comparison-label-group">
				<PrimaryLabel
					label={comparison}
					labelMidpoint={labelMidpoints.comparison}
					{y}
					{indicator}
					bind:labelRectWidth={comparisonLabelWidth}
					{chartHeight}
				></PrimaryLabel>
			</g>
		{/if}
		{#if selected}
			<g class="comparison-label-group">
				<PrimaryLabel
					label={selected}
					labelMidpoint={labelMidpoints.selectedArea}
					{y}
					{indicator}
					bind:labelRectWidth={selectedAreaLabelWidth}
					{chartHeight}
				></PrimaryLabel>
			</g>
		{/if}
	</g>
</g>

{#if hoverArea}
	<HoverLabel
		area={hoverArea}
		{y}
		{indicator}
		{chartHeight}
		{chartWidth}
		{spaceForOutliers}
		priority={true}
		adjustmentValue={chartHeight + y(hoverArea.y)}
	></HoverLabel>
	{#if hoverIndicatorId === indicator.code}
		<HoverLabelName
			{metadata}
			area={hoverArea}
			{y}
			{chartHeight}
			{chartWidth}
			{spaceForOutliers}
			adjustmentValue={chartHeight + y(hoverArea.y)}
		></HoverLabelName>
	{/if}
	<HoverCircle
		circle={hoverArea}
		{y}
		outline="{false}}"
		adjustmentValue={chartHeight + y(hoverArea.y)}
	></HoverCircle>
{/if}
