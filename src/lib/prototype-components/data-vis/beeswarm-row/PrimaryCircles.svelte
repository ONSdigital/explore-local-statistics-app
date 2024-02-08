<script lang="ts">
	import { AccurateBeeswarm } from 'accurate-beeswarm-plot';
	import { scaleLinear } from 'd3-scale';

	import PrimaryCircle from '$lib/prototype-components/data-vis/beeswarm-row/PrimaryCircle.svelte';

	export let indicator,
		combinedSelectableAreaTypesObject,
		filteredChartDataForVisibleAreas,
		x,
		xDomain,
		chartWidth,
		chartHeight,
		spaceForOutliers,
		medianLabelRect,
		selectedIndicatorCalculations;

	$: primaryCircleDataStep1 = filteredChartDataForVisibleAreas.map((el) => ({
		...el,
		xPosition:
			el.value < xDomain[0]
				? -spaceForOutliers / 2
				: el.value > xDomain[1]
					? chartWidth + spaceForOutliers / 2
					: x(el.value),
		role: combinedSelectableAreaTypesObject.visible.primaryAreas.find(
			(elm) => elm.areacd === el.areacd
		).role
	}));

	$: primaryCircleDataStep2 = new AccurateBeeswarm(primaryCircleDataStep1, 6, (d) => d.xPosition)
		.oneSided()
		.calculateYPositions();

	$: y = scaleLinear().domain([0, chartHeight]).range([chartHeight, 0]);
</script>

<g class="primary-circles-group">
	{#each primaryCircleDataStep2 as circle, index}
		<PrimaryCircle {circle} {x} {y} {medianLabelRect} {indicator} {selectedIndicatorCalculations}
		></PrimaryCircle>
	{/each}
</g>
