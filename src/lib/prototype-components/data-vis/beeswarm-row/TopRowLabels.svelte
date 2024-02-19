<script lang="ts">
	import { colorsLookup } from '$lib/config.js';

	export let labelMidpoints,
		areasGroupsObject,
		chosenComparisonMeasureOrArea,
		y,
		chartWidth,
		chartHeight,
		spaceForOutliers;

	let comparisonLabelRect;

	$: comparisonLabelWidth = comparisonLabelRect ? comparisonLabelRect.width : 0;

	$: comparisonLabelMidpoint = Math.min(
		Math.max(comparisonLabelWidth / 2 - spaceForOutliers / 2, labelMidpoints.comparison),
		chartWidth + spaceForOutliers / 2 - comparisonLabelWidth / 2
	);

	$: comparisonColor =
		colorsLookup[
			'label1' in chosenComparisonMeasureOrArea ? 'median' : chosenComparisonMeasureOrArea.role
		].color;
</script>

<g class="top-row-additional-labels-group">
	<path
		stroke={comparisonColor}
		fill="none"
		d="M{comparisonLabelMidpoint} -97 L{comparisonLabelMidpoint} -75 L{labelMidpoints.comparison} -75 L{labelMidpoints.comparison} -50"
		stroke-width="1.5px"
	></path>
	<path
		stroke={comparisonColor}
		fill={comparisonColor}
		d="M{labelMidpoints.comparison} -50 l-3 -3 l6 0 z"
		stroke-width="1.5px"
	></path>
	<g class="comparison-label" transform="translate({comparisonLabelMidpoint},-120)">
		{#if comparisonLabelRect}
			<rect
				x={-comparisonLabelRect.width / 2 - 3}
				y={0}
				width={comparisonLabelRect.width + 6}
				height="24"
				fill="white"
				stroke={comparisonColor}
				stroke-width="1.5px"
				rx="2px"
				opacity="0"
			></rect>
		{/if}

		<g>
			<text
				style="font-size: 16px; stroke-width: 0.5px"
				y="18"
				bind:contentRect={comparisonLabelRect}
				text-anchor="middle"
				fill={comparisonColor}
				stroke={comparisonColor}>{'value for median'}</text
			>
		</g>
	</g>
</g>
