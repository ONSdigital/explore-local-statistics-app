<script lang="ts">
	import BackgroundCircle from '$lib/prototype-components/data-vis/beeswarm-row/BackgroundCircle.svelte';
	import HoverCircle from '$lib/prototype-components/data-vis/beeswarm-row/HoverCircle.svelte';
	import HoverLabel from '$lib/prototype-components/data-vis/beeswarm-row/HoverLabel.svelte';
	import HoverLabelName from '$lib/prototype-components/data-vis/beeswarm-row/HoverLabelName.svelte';

	import { calculateBackgroundCirclesRadius } from '$lib/utils.js';
	import { chartConfigurations } from '$lib/config.js';
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
		hoverIndicatorId;

	$: backgroundChartDataBeeswarm = filteredChartDataBeeswarm.filter(
		(el) =>
			selectionsObject['related-rows-visible'].codes.includes(el.areacd) &&
			![
				selectedArea.areacd,
				selectionsObject['areas-rows-comparison-chosen'],
				...selectionsObject['areas-rows-additional-chosen']
			].includes(el.areacd)
	);

	$: backgroundRadius = calculateBackgroundCirclesRadius(
		backgroundChartDataBeeswarm.length,
		chartConfigurations.beeswarmRow.backgroundRadius
	);

	$: backgroundCircleDataStep1 = backgroundChartDataBeeswarm.map((el) => ({
		...el,
		xPosition:
			el.value < xDomain[0]
				? -spaceForOutliers / 2
				: el.value > xDomain[1]
					? chartWidth + spaceForOutliers / 2
					: x(el.value)
	}));

	$: backgroundCircleDataStep2 = new AccurateBeeswarm(
		backgroundCircleDataStep1,
		backgroundRadius / 2,
		(d) => d.xPosition
	)
		.oneSided()
		.calculateYPositions();

	$: yDomain = [0, Math.max(chartHeight, ...backgroundCircleDataStep2.map((el) => el.y))];

	$: y = scaleLinear().domain(yDomain).range([chartHeight, 0]);

	$: hoverArea = hoverAreaId
		? backgroundCircleDataStep2.find((el) => el.datum.areacd === hoverAreaId)
		: null;

	/*export let metadata,
		backgroundChartDataBeeswarm,
		x,
		xDomain,
		chartWidth,
		chartHeight,
		spaceForOutliers,
		indicator,
		hoverId,
		hoverIndicatorId;

	$: backgroundRadius = calculateBackgroundCirclesRadius(
		backgroundChartDataBeeswarm.length,
		chartConfigurations.beeswarmRow.backgroundRadius
	);

	$: backgroundCircleDataStep1 = backgroundChartDataBeeswarm.map((el) => ({
		...el,
		xPosition:
			el.value < xDomain[0]
				? -spaceForOutliers / 2
				: el.value > xDomain[1]
					? chartWidth + spaceForOutliers / 2
					: x(el.value)
	}));

	$: backgroundCircleDataStep2 = new AccurateBeeswarm(
		backgroundCircleDataStep1,
		backgroundRadius / 2,
		(d) => d.xPosition
	)
		.oneSided()
		.calculateYPositions();

	$: yDomain = [0, Math.max(chartHeight, ...backgroundCircleDataStep2.map((el) => el.y))];

	$: y = scaleLinear().domain(yDomain).range([chartHeight, 0]);

	$: hoverArea = hoverId
		? backgroundCircleDataStep2.find((el) => el.datum.areacd === hoverId)
		: null;*/
</script>

<g class="background-circles-group" opacity="0.5">
	{#each backgroundCircleDataStep2 as circle}
		<BackgroundCircle
			{circle}
			{y}
			{backgroundRadius}
			{indicator}
			bind:hoverAreaId
			bind:hoverIndicatorId
		></BackgroundCircle>
	{/each}
</g>

{#if hoverArea}
	<HoverCircle circle={hoverArea} {y} outline={true}></HoverCircle>
	<HoverLabel area={hoverArea} {y} {indicator} {chartHeight} {chartWidth} {spaceForOutliers}
	></HoverLabel>
	{#if hoverIndicatorId === indicator.code}
		<HoverLabelName {metadata} area={hoverArea} {y} {chartHeight} {chartWidth} {spaceForOutliers}
		></HoverLabelName>
	{/if}
	<HoverCircle circle={hoverArea} {y} outline={false}></HoverCircle>
{/if}
