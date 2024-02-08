<script lang="ts">
	import { chartConfigurations, colorsLookup } from '$lib/config.js';

	export let circle,
		y,
		arrayLength = null,
		index = null;

	$: stroke =
		arrayLength && index
			? arrayLength * 0.9 < index
				? '#5a5e63'
				: arrayLength * 0.8 < index
					? '#6f747a'
					: arrayLength * 0.6 < index
						? '#8c9096'
						: 'none'
			: 'black';

	$: strokeOpacity =
		arrayLength && index
			? arrayLength * 0.9 < index
				? 0.8
				: arrayLength * 0.8 < index
					? 0.7
					: arrayLength * 0.6 < index
						? 0.6
						: 0.5
			: 1;
</script>

<circle
	cx={circle.x}
	cy={y(circle.y)}
	r={chartConfigurations.beeswarmRow.backgroundRadius}
	fill-opacity={circle.datum.role ? 0.25 : 0.35}
	stroke-opacity={strokeOpacity}
	{stroke}
	fill={circle.datum.role ? '#222' : '#888a8f'}
	stroke-width={circle.datum.role ? '1px' : '0.25px'}
></circle>
