<script lang="ts">
	import { AccurateBeeswarm } from 'accurate-beeswarm-plot';
	import { scaleLinear } from 'd3-scale';

	import { calculateLabelMidpoints } from '$lib/util/charts/beeswarm-row/calculateLabelMidpoints';
	import { indicatorRowBeeswarmChartSettings } from '../../../routes/(app)/areas/[slug]/indicators/config';

	import ConnectingLine from './Primary/ConnectingLine.svelte';
	import Circle from './Primary/Circle.svelte';
	import ConfidenceInterval from './Primary/ConfidenceInterval.svelte';
	import Label from './Primary/Label.svelte';
	import HoverCircle from './Primary/HoverCircle.svelte';
	import HoverNameLabel from './HoverNameLabel.svelte';
	import HoverLabelAndLine from './Primary/HoverLabelAndLine.svelte';

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
		hoverAreaId,
		hoverIndicatorId,
		showConfidenceIntervals,
		width;

	//if showConfidenceIntervals is set to true then we just want to visualise the selected area, otherwise we visualise the selected area, comparison and any additonal chosen areas
	//we then calculate the position on the chart of each area based on its value, as well as the positions of its lower and upper confidence intervals
	$: primaryCircleDataStep1 = (
		showConfidenceIntervals
			? [selectedFilteredChartDataBeeswarmWithRole]
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

	//if showConfidenceIntervals is set to false, then we use James T's algorithm to place our circles so that they don't overlap too much
	$: primaryCircleDataStep2 = showConfidenceIntervals
		? primaryCircleDataStep1.map((el, i) => ({
				y: 0,
				x: el.xPosition,
				datum: el
			}))
		: [
				...new AccurateBeeswarm(
					primaryCircleDataStep1,
					indicatorRowBeeswarmChartSettings.primaryCircleRadius * 0.5,
					(d) => d.xPosition
				)
					.withTiesBrokenByArrayOrder()
					.oneSided()
					.calculateYPositions()
			].reverse();

	$: y = scaleLinear()
		.domain([0, Math.max((3 * chartHeight) / 4, ...primaryCircleDataStep2.map((el) => el.y))])
		.range([0, -chartHeight + 15]);

	//to work out how to place labels we need to distinguish between our selected and comparison areas
	$: comparison = primaryCircleDataStep2.find((el) => el.datum.priority && el.datum.role != 'main');
	$: selected = primaryCircleDataStep2.find((el) => el.datum.priority && el.datum.role === 'main');

	//comparisonLabelWidth and selectedAreaLabelWidth are bound and are calculated in the label component once the label is rendered. they are then used to calclulate where the labels should be placed
	let comparisonLabelWidth, selectedAreaLabelWidth;

	$: labelMidpoints = calculateLabelMidpoints(
		comparison ? comparison.x : null,
		selected ? selected.x : null,
		comparisonLabelWidth,
		selectedAreaLabelWidth,
		chartWidth,
		spaceForOutliers
	);

	//when an area is hovered over, if it is one of our primary visualised areas then we select it
	$: hoverArea = hoverAreaId
		? primaryCircleDataStep2.find((el) => el.datum.areacd === hoverAreaId)
		: null;
</script>

<g opacity={hoverAreaId ? 0 : 1}>
	<g class="labels-outline-group">
		{#if comparison}
			<g class="comparison-label-group">
				<ConnectingLine
					label={comparison}
					labelMidpoint={labelMidpoints.comparison}
					{y}
					labelRectWidth={comparisonLabelWidth}
					{chartHeight}
				></ConnectingLine>
			</g>
		{/if}
		{#if selected}
			<g class="comparison-label-group">
				<ConnectingLine
					label={selected}
					labelMidpoint={labelMidpoints.selectedArea}
					{y}
					labelRectWidth={selectedAreaLabelWidth}
					{chartHeight}
				></ConnectingLine>
			</g>
		{/if}
	</g>

	<g class="primary-circles-group" transform="translate(0,{chartHeight})">
		{#each primaryCircleDataStep2.filter((el) => !el.datum.priority) as circle}
			{#if !showConfidenceIntervals}
				<Circle {circle} {y} {customLookup} bind:hoverAreaId bind:hoverIndicatorId {indicator}
				></Circle>
			{/if}
		{/each}
	</g>

	<g class="primary-circles-group" transform="translate(0,{chartHeight})">
		{#each primaryCircleDataStep2.filter((el) => el.datum.priority) as circle}
			{#if showConfidenceIntervals}
				<ConfidenceInterval
					{circle}
					{y}
					{customLookup}
					bind:hoverAreaId
					bind:hoverIndicatorId
					{indicator}
				></ConfidenceInterval>
			{:else}
				<Circle {circle} {y} {customLookup} bind:hoverAreaId bind:hoverIndicatorId {indicator}
				></Circle>
			{/if}
		{/each}
	</g>

	<g class="labels-group">
		{#if comparison}
			<g class="comparison-label-group">
				<Label
					label={comparison}
					labelMidpoint={labelMidpoints.comparison}
					{y}
					{indicator}
					bind:labelRectWidth={comparisonLabelWidth}
				></Label>
			</g>
		{/if}
		{#if selected}
			<g class="comparison-label-group">
				<Label
					label={selected}
					labelMidpoint={labelMidpoints.selectedArea}
					{y}
					{indicator}
					bind:labelRectWidth={selectedAreaLabelWidth}
				></Label>
			</g>
		{/if}
	</g>
</g>

{#if hoverArea}
	<HoverLabelAndLine
		area={hoverArea}
		{y}
		{indicator}
		{chartHeight}
		{chartWidth}
		{spaceForOutliers}
		adjustmentValue={chartHeight + y(hoverArea.y)}
	></HoverLabelAndLine>
	{#if hoverIndicatorId === indicator.code}
		<HoverNameLabel
			{metadata}
			area={hoverArea}
			{y}
			{chartHeight}
			{spaceForOutliers}
			adjustmentValue={chartHeight + y(hoverArea.y)}
			{width}
		></HoverNameLabel>
	{/if}
	<HoverCircle circle={hoverArea} {y} adjustmentValue={chartHeight + y(hoverArea.y)}></HoverCircle>
{/if}
