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

	$: console.log(madRange);

	$: values = [
		...additionalFilteredChartData,
		...hoverChartData,
		...(selectedFilteredChartData ? selectedFilteredChartData : []),
		...(comparisonFilteredChartData ? comparisonFilteredChartData : [])
	].map((el) => [el.value, 'lci' in el ? el.lci : null, 'uci' in el ? el.uci : null]);

	$: flattenedValues = [].concat(...values).filter((el) => el);

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

	/*export let metadata,
		indicator,
		areasGroupsObject,
		hoverId,
		hoverIndicatorId,
		hoverChartData;
	export let timePeriodsArray,
		xDomain,
		selectedIndicatorCalculations,
		selectedAreaFilteredChartData,
		comparisonAreaFilteredChartData,
		backgroundChartData,
		chosenComparisonMeasureOrArea;*/

	/*export let metadata,
		indicator,
		selectionsObject,
		hoverId,
		hoverIndicatorId,
		timePeriodsArray,
		hoverChartData,
		xDomain,
		selectedIndicatorCalculations,
		selectedAreaFilteredChartData,
		comparisonAreaFilteredChartData,
		backgroundChartData;

	let width = 1000,
		height = 80;

	let yAxisMaxTickWidth = 0,
		xAxisFinalTickWidth = 0,
		maxLabelWidth = 80;

	$: padding = {
		top: 5,
		right: Math.max(0, xAxisFinalTickWidth / 2, maxLabelWidth + 10),
		bottom: 25,
		left: 10 + yAxisMaxTickWidth
	};

	$: chartWidth = width - padding.left - padding.right;
	$: chartHeight = height - padding.top - padding.bottom;

	$: madRange = madRangeLookup.default['line-chart-row'];

	$: values = [
		...hoverChartData,
		...(selectedAreaFilteredChartData ? selectedAreaFilteredChartData : []),
		...(comparisonAreaFilteredChartData ? comparisonAreaFilteredChartData : [])
	].map((el) => [el.value, 'lci' in el ? el.lci : null, 'uci' in el ? el.uci : null]);

	$: flattenedValues = [].concat(...values).filter((el) => el);

	$: yDomainRaw = [0.95 * Math.min(...flattenedValues), 1.05 * Math.max(...flattenedValues)];

	$: yDomain =
		yDomainRaw[1] - yDomainRaw[0] > madRange * selectedIndicatorCalculations.mad
			? yDomainRaw
			: [
					yDomainRaw[0] -
						(madRange * selectedIndicatorCalculations.mad - (yDomainRaw[1] - yDomainRaw[0])) / 2,
					yDomainRaw[1] +
						(madRange * selectedIndicatorCalculations.mad - (yDomainRaw[1] - yDomainRaw[0])) / 2
				];

	$: initialValue = selectedAreaFilteredChartData.find((el) => el.xDomainNumb == xDomain[0]);
	$: latestValue = selectedAreaFilteredChartData.find((el) => el.xDomainNumb == xDomain[1]);

	$: changeValue =
		latestValue && initialValue
			? roundNumber(latestValue.value - initialValue.value, indicator.metadata.decimalPlaces)
			: null;*/

	/*$: selectedComparisonDifference =
		changeValue == 0 ? 'No change' : changeValue > 0 ? 'Increased' : 'Decreased';

	$: goodBad =
		indicator.metadata.polarity == 1
			? selectedComparisonDifference === 'Increased'
				? 'Good'
				: selectedComparisonDifference === 'Decreased'
					? 'Bad'
					: 'Neither'
			: indicator.metadata.polarity == -1
				? selectedComparisonDifference === 'Increased'
					? 'Bad'
					: selectedComparisonDifference === 'Decreased'
						? 'Good'
						: 'Neither'
				: 'Neither';
	$: backgroundStyle =
		goodBad === 'Good'
			? 'background-color: #E6F5D0; box-shadow: 0 0 4px 3px #E6F5D0'
			: goodBad === 'Bad'
				? 'background-color: #FDE0EF; box-shadow: 0 0 4px 3px #FDE0EF'
				: '';

	$: backgroundStyle = '';*/
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
				<!-- <LineChartRow
					{indicator}
					{xDomain}
					{yDomain}
					{selectedAreaFilteredChartData}
					{chartWidth}
					{chartHeight}
					{comparisonAreaFilteredChartData}
					{timePeriodsArray}
					{hoverChartData}
					{hoverId}
					{selectionsObject}
					bind:yAxisMaxTickWidth
					bind:xAxisFinalTickWidth
					bind:maxLabelWidth
				></LineChartRow> -->
			{/if}
		</g>
	</svg>
</div>

<!-- <div class="robo-text-container" style="opacity: {hoverId ? 0 : 1};">
	<div class="robo-text-inline" style={backgroundStyle}>
		<span>
			<span style="font-weight: bold"> {selectedComparisonDifference}</span>
			since
			<span style="font-weight: bold"> {timePeriodsArray[timePeriodsArray.length - 1].label} </span>
		</span>
	</div>
</div> -->

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
