<script lang="ts">
	import { colorsLookup } from '$lib/config';

	export let visibleAreasWithData, combinedSelectableAreaTypesObject;
</script>

{#if visibleAreasWithData[1].length > 0}
	<div class="related-areas-key-container">
		{#if visibleAreasWithData[1].some((el) => el.role === 'sameRegion')}
			<div class="inline-container" style="border-color: {colorsLookup.sameRegion.color};">
				<div class="row-container">
					<svg width="60" height="30">
						<g>
							<path
								d="M 5 15 L15 15 L25 10  L35 20 L45 15 L55 15"
								stroke={colorsLookup.sameRegion.color}
							></path>
						</g>
					</svg>

					<span style="color: {colorsLookup.sameRegion.contrast};"
						>{combinedSelectableAreaTypesObject.sameRegion.label}</span
					>
				</div>
			</div>
		{/if}
		{#if visibleAreasWithData[1].some((el) => el.role === 'similar')}
			<div class="inline-container" style="border-color: {colorsLookup.similar.color};">
				<div class="row-container">
					<svg width="60" height="30">
						<g>
							<path
								d="M 5 15 L15 15 L25 10  L35 20 L45 15 L55 15"
								stroke={colorsLookup.similar.color}
							></path>
						</g>
					</svg>

					<span style="color: {colorsLookup.similar.contrast};"
						>{combinedSelectableAreaTypesObject.similar.label}</span
					>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.related-areas-key-container {
		margin: 0px;
		min-height: 40px;
		display: flex;
		flex-direction: row;
		gap: 10px;
		align-items: center;
	}

	.inline-container {
		display: inline-block;
		border-radius: 4px;
		border-style: solid;
		border-width: 1.5px;
	}

	.row-container {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	path {
		fill: none;
		stroke-width: 2px;
		opacity: 1;
	}

	span {
		padding: 0px 4px 0px 2px;
		opacity: 0.8;
	}
</style>
