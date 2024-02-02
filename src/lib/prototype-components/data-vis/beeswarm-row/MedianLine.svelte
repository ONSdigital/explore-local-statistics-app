<script lang="ts">
	import { addThousandsSeparator, roundNumber } from '$lib/utils';
	import { colorsLookup } from '$lib/config.js';

	export let topRow, indicator, selectedIndicatorCalculations, x, chartHeight, medianLabelRect;
</script>

<g class="median-line-group" transform="translate({x(selectedIndicatorCalculations.med)},0)">
	<line y1="-12" y2={chartHeight + 5} stroke="white" stroke-width="4px"></line>

	<line
		y1="-12"
		y2={chartHeight + 5}
		stroke={colorsLookup.median.color}
		stroke-dasharray="5 3"
		stroke-width="2px"
	></line>

	{#if medianLabelRect}
		<rect
			x={-medianLabelRect.width / 2 - 3}
			y={-39}
			width={medianLabelRect.width + 6}
			height={24}
			fill="white"
			stroke={colorsLookup.median.color}
			rx="2px"
			stroke-width="1.5px"
		></rect>
	{/if}

	<g class="median-label">
		<text
			y="-20"
			bind:contentRect={medianLabelRect}
			text-anchor="middle"
			fill={colorsLookup.median.color}
			>{indicator.metadata.prefix +
				addThousandsSeparator(
					roundNumber(selectedIndicatorCalculations.med, indicator.metadata.decimalPlaces)
				) +
				indicator.metadata.suffix}</text
		>
	</g>
</g>

<style>
	text {
		font-size: 20px;
	}
</style>
