<script lang="ts">
	import Label from '$lib/prototype-components/data-vis/line-chart/Label.svelte';
	import HoverLabel from '$lib/prototype-components/data-vis/line-chart/HoverLabel.svelte';

	import labelplacer from 'labelplacer';

	export let visibleAreasWithDataAdded,
		isHoverLabelVisible,
		hoverId,
		hoverAreaWithDataAdded,
		maxLabelWidth,
		chartWidth,
		chartHeight,
		y;

	$: permanentLabels = labelplacer(
		visibleAreasWithDataAdded[0],
		[0, chartHeight],
		(d) => y(d.data[0].value) + 6,
		(d) => (d.areanm.length > 25 ? 52 : 26)
	);

	let permanentLabelsBBoxArray = [];

	$: maxLabelWidth =
		permanentLabelsBBoxArray.length > 0
			? Math.max(
					120,
					...permanentLabelsBBoxArray.map((el, i) => (i < permanentLabels.length ? el.width : 0))
				)
			: maxLabelWidth;
</script>

<g class="labels-container" transform="translate({chartWidth + 13},0)">
	{#each permanentLabels as label, i}
		<Label {label} bind:hoverId bind:labelBBox={permanentLabelsBBoxArray[i]}></Label>
	{/each}

	{#if hoverAreaWithDataAdded}
		<HoverLabel label={hoverAreaWithDataAdded} bind:isHoverLabelVisible {maxLabelWidth} {y}
		></HoverLabel>
	{/if}
</g>
