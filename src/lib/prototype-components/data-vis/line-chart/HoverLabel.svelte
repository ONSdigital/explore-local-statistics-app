<script lang="ts">
	import { splitTextIntoRows } from '$lib/utils.js';
	import { colorsLookup } from '$lib/config';

	export let label, maxLabelWidth, y, isHoverLabelVisible;

	$: backgroundColor = colorsLookup['selected'].color;
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
		isOneLineLabelVisilble || isTwoLineLabelVisilble || isThreeLineLabelVisilble;
</script>

<g class="label-group" transform="translate(0,{y(label.data[0].value) + 6})">
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
</g>
