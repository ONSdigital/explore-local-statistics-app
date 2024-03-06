<script lang="ts">
	import { chartConfigurations, colorsLookup } from '$lib/config.js';

	export let circle,
		customLookup,
		y,
		outline = false;

	$: color = circle
		? circle.datum.role === 'custom'
			? Object.keys(customLookup).length > colorsLookup.custom.length
				? colorsLookup.customExceedThreshold
				: colorsLookup.custom[
						circle.datum.areacd in customLookup ? customLookup[circle.datum.areacd] : 0
					]
			: colorsLookup[circle.datum.role]
		: { color: null, constrast: null };
</script>

<g transform="translate({circle.x},{2 * y(circle.y)})">
	{#if ['parent', 'country', 'uk', 'comparison'].includes(circle.datum.role)}
		<rect
			transform={['country', 'uk', 'comparison'].includes(circle.datum.role) ? 'rotate(45)' : null}
			x={-chartConfigurations.beeswarmRow.primaryRadius * 0.75 * (circle.datum.priority ? 1 : 0.8)}
			y={-chartConfigurations.beeswarmRow.primaryRadius * 0.75 * (circle.datum.priority ? 1 : 0.8)}
			width={2 *
				chartConfigurations.beeswarmRow.primaryRadius *
				0.75 *
				(circle.datum.priority ? 1 : 0.8)}
			height={2 *
				chartConfigurations.beeswarmRow.primaryRadius *
				0.75 *
				(circle.datum.priority ? 1 : 0.8)}
			fill={outline ? 'none' : color.color}
			stroke="white"
			stroke-width={outline ? '2.5px' : '0px'}
		></rect>
	{:else}
		<circle
			r={chartConfigurations.beeswarmRow.primaryRadius * (circle.datum.priority ? 1 : 0.8)}
			stroke="white"
			stroke-width={outline ? '3px' : '0px'}
			fill={outline ? 'none' : color.color}
		></circle>
	{/if}
</g>

<style>
	rect {
		pointer-events: none;
	}

	circle {
		pointer-events: none;
	}
</style>
