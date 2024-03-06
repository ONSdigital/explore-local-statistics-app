<script lang="ts">
	import { chartConfigurations, colorsLookup } from '$lib/config.js';

	export let circle,
		y,
		adjustmentValue = 0;
</script>

<g class="hover-circle-group">
	<circle
		cx={circle.x}
		cy={y(circle.y) + adjustmentValue}
		r={chartConfigurations.beeswarmRow.primaryRadius}
		fill={colorsLookup.selected.color}
		stroke={'white'}
		stroke-width="1.5px"
		pointer-events="none"
	></circle>
</g>
