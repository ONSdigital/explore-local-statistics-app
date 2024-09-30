<script lang="ts">
	import LineChartRow from '$lib/prototype-components/data-vis/LineChartRow.svelte';

	import { madRangeLookup } from '$lib/config';
	import { roundNumber } from '$lib/utils';

	export let metadata,
		indicator,
		timePeriodsArray,
		xDomain,
		selectedFilteredChartData,
		comparisonFilteredChartData,
		indicatorCalculations,
		hoverChartData,
		filteredChartData,
		hoverAreaId,
		selectionsObject,
		customLookup,
		showConfidenceIntervals;

	let width = 1000,
		height = 80;

	let yAxisMaxTickWidth = 0,
		xAxisFinalTickWidth = 0,
		maxLabelWidth = 100;

	$: padding = {
		top: 5,
		right: Math.max(0, xAxisFinalTickWidth / 2, maxLabelWidth),
		bottom: 25,
		left: 10 + yAxisMaxTickWidth
	};

	$: chartWidth = width - padding.left - padding.right;
	$: chartHeight = height - padding.top - padding.bottom;

	$: madRange = madRangeLookup.default['line-chart-row'];

	$: hoverChartData =
		hoverAreaId && filteredChartData
			? filteredChartData.filter((el) => el.areacd === hoverAreaId)
			: [];

	$: additionalFilteredChartData = filteredChartData.filter((el) =>
		selectionsObject['areas-rows-additional-chosen'].includes(el.areacd)
	);

	$: values = [
		...additionalFilteredChartData,
		...hoverChartData,
		...(selectedFilteredChartData ? selectedFilteredChartData : []),
		...(comparisonFilteredChartData ? comparisonFilteredChartData : [])
	].map((el) => [el.value, 'lci' in el ? el.lci : null, 'uci' in el ? el.uci : null]);

	$: flattenedValues = [].concat(...values).filter((el) => (el == 0 ? true : el));

	$: yDomainRaw = [0.95 * Math.min(...flattenedValues), 1.05 * Math.max(...flattenedValues)];

	$: yDomain =
		yDomainRaw[1] - yDomainRaw[0] > madRange * indicatorCalculations.mad
			? yDomainRaw
			: [
					yDomainRaw[0] -
						(madRange * indicatorCalculations.mad - (yDomainRaw[1] - yDomainRaw[0])) / 2,
					yDomainRaw[1] +
						(madRange * indicatorCalculations.mad - (yDomainRaw[1] - yDomainRaw[0])) / 2
				];

	$: initialValue = selectedFilteredChartData.find((el) => el.xDomainNumb == xDomain[0]);
	$: latestValue = selectedFilteredChartData.find((el) => el.xDomainNumb == xDomain[1]);

	$: changeValue =
		latestValue && initialValue
			? roundNumber(latestValue.value - initialValue.value, indicator.metadata.decimalPlaces)
			: null;
</script>

<div class="svg-container" bind:clientWidth={width}>
	<svg {width} {height}>
		<g transform="translate({padding.left},{padding.top})">
			{#if chartWidth && chartHeight}
				<LineChartRow
					{indicator}
					{xDomain}
					{yDomain}
					{selectedFilteredChartData}
					{comparisonFilteredChartData}
					{chartWidth}
					{chartHeight}
					{hoverChartData}
					bind:yAxisMaxTickWidth
					bind:xAxisFinalTickWidth
					bind:maxLabelWidth
					{timePeriodsArray}
					{selectionsObject}
					{additionalFilteredChartData}
					{customLookup}
					{showConfidenceIntervals}
				></LineChartRow>
			{/if}
		</g>
	</svg>
</div>

<style>
	svg {
		overflow: visible;
	}

	.robo-text-container {
		margin: 2px 0px 2px 0px;
		padding: 0px;
		text-align: center;
		font-size: 16px;
		line-height: 16px;
		color: #222;
	}

	.robo-text-inline {
		padding: 0px 0px;
		margin: 0px 2px 0px 0px;
		display: inline-block;
	}
</style>
