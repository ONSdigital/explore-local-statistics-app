<script>
	import { colorsLookup } from '$lib/config';
	import Icon from '$lib/components/Icon.svelte';

	export let area,
		chosen,
		customLookup,
		markerRadius,
		markerShape = 'circle',
		button = true,
		fontSize = '18.66px',
		fontWeight = 'normal',
		backgroundColor = 'contrast',
		color = 'color',
		borderColor = null,
		showConfidenceIntervals = false;

	//when the panel is selected, if chosen is defined (e.g. - if the component has been passed a selectionsObject entry), remove this area from the entry array or, if the entry is not an array, set the entry to none
	const onClickEvent = () => {
		chosen = Array.isArray(chosen) ? chosen.filter((el) => el != area.areacd) : 'none';
	};

	//determines the color object based on the role of the area
	$: col = area
		? area.role === 'custom'
			? Object.keys(customLookup).length > colorsLookup.custom.length
				? colorsLookup.customExceedThreshold
				: colorsLookup.custom[area.areacd in customLookup ? customLookup[area.areacd] : 0]
			: colorsLookup[area.role]
		: { color: null, constrast: null };

	$: bgColor = ['color', 'contrast'].includes(backgroundColor)
		? col[backgroundColor]
		: backgroundColor;

	$: txtColor =
		borderColor && ['color', 'contrast'].includes(borderColor)
			? col[borderColor]
			: borderColor
				? borderColor
				: ['color', 'contrast'].includes(color)
					? col[color]
					: color;

	$: fillColor = !borderColor
		? txtColor
		: ['color', 'contrast'].includes(color)
			? col[color]
			: color;

	$: label = area ? ('label' in area ? area.label : area.areanm) : null;
</script>

{#if button}
	{#if area}
		<button
			on:click={onClickEvent}
			class="visible-area-container"
			style="background-color: {bgColor}; font-weight: {fontWeight}; font-size: {fontSize};"
		>
			<span style="color: {txtColor}"
				>{label}
				<Icon type="close" margin="0 0 0 4px" /></span
			>
		</button>
	{/if}
{:else if area}
	<div
		class="visible-area-container marker-area-container"
		style="background-color: #fff; font-weight: {fontWeight}; font-size: {fontSize};"
	>
		{#if markerRadius}
			<svg width="20" height="20">
				{#if showConfidenceIntervals}
					<line
						x1="4"
						x2="16"
						y1="10"
						y2="10"
						stroke={fillColor}
						stroke-width="12px"
						opacity="0.4"
					/>
					<line x1="10" x2="10" y1="2" y2="18" stroke="white" stroke-width="6px" />
					<line x1="10" x2="10" y1="2" y2="18" stroke={fillColor} stroke-width="4px" />
				{:else if markerShape === 'square'}
					<rect
						x={10 - markerRadius * 0.8}
						y={10 - markerRadius * 0.8}
						width={markerRadius * 1.6}
						height={markerRadius * 1.6}
						stroke={borderColor}
						stroke-width={borderColor ? 1 : null}
						fill={fillColor}
					/>
				{:else if markerShape === 'diamond'}
					<polygon
						points="{10 - markerRadius},10 10,{10 - markerRadius} {10 + +markerRadius},10 10,{10 +
							+markerRadius} {10 - markerRadius},10"
						stroke={borderColor}
						stroke-width={borderColor ? 1 : null}
						fill={fillColor}
					/>
				{:else}
					<circle
						cx="10"
						cy="10"
						r={markerRadius}
						stroke={borderColor}
						stroke-width={borderColor ? 1 : null}
						fill={fillColor}
					/>
				{/if}
			</svg>
		{/if}
		<span style="color: {txtColor}"
			>{label} {showConfidenceIntervals ? ' (with 95% confidence intervals)' : ''}</span
		>
	</div>
{/if}

<style>
	button {
		text-align: left;
		font-family: inherit;
		background: none;
		border: none;
		padding: 6px !important;
		border-radius: 3px;
	}

	.visible-area-container {
		margin: 0 4px 4px 0;
		padding: 4px 0;
		display: inline-flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 15px;
		align-items: center;
	}

	span {
		flex: 1;
		line-height: 20px;
	}

	.marker-area-container {
		gap: 5px;
	}
</style>
