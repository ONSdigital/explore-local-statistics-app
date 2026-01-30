<script lang="ts">
	import { getName, pluralise } from '@onsvisual/robo-utils';
	import { ONSpalette, ONStextPalette, markerPathsArray } from '$lib/config';

	let { selectedAreas = [], selectedGeoGroup = null } = $props();
</script>

{#snippet marker(i: number | null = null)}
	<svg viewBox="-4 -4 8 8" class="area-marker">
		<path
			d={markerPathsArray[i ?? 0]}
			fill={i != null ? ONSpalette[i] : '#ddd'}
			stroke={i != null ? ONSpalette[i] : '#aaa'}
			opacity={i == null ? 0.9 : 1}
		/>
	</svg>
{/snippet}

<div class="areas-legend">
	<p class="ons-u-vh">Selected areas:</p>
	<ul>
		{#each selectedAreas as area, i}
			<li class="ons-u-fs-r--b" style:color={ONStextPalette[i]}>
				{@render marker(i)}
				{getName(area)}
			</li>
		{/each}
		{#if selectedGeoGroup}
			<li style:color="#707070">
				{@render marker()}
				{pluralise(selectedGeoGroup.label)}
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
	.area-marker {
		display: inline-block;
		width: 20px;
		height: 20px;
		transform: translateY(3px);
		stroke-width: 1px;
	}
</style>
