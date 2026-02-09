<script lang="ts">
	import { getName } from '@onsvisual/robo-utils';
	import { ONScolours } from '$lib/config';
	import { getPaletteColor, getMarkerPath } from '../charts/chartHelpers';

	let {
		selectedAreas = [],
		selectedGeoGroup = null,
		useMarkerShapes = true,
		inlineItems = false,
		hovered = false
	} = $props();
</script>

{#snippet marker(i: number | null = null)}
	<svg viewBox="-4 -4 8 8" class="area-marker">
		<path
			d={useMarkerShapes ? getMarkerPath(i, selectedAreas.length) : getMarkerPath(0)}
			fill={hovered
				? ONScolours.highlightOrangeDark
				: i != null
					? getPaletteColor(i, selectedAreas.length)
					: '#ddd'}
			stroke={hovered
				? ONScolours.highlightOrangeDark
				: i != null
					? getPaletteColor(i, selectedAreas.length)
					: '#aaa'}
			opacity={i == null ? 0.9 : 1}
		/>
	</svg>
{/snippet}

<div class="areas-legend">
	<p class="ons-u-vh">Selected areas:</p>
	<ul>
		{#each selectedAreas as area, i}
			<li
				class:inline={inlineItems}
				class="ons-u-fs-r--b"
				style:color={hovered
					? ONScolours.highlightOrangeDark
					: getPaletteColor(i, selectedAreas.length, 'text')}
			>
				{@render marker(i)}
				{getName(area)}
			</li>
		{/each}
		{#if selectedGeoGroup}
			<li style:color="#707070">
				{@render marker()}
				{selectedGeoGroup.label}
			</li>
		{/if}
	</ul>
</div>

<style>
	.areas-legend {
		flex-grow: 1;
	}
	.areas-legend > ul {
		list-style-type: none;
		padding: 0;
		margin: 0;
	}
	.areas-legend > ul > li {
		margin: 0;
		line-height: 1.5;
	}
	.areas-legend li.inline {
		display: inline-flex;
		margin-right: 0.75rem;
	}
	.area-marker {
		display: inline-block;
		width: 20px;
		height: 20px;
		transform: translateY(3px);
		stroke-width: 1px;
	}
</style>
