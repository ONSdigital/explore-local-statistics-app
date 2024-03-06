<script>
	import { colorsLookup } from '$lib/config';

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
	$: bdColor = ['color', 'contrast'].includes(borderColor) ? color[borderColor] : borderColor;

	$: label = area ? ('label' in area ? area.label : area.areanm) : null;

	$: console.log(customLookup);
</script>

{#if button}
	{#if area}
		<button
			on:click={onClickEvent}
			class="visible-area-container"
			style="background-color: {bgColor}; border-color: {bdColor}; font-weight: {fontWeight}; font-size: {fontSize};"
		>
			<span style="color: {txtColor}">{label}</span>

			<svg
				cursor="pointer"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				viewBox="0 0 36 24"
				width="20"
				><path stroke={txtColor} fill="none" stroke-width="3px" d="M 1 1 l22 22 M23 1 l-22 22"
				></path></svg
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
				{#if markerShape === 'diamond'}
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
