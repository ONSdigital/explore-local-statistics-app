<script lang="ts">
	import BackgroundCircle from '$lib/prototype-components/data-vis/beeswarm-row/BackgroundCircle.svelte';

	import { AccurateBeeswarm } from 'accurate-beeswarm-plot';
	import { scaleLinear } from 'd3-scale';

	export let indicator,
		combinedSelectableAreaTypesObject,
		filteredBackgroundChartData,
		x,
		xDomain,
		chartHeight,
		chartWidth,
		spaceForOutliers;

	$: backgroundCircleDataStep1 = filteredBackgroundChartData.map((el) => ({
		...el,
		xPosition:
			el.value < xDomain[0]
				? -spaceForOutliers / 2
				: el.value > xDomain[1]
					? chartWidth + spaceForOutliers / 2
					: x(el.value),
		role: combinedSelectableAreaTypesObject.sameRegion.codes.includes(el.areacd)
			? 'sameRegion'
			: combinedSelectableAreaTypesObject.similar.codes.includes(el.areacd)
				? 'similar'
				: null
	}));

	$: backgroundCircleDataStep2 = new AccurateBeeswarm(
		backgroundCircleDataStep1,
		5,
		(d) => d.xPosition
	)
		.oneSided()
		.calculateYPositions();

	$: yDomain = [0, Math.max(...backgroundCircleDataStep2.map((el) => el.y))];

	$: y = scaleLinear().domain(yDomain).range([chartHeight, 0]);

	$: sameRegionCircles = combinedSelectableAreaTypesObject.visible.relatedAreas.some(
		(el) => el.role === 'sameRegion'
	)
		? backgroundCircleDataStep2.filter((el) => el.datum.role === 'sameRegion')
		: [];

	$: similarCircles = combinedSelectableAreaTypesObject.visible.relatedAreas.some(
		(el) => el.role === 'similar'
	)
		? backgroundCircleDataStep2.filter((el) => el.datum.role === 'similar')
		: [];

	$: allOtherCircles = backgroundCircleDataStep2.filter(
		(el) => !combinedSelectableAreaTypesObject.visible.relatedCodes.includes(el.datum.areacd)
	);
</script>

<g class="background-circles-group" opacity="0.5">
	{#each allOtherCircles as circle, index}
		<BackgroundCircle {circle} {y} arrayLength={backgroundCircleDataStep2.length} {index}
		></BackgroundCircle>
	{/each}
</g>
<g class="same-region-circles-group">
	{#if sameRegionCircles.length > 0}
		{#each sameRegionCircles as circle, index}
			<BackgroundCircle {circle} {y}></BackgroundCircle>
		{/each}
	{/if}
</g>
<g class="similar-circles-group">
	{#if similarCircles.length > 0}
		{#each similarCircles as circle, index}
			<BackgroundCircle {circle} {y}></BackgroundCircle>
		{/each}
	{/if}
</g>
