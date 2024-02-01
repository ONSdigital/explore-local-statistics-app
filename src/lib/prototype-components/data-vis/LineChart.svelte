<script lang="ts">
	import AxisY from '$lib/prototype-components/data-vis/line-chart/AxisY.svelte';
	import AxisX from '$lib/prototype-components/data-vis/line-chart/AxisX.svelte';
	import Line from '$lib/prototype-components/data-vis/line-chart/Line.svelte';
	import Labels from '$lib/prototype-components/data-vis/line-chart/Labels.svelte';

	import { scaleLinear } from 'd3-scale';

	export let selectedIndicator,
		timePeriodsArray,
		chartWidth,
		chartHeight,
		visibleAreasWithDataAdded,
		xDomain,
		yDomain,
		hoverId,
		yAxisMaxTickWidth,
		xAxisFinalTickWidth,
		maxLabelWidth;

	$: x = scaleLinear().domain(xDomain).range([0, chartWidth]);

	$: y = scaleLinear().domain(yDomain).range([chartHeight, 0]);
</script>

<rect width={chartWidth} height={chartHeight} fill="black" opacity="0.03"></rect>

<AxisY {selectedIndicator} {chartHeight} bind:yAxisMaxTickWidth {y} {yDomain}></AxisY>
<AxisX {timePeriodsArray} {chartHeight} {xDomain} {x} bind:xAxisFinalTickWidth></AxisX>

<g class="lines-container">
	{#each [...visibleAreasWithDataAdded[0], ...visibleAreasWithDataAdded[1]].reverse() as area, index}
		<Line {area} bind:hoverId {xDomain} {x} {y}></Line>
	{/each}
</g>

<Labels {visibleAreasWithDataAdded} bind:hoverId bind:maxLabelWidth {chartWidth} {chartHeight} {y}
></Labels>
