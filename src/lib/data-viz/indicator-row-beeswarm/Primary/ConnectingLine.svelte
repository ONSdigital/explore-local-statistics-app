<script lang="ts">
	import { colorsLookup } from '$lib/config.js';

	export let label, y, labelRectWidth, labelMidpoint, chartHeight;

	$: role = 'role' in label.datum ? label.datum.role : 'main';

	$: linePath =
		label.x >= labelMidpoint - (3 * labelRectWidth - 10) / 8 &&
		label.x <= labelMidpoint + (3 * labelRectWidth - 10) / 8
			? 'M ' + label.x + ' ' + 2 * y(label.y) + ' L ' + label.x + ' ' + (-chartHeight - 35)
			: 'M ' +
				label.x +
				' ' +
				2 * y(label.y) +
				' L ' +
				label.x +
				' ' +
				(2 * y(label.y) - 20) +
				' L ' +
				labelMidpoint +
				' ' +
				(2 * y(label.y) - 20) +
				' L ' +
				labelMidpoint +
				' ' +
				(-chartHeight - 35);
</script>

<g class="label-path-group">
	<g transform="translate(0,{chartHeight})">
		<path stroke="white" fill="none" d={linePath} stroke-width={role === 'main' ? '5px' : '5px'}
		></path>
		<path
			stroke={colorsLookup[role].color}
			fill="none"
			d={linePath}
			stroke-width={role === 'main' ? '2.5px' : '2px'}
			stroke-dasharray={role === 'median' ? '5.5 2' : null}
		></path>
	</g>
</g>

<style>
	path {
		pointer-events: none;
	}
</style>
