<script lang="ts">
	import { colorsLookup } from '$lib/config';
	import { line } from 'd3-shape';

	export let area,
		x,
		y,
		customLookup,
		hover = false;

	$: pathFunction = line()
		.x((d) => {
			return x(d.xDomainNumb);
		})
		.y((d) => {
			return y(d.value);
		});

	//wraps the confidence interval data into a single array with the upper confidence interval data first and then the reversed lower confidence interval data second, so that they form a wrapped path which renders as an area
	$: wrappedConfidenceIntervalArray = [
		...area.data.map((e) => ({
			xDomainNumb: e.xDomainNumb,
			value: e.uci
		})),
		...[...area.data].reverse().map((e) => ({
			xDomainNumb: e.xDomainNumb,
			value: e.lci
		}))
	].filter((e) => e.value != 'NA');

	$: color = hover
		? colorsLookup.selected
		: area
			? area.role === 'custom'
				? Object.keys(customLookup).length > colorsLookup.custom.length
					? colorsLookup.customExceedThreshold
					: colorsLookup.custom[area.areacd in customLookup ? customLookup[area.areacd] : 0]
				: colorsLookup[area.role]
			: { color: null, constrast: null };
</script>

{#if wrappedConfidenceIntervalArray}
	<path
		d={pathFunction(wrappedConfidenceIntervalArray)}
		stroke="none"
		fill={color.color}
		pointer-events="none"
		opacity="0.25"
	></path>
{/if}
