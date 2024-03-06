<script lang="ts">
	import { chartConfigurations, colorsLookup } from '$lib/config.js';

	export let circle,
		customLookup,
		y,
		outline = false,
		hoverAreaId,
		hoverIndicatorId = null,
		indicator,
		showConfidenceIntervals = false;

	$: color = circle
		? circle.datum.role === 'custom'
			? Object.keys(customLookup).length > colorsLookup.custom.length
				? colorsLookup.customExceedThreshold
				: colorsLookup.custom[
						circle.datum.areacd in customLookup ? customLookup[circle.datum.areacd] : 0
					]
			: colorsLookup[circle.datum.role]
		: { color: null, constrast: null };

	$: radius = chartConfigurations.beeswarmRow.primaryRadius * (circle.datum.priority ? 1 : 0.9);

	function mouseEnterEvent() {
		console.log(circle.datum.areacd);

		hoverAreaId = circle.datum.areacd;
		hoverIndicatorId = indicator.code;
	}

	function mouseLeaveEvent() {
		hoverAreaId = null;
		hoverIndicatorId = null;
	}
</script>

<g>
	{#if showConfidenceIntervals && circle.datum.lciXPosition && circle.datum.uciXPosition}
		<rect
			class="ci-rect"
			transform="translate(0,{2 * y(circle.y)})"
			x={circle.datum.lciXPosition}
			y={-4}
			width={circle.datum.uciXPosition - circle.datum.lciXPosition}
			height="8"
			fill="white"
			stroke="none"
			stroke-width="1px"
			fill-opacity="1"
		></rect>
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
			fill-opacity="0.6"
		></rect>
	{/if}

	{#if showConfidenceIntervals}
		<g transform="translate({circle.x},{2 * y(circle.y)})">
			<line y1={-radius - 2} y2={radius + 2} stroke={'white'} stroke-width="6px"></line>
			<line y1={-radius} y2={radius} stroke={color.color} stroke-width="4px"></line>
		</g>
	{:else}
		<g transform="translate({circle.x},{2 * y(circle.y)})">
			{#if ['parent', 'country', 'uk', 'comparison'].includes(circle.datum.role)}
				<rect
					on:mouseenter={mouseEnterEvent}
					on:mouseleave={mouseLeaveEvent}
					class={circle.datum.priority ? 'priority-area' : ''}
					transform={['country', 'uk', 'comparison'].includes(circle.datum.role)
						? 'rotate(45)'
						: null}
					x={-radius * 0.75}
					y={-radius * 0.75}
					width={1.5 * radius}
					height={1.5 * radius}
					fill={outline ? 'none' : color.color}
					stroke="white"
					stroke-width={'1.5px'}
				></rect>
			{:else}
				<circle
					on:mouseenter={mouseEnterEvent}
					on:mouseleave={mouseLeaveEvent}
					class={circle.datum.priority ? 'priority-area' : ''}
					r={radius}
					stroke="white"
					stroke-width={'1.5px'}
					fill={outline ? 'none' : color.color}
				></circle>
			{/if}
		</g>
	{/if}
</g>

<style>
	.priority-area {
		pointer-events: none;
	}

	.ci-rect {
		pointer-events: none;
	}
</style>
