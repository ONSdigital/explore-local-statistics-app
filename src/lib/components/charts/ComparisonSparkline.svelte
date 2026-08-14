<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { ONScolours } from '$lib/config';

	let { data, xKey = 'value', idKey = 'areacd', yDomain } = $props();
	let height = $derived(30);
	let width = $state(300);
	let leftMargin = $state(0);
	const barHeight = 20;

	let xScale = $derived(xDomain ? scaleLinear().domain(xDomain).range([0, width]) : null);

	$inspect(data);
</script>
