<script lang="ts">
	import { addThousandsSeparator, roundNumber } from '$lib/utils';
	import { colorsLookup } from '$lib/config.js';

	export let indicator, medianLabelRect, circle, x, y, selectedIndicatorCalculations;

	let mainAreaRect;

	$: labelMidpoint = mainAreaRect
		? circle.x < x(selectedIndicatorCalculations.med)
			? Math.min(
					x(selectedIndicatorCalculations.med) -
						medianLabelRect.width / 2 -
						12 -
						mainAreaRect.width / 2,
					Math.max(mainAreaRect.width / 2 - 3, circle.x)
				)
			: Math.min(
					x(selectedIndicatorCalculations.med) * 2 - mainAreaRect.width / 2 - 3,
					Math.max(
						x(selectedIndicatorCalculations.med) +
							medianLabelRect.width / 2 +
							12 +
							mainAreaRect.width / 2,
						circle.x
					)
				)
		: 0;

	/*$: labelMidpoint = mainAreaRect
		? circle.x < x(selectedIndicatorCalculations.med)
			? Math.min(
					x(selectedIndicatorCalculations.med) -
						medianLabelRect.width / 2 -
						12 -
						mainAreaRect.width / 2,
					Math.max(mainAreaRect.width / 2 - 3, circle.x)
				)
			: Math.min(
					x(selectedIndicatorCalculations.med) +
						medianLabelRect.width / 2 +
						12 +
						mainAreaRect.width / 2,
					Math.max(x(selectedIndicatorCalculations.med) * 2 - mainAreaRect.width / 2 - 3, circle.x)
				)
		: 0;*/
</script>

<g class="main-area-label-group">
	<path
		stroke={'white'}
		fill="none"
		d="M{circle.x},{y(circle.y) - 8} L{circle.x} {y(circle.y) - 30} L{labelMidpoint} {y(circle.y) -
			30} L{labelMidpoint} -20"
		stroke-width="4px"
	></path>

	<path
		stroke={colorsLookup.main.color}
		fill="none"
		d="M{circle.x},{y(circle.y) - 5} L{circle.x} {y(circle.y) - 30} L{labelMidpoint} {y(circle.y) -
			30} L{labelMidpoint} -20"
		stroke-width="2px"
	></path>

	<g transform="translate({labelMidpoint},0)">
		{#if mainAreaRect}
			<rect
				x={-mainAreaRect.width / 2 - 3}
				y={-39}
				width={mainAreaRect.width + 6}
				height={34}
				fill="white"
				stroke={colorsLookup.main.color}
				stroke-width="1.5px"
				rx="2px"
			></rect>
		{/if}

		<g class="median-label">
			<text
				y="-12"
				bind:contentRect={mainAreaRect}
				text-anchor="middle"
				fill={colorsLookup.main.color}
				stroke={colorsLookup.main.color}
				>{indicator.metadata.prefix +
					addThousandsSeparator(roundNumber(circle.datum.value, indicator.metadata.decimalPlaces)) +
					indicator.metadata.suffix}</text
			>
		</g>
	</g>
</g>

<!-- 
<path
	fill="none"
	stroke={colorsLookup.main.color}
	d="M {circle.x} {chartHeight - 15} l0 -40 L{chartWidth / 2 < circle.x
		? 10 +
			Math.max(
				circle.x,
				chartWidth / 2 + labelRect1.width + (labelRect2 ? labelRect2.width / 2 : 0)
			)
		: -10 +
			Math.min(
				circle.x,
				chartWidth / 2 - labelRect1.width - (labelRect2 ? labelRect2.width / 2 : 0)
			)} {chartHeight - 55} l0 -10"
	stroke-width="3px"
	pointer-events="none"
></path> -->

<style>
	text {
		font-size: 30px;
		stroke-width: 0.5px;
	}
</style>
