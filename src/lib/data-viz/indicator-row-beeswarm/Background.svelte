<script lang="ts">
	import Circle from './Background/Circle.svelte';
	import HoverValueLabel from './Background/HoverValueLabel.svelte';
	import HoverNameLabel from './HoverNameLabel.svelte';

	import { calculateBackgroundCirclesRadius } from '$lib/util/charts/beeswarm-row/calculateBackgroundCirclesRadius';
	import { indicatorRowBeeswarmChartSettings } from '../../../routes/(app)/areas/[slug]/indicators/config';

	import { AccurateBeeswarm } from 'accurate-beeswarm-plot';
	import { scaleLinear } from 'd3-scale';

	export let metadata,
		x,
		xDomain,
		chartWidth,
		chartHeight,
		spaceForOutliers,
		indicator,
		filteredChartDataBeeswarm,
		selectionsObject,
		selectedArea,
		hoverAreaId,
		hoverIndicatorId,
		width;

	//filter chart data to just get data for areas belonging to our 'group' (e.g. all other local authorities, demographically similar), then calculate the x-positions for each area
	$: backgroundCircleDataStep1 = filteredChartDataBeeswarm
		.filter(
			(el) =>
				selectionsObject['related-rows-visible'].codes.includes(el.areacd) &&
				![
					selectedArea.areacd,
					selectionsObject['areas-rows-comparison-chosen'],
					...selectionsObject['areas-rows-additional-chosen']
				].includes(el.areacd)
		)
		.map((el) => ({
			...el,
			xPosition:
				el.value < xDomain[0]
					? -spaceForOutliers / 2
					: el.value > xDomain[1]
						? chartWidth + spaceForOutliers / 2
						: x(el.value)
		}));

	//the radius of background circles is set based on the number of areas - fewer areas equals bigger circles
	$: backgroundRadius = calculateBackgroundCirclesRadius(
		backgroundCircleDataStep1.length,
		indicatorRowBeeswarmChartSettings.backgroundCircleRadius
	);

	//use James T's algorithm to calcluate the intial y-positions for each area, this is based on positioning any two circles at least r/2 away from each other
	$: backgroundCircleDataStep2 = new AccurateBeeswarm(
		backgroundCircleDataStep1,
		backgroundRadius / 2,
		(d) => d.xPosition
	)
		.oneSided()
		.calculateYPositions();

	//if the highest placed y-position determined by the algorithm exceeds the height of the chart, we set the yDomain to squish all the positions down so that all the circles just fit on the chart. if the highest placed y-positions is below the height of the chart then we just use those initial positions.
	$: yDomain = [0, Math.max(chartHeight, ...backgroundCircleDataStep2.map((el) => el.y))];

	$: y = scaleLinear().domain(yDomain).range([chartHeight, 0]);

	//when a circle is hovered over on any of the beeswarm charts, hoverAreaId will become an area code and we then filter to find the data for that hovered area
	$: hoverArea = hoverAreaId
		? backgroundCircleDataStep2.find((el) => el.datum.areacd === hoverAreaId)
		: null;
</script>

<g class="background-circles-group" opacity="0.5">
	{#each backgroundCircleDataStep2 as circle}
		<Circle
			{circle}
			{y}
			radius={backgroundRadius}
			{indicator}
			bind:hoverAreaId
			bind:hoverIndicatorId
			hover={false}
		></Circle>
	{/each}
</g>

{#if hoverArea}
	<HoverValueLabel area={hoverArea} {y} {indicator} {chartHeight} {chartWidth} {spaceForOutliers}
	></HoverValueLabel>
	{#if hoverIndicatorId === indicator.code}
		<HoverNameLabel {metadata} area={hoverArea} {y} {spaceForOutliers} {width}></HoverNameLabel>
	{/if}
	<Circle
		circle={hoverArea}
		{y}
		hover={true}
		radius={indicatorRowBeeswarmChartSettings.primaryCircleRadius}
	></Circle>
{/if}
