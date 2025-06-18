<script lang="ts">
	import { splitString } from '$lib/segmentTextForLabels';
	import { colorsLookup } from '$lib/config';

	export let label, maxLabelWidth, y, isHoverLabelVisible, fontSize, labelSpace;

	// $: console.log(labelSpace);

	$: areaName = label.areanm;

	$: textArrayOptions = [
		[areaName],
		...splitString(areaName, 4, 0),
		...splitString(areaName, 4, 1)
	];

	let labelRectArray = [];

	/*$: backgroundColor = colorsLookup['selected'].color;
	$: textColor = colorsLookup['selected'].contrast;

	$: oneLineLabelArray = [label.areanm];
	let oneLineLabelBBox;
	$: isOneLineLabelVisilble = oneLineLabelBBox ? oneLineLabelBBox.width <= maxLabelWidth : true;

	$: twoLineLabelArray = splitTextIntoRows(label.areanm, 2);
	let twoLineLabelBBox;
	$: showTwoLineLabel =
		oneLineLabelBBox &&
		oneLineLabelBBox.width > maxLabelWidth &&
		!twoLineLabelArray.some((el) => el === '');
	$: isTwoLineLabelVisilble = showTwoLineLabel
		? twoLineLabelBBox
			? twoLineLabelBBox.width <= maxLabelWidth
			: true
		: false;

	$: threeLineLabelArray = splitTextIntoRows(label.areanm, 3);
	let threeLineLabelBBox;
	$: showThreeLineLabel =
		showTwoLineLabel &&
		twoLineLabelBBox &&
		twoLineLabelBBox.width > maxLabelWidth &&
		!threeLineLabelArray.some((el) => el === '');
	$: isThreeLineLabelVisilble = showThreeLineLabel
		? threeLineLabelBBox
			? threeLineLabelBBox.width <= maxLabelWidth
			: true
		: false;

	$: isHoverLabelVisible =
		isOneLineLabelVisilble || isTwoLineLabelVisilble || isThreeLineLabelVisilble;*/

	// $: console.log(labelRectArray);
</script>

<g class="hover-label-container">
	<path
		transform="translate(2,0)"
		d="M5 {y(label.data[0].value)} l10 0"
		stroke={colorsLookup['selected'].color}
		fill="none"
		stroke-width="1px"
	></path>

	{#each textArrayOptions as textArray, i}
		{#if i === 0 || (labelRectArray[i - 1] && labelRectArray[i - 1].width > labelSpace)}
			<g
				transform="translate(20,{y(label.data[0].value) + 4})"
				opacity={labelRectArray[i] &&
				labelRectArray[i].width <= labelSpace &&
				(i === 0 || (labelRectArray[i - 1] && labelRectArray[i - 1].width > labelSpace))
					? 1
					: 0}
			>
				{#if labelRectArray[i]}
					<rect
						x={-4}
						y={-4 + -labelRectArray[i].height / 2 - fontSize / 4.5}
						width={labelRectArray[i].width + 14}
						height={Math.max(
							0,
							labelRectArray[i].height -
								fontSize / 4.5 +
								(/[qgyp]/.test(textArray[textArray.length - 1]) ? 10 : 8)
						)}
						fill={colorsLookup['selected'].color}
						stroke="none"
						stroke-width="1.5px"
						rx="2px"
					></rect>
				{/if}

				<g bind:contentRect={labelRectArray[i]}>
					{#each textArray as line, j}
						<text
							x="3"
							style="font-size: {fontSize}px;"
							y={-textArray.length * (fontSize / 2) + j * fontSize + fontSize / 2}
							fill={colorsLookup['selected'].contrast}
							stroke="none">{line}</text
						>
					{/each}
				</g>
			</g>
		{/if}
	{/each}
</g>

<!-- <g class="label-group" transform="translate(0,{y(label.data[0].value) + 6})">
	<g
		class="one-line-label-group"
		transform="translate({oneLineLabelBBox && oneLineLabelBBox.width > maxLabelWidth ? 9999 : 0},0)"
	>
		{#if oneLineLabelBBox}
			<rect
				x={-3}
				width={oneLineLabelBBox.width + 6}
				y={oneLineLabelBBox.y - 18}
				height={oneLineLabelBBox.height}
				rx="2px"
				stroke="none"
				fill={backgroundColor}
			></rect>
		{/if}

		<g bind:contentRect={oneLineLabelBBox}>
			{#each oneLineLabelArray as line, i}
				<text y={18 * i} fill={textColor}>{line}</text>
			{/each}
		</g>
	</g>

	{#if showTwoLineLabel}
		<g
			class="two-line-label-group"
			transform="translate({twoLineLabelBBox && twoLineLabelBBox.width > maxLabelWidth
				? 9999
				: 0},0)"
		>
			{#if twoLineLabelBBox}
				<rect
					x={-3}
					width={twoLineLabelBBox.width + 6}
					y={twoLineLabelBBox.y - 18}
					height={twoLineLabelBBox.height}
					rx="2px"
					stroke="none"
					fill={backgroundColor}
				></rect>
			{/if}

			<g bind:contentRect={twoLineLabelBBox}>
				{#each twoLineLabelArray as line, i}
					<text y={18 * i} fill={textColor}>{line}</text>
				{/each}
			</g>
		</g>
	{/if}

	{#if showThreeLineLabel}
		<g
			class="three-line-label-group"
			transform="translate({threeLineLabelBBox && threeLineLabelBBox.width > maxLabelWidth
				? 9999
				: 0},0)"
		>
			{#if threeLineLabelBBox}
				<rect
					x={-3}
					width={threeLineLabelBBox.width + 6}
					y={threeLineLabelBBox.y - 18}
					height={threeLineLabelBBox.height}
					rx="2px"
					stroke="none"
					fill={backgroundColor}
				></rect>
			{/if}

			<g bind:contentRect={threeLineLabelBBox}>
				{#each threeLineLabelArray as line, i}
					<text y={18 * i} fill={textColor}>{line}</text>
				{/each}
			</g>
		</g>
	{/if}
</g> -->
