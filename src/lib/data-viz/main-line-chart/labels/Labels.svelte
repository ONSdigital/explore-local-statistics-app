<script lang="ts">
	import Label from '$lib/prototype-components/data-vis/line-chart/Label.svelte';
	import HoverLabel from '$lib/prototype-components/data-vis/line-chart/HoverLabel.svelte';

	import labelplacer from 'labelplacer';
	import { groupAdjacentItemsWithPositions } from '$lib/util/charts/labels/groupAdjacentItemsWithPositions';

	export let lines,
		labelArray,
		chartHeight,
		chartWidth,
		customLookup,
		hoverId,
		maxLabelWidth,
		hoverAreaWithDataAdded,
		isHoverLabelVisible,
		y,
		fontSize = 16;

	//add label data determined using dummy labels to the line data
	$: linesWithLabelText = lines
		.map((el, i) => ({
			...el,
			labelText: labelArray[i] ? labelArray[i] : ['']
		}))
		.filter((el) => (lines.length > 8 ? el.role != 'custom' && el.role != 'related' : true));

	//used to check for the hovered area
	$: linesWithLabelTextCodes = linesWithLabelText.map((el) => el.areacd);

	//uses James T's label placing algorithm to determine how to fit the labels together, based on the height of each label
	$: permanentLabels = linesWithLabelText
		? labelplacer(
				linesWithLabelText,
				[0, chartHeight],
				(d) => d.labelPosition + 4,
				(d) => d.labelText.length * fontSize + 8
			).map((el) => ({
				...el,
				labelOffset: Math.abs(el.y - el.targetY) < 4 ? 'mid' : el.y > el.targetY ? 'down' : 'up'
			}))
		: null;

	//calculates the information need to generate paths for the liens which connect labels to the final data point
	$: connectingLineInfo = permanentLabels ? groupAdjacentItemsWithPositions(permanentLabels) : null;

	let labelRectArray = [];

	//maxLabelWidth is used to track how much space any labels that appear due to the user hovering can take up
	$: maxLabelWidth =
		labelRectArray.length > 0
			? Math.max(100, ...labelRectArray.map((el, i) => (i < permanentLabels.length ? el.width : 0)))
			: maxLabelWidth;
</script>

<g class="labels-container" transform="translate({chartWidth},0)">
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

	{#if hoverAreaWithDataAdded && !linesWithLabelTextCodes.includes(hoverAreaWithDataAdded.areacd)}
		<HoverLabel label={hoverAreaWithDataAdded} {y} {fontSize} labelSpace={maxLabelWidth}
		></HoverLabel>
	{/if}
</g>
