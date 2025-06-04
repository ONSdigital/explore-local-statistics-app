<script lang="ts">
	import Beeswarm from './Beeswarm.svelte';
	// import { addThousandsSeparator } from '$lib/util/charts/addThousandsSeparator';
	import { roundNumber } from '$lib/util/charts/roundNumber';
	import { indicatorRowBeeswarmChartSettings } from '../../../routes/(app)/areas/[slug]/indicators/config';

	import { scaleLinear } from 'd3-scale';

	export let metadata,
		indicator,
		latestTimePeriod,
		latestIndicatorCalculations,
		selectionsObject,
		selectedArea,
		hoverAreaId,
		hoverIndicatorId,
		selectedFilteredChartDataBeeswarmWithRole,
		comparisonFilteredChartDataBeeswarmWithRole,
		additionalFilteredChartDataBeeswarm,
		filteredChartDataBeeswarm,
		showConfidenceIntervals,
		customLookup,
		indicatorCalculations,
		observed;

	//set initial width of svg, this is used for the initial render but then the screen size is determined and the width of the svg is re-calculated.
	let width = 1000;

	let height = indicatorRowBeeswarmChartSettings.height;
	let padding = indicatorRowBeeswarmChartSettings.padding;
	let spaceForOutliers = indicatorRowBeeswarmChartSettings.spaceForOutliers;

	$: chartWidth = width - padding.left - padding.right - spaceForOutliers * 2;
	$: chartHeight = height - padding.top - padding.bottom;

	//the mad range is used to set the scale for the chart. so for example, if the madRange is set to 1, the chart range will go from -1 mad from the median to 1 mad from the median. any areas which do not fall within this range will be stacked as outliers and the beginning/end of the chart
	$: madRange =
		indicator.metadata.beeswarmRowUseMinMax === 'T'
			? 'minMax'
			: indicatorRowBeeswarmChartSettings.defaultMadRange;

	//comparison text is only included if the selected area belongs to particular geography types (e.g. we don't show comparison text for countries - because there aren't enough countries to calculate a meaningful MAD) and when there are enough areas with data (e.g. for some Northern Ireland metrics with less than 10 areas with data there aren't enough data points to calculate a meaningful MAD).
	$: includeComparisonText =
		indicatorRowBeeswarmChartSettings.geographyLevelWhereComparisonTextIsProvided.includes(
			selectedArea.geogLevel
		) &&
		latestIndicatorCalculations.calcsByGeogLevel?.[selectedArea.geogLevel].count >=
			indicatorRowBeeswarmChartSettings.minimumAreasForComparisonTextToBeProvided;

	//if madRange is minMax, the scale is simply set based on the range of the data points. this is determined based on the indicators metadata and used for certain indicators where the value are very bunched together, such as 4G coverage. in this instance, the furthestDistanceFromMedian is used to set the scale
	$: furtherDistanceFromMedian =
		madRange != 'minMax'
			? null
			: Math.max(
					indicatorCalculations.med - indicatorCalculations.min,
					indicatorCalculations.max - indicatorCalculations.med
				);

	$: xDomain =
		madRange != 'minMax'
			? [
					indicatorCalculations.med - madRange * indicatorCalculations.mad,
					indicatorCalculations.med + madRange * indicatorCalculations.mad
				]
			: [
					indicatorCalculations.med - furtherDistanceFromMedian,
					indicatorCalculations.med + furtherDistanceFromMedian
				];

	$: x = scaleLinear().domain(xDomain).range([0, chartWidth]);

	//checks whether the selected area is within 1 median absolute deviation of our comparison area (similar), or more than 1 mad above (higher) or more than 1 mad below (lower).
	$: selectedComparisonDifference = !comparisonFilteredChartDataBeeswarmWithRole
		? 'No comparison'
		: !selectedFilteredChartDataBeeswarmWithRole
			? 'No selected'
			: selectedFilteredChartDataBeeswarmWithRole.value -
						comparisonFilteredChartDataBeeswarmWithRole.value >
				  indicatorCalculations.mad
				? 'Higher'
				: selectedFilteredChartDataBeeswarmWithRole.value -
							comparisonFilteredChartDataBeeswarmWithRole.value <
					  -indicatorCalculations.mad
					? 'Lower'
					: 'Similar';

	$: beeswarmAltText =
		`Beeswarm chart showing values for ${indicator.metadata.label}` +
		(indicator.metadata?.subText ? ` (${indicator.metadata?.subText}). ` : `. `) +
		`The value for ${selectedArea.areanm} was ${indicator.metadata?.prefix}${roundNumber(selectedFilteredChartDataBeeswarmWithRole?.value, indicator.metadata.decimalPlaces)}${indicator.metadata?.suffix}, ` +
		(comparisonFilteredChartDataBeeswarmWithRole?.value
			? `The ${selectionsObject['areas-rows-comparison-visible']?.label || selectionsObject['areas-rows-comparison-visible']?.areanm} value was ${indicator.metadata?.prefix}${roundNumber(comparisonFilteredChartDataBeeswarmWithRole.value, indicator.metadata.decimalPlaces)}${indicator.metadata?.suffix}.`
			: `No value available for ${selectionsObject['areas-rows-comparison-visible']?.label || selectionsObject['areas-rows-comparison-visible']?.areanm}.`);

	// create an array of all the area codes for the indicator that are at the same geog level as the selected area
	$: areaCodesToArrowThrough = filteredChartDataBeeswarm
		.filter((el) => selectionsObject['related-rows-visible'].codes.includes(el.areacd))
		.sort((a, b) => a.value - b.value)
		.map((el) => el.areacd);

	let currentIndex = null;
	function handleKeyDown(e) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			if (areaCodesToArrowThrough && areaCodesToArrowThrough.length > 0) {
				currentIndex =
					(currentIndex - 1 + areaCodesToArrowThrough.length) % areaCodesToArrowThrough.length;
				hoverAreaId = areaCodesToArrowThrough[currentIndex];
				hoverIndicatorId = indicator.code;
			}
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			if (areaCodesToArrowThrough && areaCodesToArrowThrough.length > 0) {
				currentIndex = (currentIndex + 1) % areaCodesToArrowThrough.length;
				hoverAreaId = areaCodesToArrowThrough[currentIndex];
				hoverIndicatorId = indicator.code;
			}
		} else if (e.key === 'Tab') {
			hoverAreaId = null;
			hoverIndicatorId = null;
		}
	}
</script>

<figure class="beeswarm-figure">
	<div class="svg-container" bind:clientWidth={width}>
		<svg
			role="img"
			aria-labelledby={indicator.metadata.slug + '-beeswarm-description'}
			{width}
			{height}
			tabindex="0"
			on:keydown={handleKeyDown}
			on:blur={() => {
				hoverAreaId = null;
				hoverIndicatorId = null;
				currentIndex = null;
			}}
			on:focus={() => {
				hoverAreaId = selectedArea.areacd;
				hoverIndicatorId = indicator.code;
				currentIndex = areaCodesToArrowThrough.indexOf(hoverAreaId);

				console.log({ areaCodesToArrowThrough, hoverAreaId, currentIndex });
			}}
		>
			<desc id={indicator.metadata.slug + '-beeswarm-description'}>{beeswarmAltText}</desc>
			{#if chartWidth && chartHeight}
				<g
					aria-hidden="true"
					transform="translate({padding.left + spaceForOutliers},{padding.top})"
				>
					{#if chartWidth && chartHeight}
						<Beeswarm
							{metadata}
							{indicator}
							{selectedFilteredChartDataBeeswarmWithRole}
							{comparisonFilteredChartDataBeeswarmWithRole}
							{additionalFilteredChartDataBeeswarm}
							{filteredChartDataBeeswarm}
							{selectedArea}
							{selectionsObject}
							bind:hoverAreaId
							bind:hoverIndicatorId
							{spaceForOutliers}
							{chartWidth}
							{chartHeight}
							{xDomain}
							{customLookup}
							{showConfidenceIntervals}
							{observed}
							{width}
							{x}
						></Beeswarm>
					{/if}
				</g>
			{/if}
		</svg>
	</div>

	<div class="robo-text-container">
		<div class="robo-text-inline">
			<span style="display: {hoverAreaId ? 'none' : 'block'};">
				{#if selectionsObject['areas-rows-comparison-visible'] && includeComparisonText}
					{#if ['No comparison', 'No selected'].includes(selectedComparisonDifference)}
						No
					{:else}
						<span style="font-weight: bold">{selectedComparisonDifference}</span>
						{selectedComparisonDifference === 'Similar' ? 'to' : 'than'}
					{/if}
					<span
						>{selectedComparisonDifference === 'No selected'
							? selectedArea.areanm
							: 'label' in selectionsObject['areas-rows-comparison-visible']
								? 'average'
								: selectionsObject['areas-rows-comparison-visible'].areanm}
					</span>
					{#if ['No comparison', 'No selected'].includes(selectedComparisonDifference)}
						value for
					{:else}
						in
					{/if}
				{:else}<span>Values for</span>{/if}

				<span>{latestTimePeriod.label}</span>
			</span>
			<span style="display: {hoverAreaId ? 'block' : 'none'};">
				{#if currentIndex !== null}
					Use the arrow keys to move through the different areas
				{:else}
					&nbsp;
				{/if}
			</span>
		</div>
	</div>
</figure>

<style>
	.beeswarm-figure {
		margin: 0;
	}

	svg {
		overflow: visible;
		padding: 0px;
		margin: 0px;
	}

	svg:focus {
		outline: none;
	}

	.robo-text-container {
		margin: 15px 0px 2px 0px;
		padding: 0px;
		text-align: center;
		font-size: 16px;
		line-height: 16px;
		color: #414042;
		display: flex;
		flex-direction: column;
		/* gap: 5px; */
	}

	.robo-text-inline {
		padding: 0px 0px;
		margin: 0px 2px 0px 0px;
		display: inline-block;
	}
</style>
