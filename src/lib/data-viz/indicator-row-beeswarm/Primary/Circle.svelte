<script lang="ts">
	import { colorsLookup } from '$lib/config.js';
	import { indicatorRowBeeswarmChartSettings } from '../../../../routes/(app)/areas/[slug]/indicators/config';

	export let circle,
		customLookup,
		y,
		outline = false,
		hoverAreaId,
		hoverIndicatorId = null,
		indicator,
		showConfidenceIntervals;

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
</g>

<style>
	.ci-rect {
		pointer-events: none;
	}
</style>
