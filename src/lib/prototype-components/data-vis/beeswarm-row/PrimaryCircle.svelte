<script lang="ts">
	import { chartConfigurations, colorsLookup } from '$lib/config.js';

	export let circle,
		y,
		outline = false;

	$: role = 'role' in circle.datum ? circle.datum.role : 'main';
</script>

<g transform="translate({circle.x},{2 * y(circle.y)})">
	{#if ['parent', 'country', 'uk', 'comparison'].includes(role)}
		<rect
			transform={['country', 'uk', 'comparison'].includes(role) ? 'rotate(45)' : null}
			x={-chartConfigurations.beeswarmRow.primaryRadius * 0.75}
			y={-chartConfigurations.beeswarmRow.primaryRadius * 0.75}
			width={2 * chartConfigurations.beeswarmRow.primaryRadius * 0.75}
			height={2 * chartConfigurations.beeswarmRow.primaryRadius * 0.75}
			fill={outline ? 'none' : colorsLookup[role].color}
			stroke="white"
			stroke-width={outline ? '2.5px' : '0px'}
		></rect>
	{:else}
		<circle
			r={chartConfigurations.beeswarmRow.primaryRadius}
			stroke="white"
			stroke-width={outline ? '3px' : '0px'}
			fill={outline ? 'none' : colorsLookup[role].color}
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
