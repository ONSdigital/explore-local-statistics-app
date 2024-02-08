<script lang="ts">
	import { colorsLookup } from '$lib/config';
	import { line } from 'd3-shape';

	export let area, xDomain, x, y;

	$: pathFunction = line()
		.x((d) => {
			return x(d.xDomainNumb);
		})
		.y((d) => {
			return y(d.value);
		});

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

	$: console.log(wrappedConfidenceIntervalArray);
</script>

{#if wrappedConfidenceIntervalArray}
	<path
		d={pathFunction(wrappedConfidenceIntervalArray)}
		stroke="none"
		fill={colorsLookup.selected.color}
		pointer-events="none"
		opacity="0.25"
	></path>
{/if}
