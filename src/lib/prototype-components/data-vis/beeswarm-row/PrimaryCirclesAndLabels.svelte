<script lang="ts">
	import { AccurateBeeswarm } from 'accurate-beeswarm-plot';
	import { scaleLinear } from 'd3-scale';
	import { calculateLabelMidpoints } from '$lib/utils.js';
	import { chartConfigurations } from '$lib/config.js';

	import PrimaryCircle from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryCircle.svelte';
	import PrimaryLabel from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryLabel.svelte';
	import PrimaryLine from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryLine.svelte';

	export let indicator,
		comparisonAreaFilteredChartDataBeeswarm,
		selectedAreaFilteredChartDataBeeswarm,
		x,
		xDomain,
		chartWidth,
		chartHeight,
		spaceForOutliers;

	$: primaryCircleDataStep1 = [
		comparisonAreaFilteredChartDataBeeswarm,
		selectedAreaFilteredChartDataBeeswarm
	]
		.filter((el) => el)
		.map((el) => ({
			...el,
			xPosition:
				el.value < xDomain[0]
					? -spaceForOutliers / 2
					: el.value > xDomain[1]
						? chartWidth + spaceForOutliers / 2
						: x(el.value)
		}));

	$: primaryCircleDataStep2 = new AccurateBeeswarm(
		primaryCircleDataStep1,
		chartConfigurations.beeswarmRow.primaryRadius / 2,
		(d) => d.xPosition
	)
		.oneSided()
		.calculateYPositions();

	$: comparisonAreaOrMeasure = primaryCircleDataStep2.find((el) => 'role' in el.datum);
	$: selectedArea = primaryCircleDataStep2.find((el) => !('role' in el.datum));

	$: y = scaleLinear().domain([0, chartHeight]).range([0, -chartHeight]);

	let comparisonLabelWidth, selectedAreaLabelWidth;

	$: labelMidpoints = calculateLabelMidpoints(
		comparisonAreaOrMeasure ? comparisonAreaOrMeasure.x : null,
		selectedArea ? selectedArea.x : null,
		comparisonLabelWidth,
		selectedAreaLabelWidth,
		chartWidth,
		spaceForOutliers
	);
</script>

<g class="primary-circles-group" transform="translate(0,{chartHeight})">
	{#each primaryCircleDataStep2 as circle}
		<PrimaryCircle {circle} {y} outline={true}></PrimaryCircle>
	{/each}
</g>

<g class="labels-outline-group">
	{#if comparisonAreaOrMeasure}
		<g class="comparison-label-group">
			<PrimaryLine
				label={comparisonAreaOrMeasure}
				labelMidpoint={labelMidpoints.comparison}
				{y}
				{indicator}
				labelRectWidth={comparisonLabelWidth}
				{chartHeight}
			></PrimaryLine>
		</g>
	{/if}
	{#if selectedArea}
		<g class="comparison-label-group">
			<PrimaryLine
				label={selectedArea}
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
	{#each primaryCircleDataStep2 as circle}
		<PrimaryCircle {circle} {y}></PrimaryCircle>
	{/each}
</g>

<g class="labels-group">
	{#if comparisonAreaOrMeasure}
		<g class="comparison-label-group">
			<PrimaryLabel
				label={comparisonAreaOrMeasure}
				labelMidpoint={labelMidpoints.comparison}
				{y}
				{indicator}
				bind:labelRectWidth={comparisonLabelWidth}
				{chartHeight}
			></PrimaryLabel>
		</g>
	{/if}
	{#if selectedArea}
		<g class="comparison-label-group">
			<PrimaryLabel
				label={selectedArea}
				labelMidpoint={labelMidpoints.selectedArea}
				{y}
				{indicator}
				bind:labelRectWidth={selectedAreaLabelWidth}
				{chartHeight}
			></PrimaryLabel>
		</g>
	{/if}
</g>
