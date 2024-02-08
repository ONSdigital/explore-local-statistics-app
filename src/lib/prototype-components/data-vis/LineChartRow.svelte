<script lang="ts">
	import AxisY from '$lib/prototype-components/data-vis/line-chart-row/AxisY.svelte';
	import AxisX from '$lib/prototype-components/data-vis/line-chart-row/AxisX.svelte';
	import Line from '$lib/prototype-components/data-vis/line-chart-row/Line.svelte';
	import Labels from '$lib/prototype-components/data-vis/line-chart/Labels.svelte';
	import ConfidenceIntervals from '$lib/prototype-components/data-vis/line-chart/ConfidenceIntervals.svelte';

	import { scaleLinear } from 'd3-scale';

	export let selectedIndicator,
		timePeriodsArray,
		chartWidth,
		chartHeight,
		visibleAreasWithDataAdded,
		xDomain,
		yDomain,
		isHoverLabelVisible,
		hoverId,
		hoverAreaWithDataAdded,
		yAxisMaxTickWidth,
		xAxisFinalTickWidth,
		maxLabelWidth;

	$: x = scaleLinear().domain(xDomain).range([0, chartWidth]);

	$: y = scaleLinear().domain(yDomain).range([chartHeight, 0]);

	$: hoverAreaWithDataAdded = hoverId
		? visibleAreasWithDataAdded[1].find((el) => el.areacd === hoverId)
		: undefined;
</script>

<AxisY {selectedIndicator} {chartHeight} bind:yAxisMaxTickWidth {y} {yDomain}></AxisY>
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
