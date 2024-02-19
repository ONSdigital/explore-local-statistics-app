<script lang="ts">
	import { chartConfigurations, colorsLookup } from '$lib/config.js';

	export let circle, y, outline;
</script>

<g class="hover-circle-group">
	<circle
		cx={circle.x}
		cy={y(circle.y)}
		r={chartConfigurations.beeswarmRow.primaryRadius}
		fill={outline ? 'none' : colorsLookup.selected.color}
		stroke={outline ? 'white' : 'none'}
		stroke-width="2.5px"
		pointer-events="none"
	></circle>
</g>
