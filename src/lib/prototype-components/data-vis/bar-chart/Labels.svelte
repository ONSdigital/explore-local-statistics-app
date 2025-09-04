<script lang="ts">
	import Label from '$lib/prototype-components/data-vis/bar-chart/Label.svelte';
	import HoverLabel from '$lib/prototype-components/data-vis/bar-chart/HoverLabel.svelte';
	import { groupAdjacentItemsWithPositions } from '$lib/util/charts/labels/groupAdjacentItemsWithPositions.js';

	import labelplacer from 'labelplacer';

	export let lines,
		labelArray,
		chartHeight,
		chartWidth,
		customLookup,
		hoverId,
		maxLabelWidth,
		hoverAreaWithDataAdded,
		isHoverLabelVisible,
		labelSpace,
		y,
		fontSize = 16,
		minBarHeight;

	$: linesWithLabelText = lines.map((el, i) => ({
		...el,
		labelText: labelArray[i] ? labelArray[i] : ['']
	}));

	$: linesWithLabelTextCodes = linesWithLabelText.map((el) => el.areacd);

	$: permanentLabels = linesWithLabelText
		? labelplacer(
				linesWithLabelText,
				[0, chartHeight],
				(d) => d.labelPosition + 6,
				(d) => d.labelText.length * fontSize + 16
			).map((el) => ({
				...el,
				labelOffset: Math.abs(el.y - el.targetY) < 4 ? 'mid' : el.y > el.targetY ? 'down' : 'up'
			}))
		: null;

	$: connectingLineInfo = permanentLabels ? groupAdjacentItemsWithPositions(permanentLabels) : null;

	// $: console.log(connectingLineInfo);

	let labelRectArray = [];

	$: maxLabelWidth =
		labelRectArray.length > 0
			? Math.max(80, ...labelRectArray.map((el, i) => (i < permanentLabels.length ? el.width : 0)))
			: maxLabelWidth;
</script>

<g class="labels-container" transform="translate(0,0)">
	{#each permanentLabels as label, i}
		<Label
			{label}
			bind:hoverId
			{customLookup}
			{fontSize}
			bind:labelRect={labelRectArray[i]}
			connectingLineInfo={connectingLineInfo[label.datum.areacd]}
		></Label>
	{/each}

	{#if hoverAreaWithDataAdded}
		<HoverLabel
			label={hoverAreaWithDataAdded}
			bind:isHoverLabelVisible
			{maxLabelWidth}
			{y}
			{fontSize}
			labelSpace={maxLabelWidth}
		></HoverLabel>
	{/if}
</g>
