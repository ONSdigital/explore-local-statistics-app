<script lang="ts">
	import { addThousandsSeparator, roundNumber } from '$lib/utils';
	import { colorsLookup } from '$lib/config.js';

	export let indicator, xDomain, data, y, maxLabelWidth, role, hover, chartHeight;

	let labelRectCheck;
	let labelRect;

	$: maxLabelWidth = labelRect ? labelRect.width + 45 : 60;

	$: initialValue = data[data.length - 1];
	$: latestValue = data[0];

	$: changeValue =
		latestValue && initialValue
			? roundNumber(latestValue.value - initialValue.value, indicator.metadata.decimalPlaces)
			: null;

	$: changeText =
		indicator.metadata.prefix +
		addThousandsSeparator(Math.abs(changeValue).toFixed(indicator.metadata.decimalPlaces));

	$: fontSize = changeText.length > 7 ? 16 : changeText.length > 5 ? 18 : hover ? 20 : 24;
</script>

{#if changeValue}
	{#if changeValue != 0}
		<g>
			<text
				style="font-size: {fontSize}px; stroke-width: {fontSize > 20 ? 1 : 0.5}px;"
				x="14000"
				y={hover ? 8 : 10}
				bind:contentRect={labelRectCheck}
				text-anchor="start"
				fill={colorsLookup[role].color}
				stroke={colorsLookup[role].color}>{changeText}</text
			>
		</g>

		{#if labelRectCheck && labelRectCheck.width < 80}
			<g class="label-group">
				<g
					transform="translate(15,{Math.min(
						chartHeight - 10,
						(y(latestValue.value) + y(initialValue.value)) / 2
					)})"
				>
					{#if labelRect}
						<rect
							x={-3}
							y={{ 16: -10, 18: -10, 20: -11, 24: -13 }[fontSize]}
							width={labelRect.width + 20}
							height={{ 16: 23, 18: 23, 20: 25, 24: 29 }[fontSize]}
							fill="white"
							stroke={colorsLookup[role].color}
							stroke-width={hover ? '1.5' : '2px'}
							rx="2px"
						></rect>
					{/if}

					<g>
						<text
							style="font-size: {fontSize}px; stroke-width: {fontSize > 20 ? 1 : 0.5}px;"
							x="14"
							y={{ 16: 7, 18: 8, 20: 8, 24: 10 }[fontSize]}
							bind:contentRect={labelRect}
							text-anchor="start"
							fill={colorsLookup[role].color}
							stroke={colorsLookup[role].color}>{changeText}</text
						>
					</g>

					{#if roundNumber(latestValue.value - initialValue.value, indicator.metadata.decimalPlaces) > 0}
						<path d="M 6 -6 L 6 9" stroke={colorsLookup[role].color} stroke-width="2px"></path>
						<path
							d="M6 -6 l-3 3 l6 0 z"
							stroke={colorsLookup[role].color}
							fill={colorsLookup[role].color}
							stroke-width="2px"
						></path>
					{:else if roundNumber(initialValue.value - latestValue.value, indicator.metadata.decimalPlaces) > 0}
						<path d="M 6 -6 L 6 9" stroke={colorsLookup[role].color} stroke-width="2px"></path>
						<path
							d="M6 9 l-3 -3 l6 0 z"
							stroke={colorsLookup[role].color}
							fill={colorsLookup[role].color}
							stroke-width="2px"
						></path>
					{:else}
						<path d="M 2 2.5 L 10 2.5" stroke={colorsLookup[role].color} stroke-width="2px"></path>
					{/if}
				</g>
			</g>
		{/if}
	{:else}
		<g class="label-group">
			<g
				transform="translate(15,{Math.min(
					chartHeight - 10,
					(y(latestValue.value) + y(initialValue.value)) / 2
				)})"
			>
				{#if labelRect}
					<rect
						x={-3}
						y={-20}
						width={labelRect.width + 8}
						height={38}
						fill="white"
						stroke={colorsLookup[role].color}
						stroke-width={hover ? '1.5' : '2px'}
						rx="2px"
					></rect>
				{/if}

				<g>
					<text
						style="font-size: 16px; stroke-width: {hover ? 0.5 : 1}px;"
						x="0"
						y="-5"
						bind:contentRect={labelRect}
						text-anchor="start"
						fill={colorsLookup[role].color}
						stroke={colorsLookup[role].color}
						>No
					</text>
					<text
						style="font-size: 16px; stroke-width: {hover ? 0.5 : 1}px;"
						x="0"
						y="12"
						bind:contentRect={labelRect}
						text-anchor="start"
						fill={colorsLookup[role].color}
						stroke={colorsLookup[role].color}
						>change
					</text>
				</g>
			</g>
		</g>
	{/if}
{/if}
