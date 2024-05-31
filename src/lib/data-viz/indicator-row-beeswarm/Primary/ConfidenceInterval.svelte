<script lang="ts">
	import { colorsLookup } from '$lib/config.js';
	import { indicatorRowBeeswarmChartSettings } from '../../../../routes/(app)/areas/[slug]/indicators/config';

	export let circle,
		customLookup,
		y,
		outline = false,
		hoverAreaId,
		hoverIndicatorId = null,
		indicator;

	$: color = circle
		? circle.datum.role === 'custom'
			? Object.keys(customLookup).length > colorsLookup.custom.length
				? colorsLookup.customExceedThreshold
				: colorsLookup.custom[
						circle.datum.areacd in customLookup ? customLookup[circle.datum.areacd] : 0
					]
			: colorsLookup[circle.datum.role]
		: { color: null, constrast: null };

	$: radius =
		indicatorRowBeeswarmChartSettings.primaryCircleRadius * (circle.datum.priority ? 1 : 0.9);

	function mouseEnterEvent() {
		hoverAreaId = circle.datum.areacd;
		hoverIndicatorId = indicator.code;
	}

	function mouseLeaveEvent() {
		hoverAreaId = null;
		hoverIndicatorId = null;
	}
</script>

<g>
	{#if circle.datum.lciXPosition && circle.datum.uciXPosition}
		<rect
			class="ci-rect"
			transform="translate(0,{2 * y(circle.y)})"
			x={circle.datum.lciXPosition}
			y={-5}
			width={circle.datum.uciXPosition - circle.datum.lciXPosition}
			height="10"
			fill={color.color}
			stroke="white"
			stroke-width="1px"
			fill-opacity="0.4"
		></rect>
	{/if}

	{#if circle.datum.lciXPosition && circle.datum.uciXPosition}
		<g transform="translate({circle.datum.lciXPosition},{2 * y(circle.y)})">
			<line y1={-radius + 2} y2={radius - 2} stroke={'white'} stroke-width="4px"></line>
			<line y1={-radius + 3} y2={radius - 3} stroke={color.color} stroke-width="2px"></line>
		</g>
		<g transform="translate({circle.datum.uciXPosition},{2 * y(circle.y)})">
			<line y1={-radius + 2} y2={radius - 2} stroke={'white'} stroke-width="4px"></line>
			<line y1={-radius + 3} y2={radius - 3} stroke={color.color} stroke-width="2px"></line>
		</g>
	{/if}
	<g transform="translate({circle.x},{2 * y(circle.y)})">
		<line y1={-radius - 2} y2={radius + 2} stroke={'white'} stroke-width="6px"></line>
		<line y1={-radius} y2={radius} stroke={color.color} stroke-width="4px"></line>
	</g>
</g>

<style>
	.ci-rect {
		pointer-events: none;
	}
</style>
