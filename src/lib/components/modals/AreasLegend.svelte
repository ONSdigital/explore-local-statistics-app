<script lang="ts">
	import { getName } from '@onsvisual/robo-utils';
	import { Icon } from '@onsvisual/svelte-components';
	import { ONScolours, maxAreasSelectable } from '$lib/config';
	import { getPaletteColor, getMarkerPath } from '../charts/chartHelpers';

	let {
		selectedAreas = [],
		selectedGeoGroup = null,
		useMarkerShapes = true,
		inlineItems = false,
		hovered = false
	} = $props();

	let _selectedAreas = $derived(selectedAreas.map((s, i) => ({ ...s, i })));
	let maxVisibleAreas = $derived(inlineItems ? maxAreasSelectable : selectedGeoGroup ? 3 : 4);
	let moreAreasHidden = $state(true);
</script>

{#snippet marker(area: areaObject | null = null, count: number | null = null)}
	<svg viewBox="-4 -4 8 8" class="area-marker">
		<path
			d={useMarkerShapes ? getMarkerPath(area?.i, count) : getMarkerPath(0)}
			fill={hovered
				? ONScolours.highlightOrangeDark
				: area?.i != null
					? getPaletteColor(area?.i, count)
					: '#ddd'}
			stroke={hovered
				? ONScolours.highlightOrangeDark
				: area?.i != null
					? getPaletteColor(area?.i, count)
					: '#aaa'}
			opacity={area?.i == null ? 0.9 : 1}
		/>
	</svg>
{/snippet}

{#snippet item(area: areaObject, count: number)}
	<li
		class:inline={inlineItems}
		class="ons-u-fs-r--b"
		style:color={hovered ? ONScolours.highlightOrangeDark : getPaletteColor(area.i, count, 'text')}
	>
		{@render marker(area, count)}
		{getName(area)}
	</li>
{/snippet}

<div class="areas-legend">
	<p class="ons-u-vh">Selected areas:</p>
	<ul>
		{#each _selectedAreas.slice(0, maxVisibleAreas) as area, i}
			{@render item(area, _selectedAreas.length)}
		{/each}
		{#if selectedAreas.length > maxVisibleAreas}
			<div id="more-selected-areas" style:display={moreAreasHidden ? 'none' : 'contents'}>
				{#each _selectedAreas.slice(maxVisibleAreas) as area, i}
					{@render item(area, _selectedAreas.length)}
				{/each}
			</div>
		{/if}
		{#if selectedGeoGroup}
			<li style:color="#707070">
				{@render marker()}
				{selectedGeoGroup.label}
			</li>
		{/if}
		{#if _selectedAreas.length > maxVisibleAreas}
			<button
				type="button"
				class="ons-btn-link ons-u-fs-rs"
				aria-controls="more-selected-areas"
				aria-expanded={moreAreasHidden ? 'false' : 'true'}
				onclick={() => (moreAreasHidden = !moreAreasHidden)}
			>
				<Icon type="carret" rotation={!moreAreasHidden ? 180 : 0} />
				<span
					>{moreAreasHidden
						? `Show ${_selectedAreas.length - maxVisibleAreas} more area${_selectedAreas.length - maxVisibleAreas === 1 ? '' : 's'}`
						: 'Show fewer areas'}</span
				>
			</button>
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
	.areas-legend > ul li {
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
	.ons-btn-link {
		margin-top: 0.3rem;
	}
</style>
