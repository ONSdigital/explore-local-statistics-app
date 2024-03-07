<script>
	import { colorsLookup } from '$lib/config';
	import Icon from '$lib/components/Icon.svelte';

	export let area,
		chosen,
		customLookup,
		markerRadius,
		markerShape = 'circle',
		button = true,
		fontSize = '18px',
		fontWeight = 'normal',
		backgroundColor = 'contrast',
		textColor = 'color',
		borderColor = 'color';

	const onClickEvent = () => {
		chosen = Array.isArray(chosen) ? chosen.filter((el) => el != area.areacd) : null;
	};

	$: color = area
		? area.role === 'custom'
			? Object.keys(customLookup).length > colorsLookup.custom.length
				? colorsLookup.customExceedThreshold
				: colorsLookup.custom[area.areacd in customLookup ? customLookup[area.areacd] : 0]
			: colorsLookup[area.role]
		: { color: null, constrast: null };

	$: bgColor = ['color', 'contrast'].includes(backgroundColor)
		? color[backgroundColor]
		: backgroundColor;
	$: txtColor = ['color', 'contrast'].includes(textColor) ? color[textColor] : textColor;

	$: label = area ? ('label' in area ? area.label : area.areanm) : null;

	$: console.log('area-color', area, color);
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
		<!-- {:else}
		<div class="none-selected">
			<span>None</span>
		</div> -->
	{/if}
{:else if area}
	<div
		class="visible-area-container marker-area-container"
		style="background-color: {bgColor}; font-weight: {fontWeight}; font-size: {fontSize};"
	>
		{#if markerRadius}
			<svg width="20" height="20">
				{#if markerShape === 'square'}
					<rect
						x={10 - markerRadius * 0.8}
						y={10 - markerRadius * 0.8}
						width={markerRadius * 1.6}
						height={markerRadius * 1.6}
						stroke="none"
						fill={txtColor}
					/>
				{:else if markerShape === 'diamond'}
					<polygon
						points="{10 - markerRadius},10 10,{10 - markerRadius} {10 + +markerRadius},10 10,{10 +
							+markerRadius} {10 - markerRadius},10"
						stroke="none"
						fill={txtColor}
					/>
				{:else}
					<circle cx="10" cy="10" r={markerRadius} stroke="none" fill={txtColor} />
				{/if}
			</svg>
		{/if}
		<span style="color: {txtColor}">{label}</span>
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
		/* border-style: solid;
		border-width: 1.5px;
		border-radius: 4px; */
	}

	span {
		flex: 1;
		line-height: 20px;
	}

	.marker-area-container {
		gap: 5px;
	}

	.none-selected {
		border-radius: 4px;
		text-align: left;
		border: none;
		background: #707071;
		color: white;
		margin: 2px 5px;
		padding: 3px 5px;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
	}

	.none-selected span {
		flex: 1;
	}
</style>
