<script lang="ts">
	import { AccurateBeeswarm } from 'accurate-beeswarm-plot';
	import { scaleLinear } from 'd3-scale';
	import { calculateLabelMidpoints } from '$lib/utils.js';
	import { chartConfigurations } from '$lib/config.js';

	import PrimaryCircle from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryCircle.svelte';
	import PrimaryLabel from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryLabel.svelte';
	import PrimaryLine from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryLine.svelte';

	export let indicator,
		comparisonFilteredChartDataBeeswarmWithRole,
		selectedFilteredChartDataBeeswarmWithRole,
		additionalFilteredChartDataBeeswarm,
		x,
		xDomain,
		chartWidth,
		chartHeight,
		spaceForOutliers,
		customLookup,
		selectionsObject;

	$: primaryCircleDataStep1 = [
		selectedFilteredChartDataBeeswarmWithRole,
		comparisonFilteredChartDataBeeswarmWithRole,
		...additionalFilteredChartDataBeeswarm
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

	$: primaryCircleDataStep2 = [
		...new AccurateBeeswarm(
			primaryCircleDataStep1,
			chartConfigurations.beeswarmRow.primaryRadius / 2,
			(d) => d.xPosition
		)
			.oneSided()
			.calculateYPositions()
	].reverse();

	//$: console.log(primaryCircleDataStep2);

	$: comparison = primaryCircleDataStep2.find((el) => el.datum.priority && el.datum.role != 'main');
	$: selected = primaryCircleDataStep2.find((el) => el.datum.priority && el.datum.role === 'main');

	$: y = scaleLinear()
		.domain([0, Math.max(chartHeight, ...primaryCircleDataStep2.map((el) => el.y))])
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
</script>

<g class="primary-circles-group" transform="translate(0,{chartHeight})">
	{#each primaryCircleDataStep2 as circle}
		<PrimaryCircle {circle} {y} outline={true} {customLookup}></PrimaryCircle>
	{/each}
</g>

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
	{#each primaryCircleDataStep2 as circle}
		<PrimaryCircle {circle} {y} {customLookup}></PrimaryCircle>
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
