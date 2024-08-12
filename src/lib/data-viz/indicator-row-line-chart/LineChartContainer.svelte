<script lang="ts">
	import LineChartRow from '$lib/prototype-components/data-vis/LineChartRow.svelte';

	import { indicatorRowLineChartSettings } from '../../../routes/(app)/areas/[slug]/indicators/config';

	import { madRangeLookup } from '$lib/config';
	import { roundNumber } from '$lib/utils';

	export let metadata,
		indicator,
		timePeriodsArray,
		xDomain,
		selectedArea,
		selectedFilteredChartData,
		comparisonFilteredChartData,
		indicatorCalculations,
		hoverChartData,
		filteredChartData,
		hoverAreaId,
		selectionsObject,
		customLookup,
		showConfidenceIntervals;

	//set initial width of svg, this is used for the initial render but then the screen size is determined and the width of the svg is re-calculated.
	let width = 1000;

	let height = indicatorRowLineChartSettings.height;

	//set initial values - these are then bound and determined in components once other elements are rendered.
	//the yAxisMaxTickWidth calclulates the most space taken up by an axis label on the y-axis, the chart is then translated right to make sure labels fit on the left hand side.
	//xAxisFinalTickWidth calculates the width of the last x-axis label and makes sure the graph ends at least half this distance from the edge of the svg, so that the label will fit on the right hand side.
	//maxLabelWidth tracks the width of the longest visible label, so that the graph can be squished so the label fits on the right hand side.
	let yAxisMaxTickWidth = 0,
		xAxisFinalTickWidth = 0,
		maxLabelWidth = 100;

	$: padding = {
		top: indicatorRowLineChartSettings.padding.top,
		right:
			indicatorRowLineChartSettings.padding.right +
			Math.max(0, xAxisFinalTickWidth / 2, maxLabelWidth),
		bottom: indicatorRowLineChartSettings.padding.bottom,
		left: indicatorRowLineChartSettings.padding.left + yAxisMaxTickWidth
	};

	$: chartWidth = width - padding.left - padding.right;
	$: chartHeight = height - padding.top - padding.bottom;

	$: madRange =
		indicator.metadata.beeswarmRowUseMinMax === 'T'
			? 'minMax'
			: indicatorRowLineChartSettings.defaultMadRange;

	//filters to get graph data for any areas that are being hovered over or additional areas to be selected. this is necessary for setting the y-scale so that all lines are visible on the chart
	$: hoverChartData =
		hoverAreaId && filteredChartData
			? filteredChartData.filter((el) => el.areacd === hoverAreaId)
			: [];

	$: additionalFilteredChartData = filteredChartData.filter((el) =>
		selectionsObject['areas-rows-additional-chosen'].includes(el.areacd)
	);

	//find the max and min values (including low and upper confidence intervals) for all visible lines. these are used to set the y-scale for the chart
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

	//used for the positioning of the label
	$: initialValue =
		selectedFilteredChartData.find((el) => el.xDomainNumb == xDomain[0]) ??
		selectedFilteredChartData[selectedFilteredChartData.length - 1];
	$: latestValue = selectedFilteredChartData.find((el) => el.xDomainNumb == xDomain[1]);

	$: lineChartAltText =
		`Line chart for ${indicator.metadata.label}` +
		(indicator.metadata?.subText ? ` (${indicator.metadata?.subText}) ` : ` `) +
		`in ${selectedArea.areanm}. ` +
		`Between ${selectedFilteredChartData.find((el) => el.xDomainNumb == xDomain[0]) ? xDomain[0] : selectedFilteredChartData[selectedFilteredChartData.length - 1].xDomainNumb} and ${xDomain[1]} ${indicator.metadata.label}` +
		(indicator.metadata?.subText ? ` (${indicator.metadata?.subText}) ` : ` `) +
		`in ${selectedArea.areanm} ${latestValue?.value - initialValue.value > 0 ? 'increased' : 'decreased'} by ` +
		`${indicator.metadata?.prefix}${roundNumber(Math.abs(latestValue?.value - initialValue.value), indicator.metadata.decimalPlaces)}${indicator.metadata?.suffix == '%' ? ' percentage points' : indicator.metadata?.suffix}.`;

	$: console.log(lineChartAltText);
</script>

<div class="svg-container" bind:clientWidth={width}>
	<svg
		role="img"
		aria-labelledby={indicator.metadata.slug + '-line-chart-description'}
		{width}
		{height}
	>
		<desc id={indicator.metadata.slug + '-line-chart-description'}>{lineChartAltText}</desc>
		<g aria-hidden="true" transform="translate({padding.left},{padding.top})">
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
