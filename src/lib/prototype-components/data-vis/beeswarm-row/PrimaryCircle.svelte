<script lang="ts">
	import MainAreaLabel from '$lib/prototype-components/data-vis/beeswarm-row/MainAreaLabel.svelte';

	import { chartConfigurations, colorsLookup } from '$lib/config.js';

	export let indicator, circle, y, medianLabelRect, x, selectedIndicatorCalculations;
</script>

<circle
	cx={circle.x}
	cy={y(circle.y)}
	r={chartConfigurations.beeswarmRow.primaryRadius}
	stroke="white"
	stroke-width="1.5px"
	fill={colorsLookup[circle.datum.role].color}
></circle>

{#if medianLabelRect && circle.datum.role === 'main'}
	<MainAreaLabel {indicator} {medianLabelRect} {circle} {x} {y} {selectedIndicatorCalculations}
	></MainAreaLabel>
{/if}
