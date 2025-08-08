<script lang="ts">
	import Label from '$lib/prototype-components/data-vis/bar-chart/Label.svelte';
	import HoverLabel from '$lib/prototype-components/data-vis/bar-chart/HoverLabel.svelte';

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

	function groupAdjacentItemsWithPositions(arr) {
		const result = {};
		let currentGroup = [];
		let currentGroupIndex = -1;

		for (let i = 0; i < arr.length; i++) {
			const currentItem = arr[i];
			const previousItem = arr[i - 1];

			// Start a new group if:
			// - It's the first item
			// - The current group is empty
			// - The current item's groupIdentifier is different from the previous item's groupIdentifier
			if (
				!previousItem ||
				currentGroup.length === 0 ||
				currentItem.labelOffset !== previousItem.labelOffset
			) {
				// If currentGroup is not empty, add positions to result for items in the previous group
				if (currentGroup.length > 0) {
					currentGroup.forEach((itemId, index) => {
						result[itemId] = {
							groupLength: currentGroup.length,
							groupPosition: index
						};
					});
				}
				// Start a new group
				currentGroup = [currentItem.datum.areacd];
				currentGroupIndex++;
			} else {
				// Add the item to the current group
				currentGroup.push(currentItem.datum.areacd);
			}
		}

		// Add positions to result for items in the last group
		if (currentGroup.length > 0) {
			currentGroup.forEach((itemId, index) => {
				result[itemId] = {
					groupLength: currentGroup.length,
					groupPosition: index
				};
			});
		}

		return result;
	}
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
