<script lang="ts">
	import { colorsLookup } from '$lib/config.js';
	import { indicatorRowBeeswarmChartSettings } from '../../../../routes/(app)/areas/[slug]/indicators/config';

	export let circle,
		y,
		adjustmentValue = 0;
</script>

<g class="hover-circle-group">
	<circle
		cx={circle.x}
		cy={y(circle.y) + adjustmentValue}
		r={indicatorRowBeeswarmChartSettings.primaryCircleRadius}
		fill={colorsLookup.selected.color}
		stroke={'white'}
		stroke-width="1.5px"
		pointer-events="none"
	></circle>
</g>
