<script lang="ts">
	import { colorsLookup } from '$lib/config';

	export let hoverAreaWithDataAdded;
</script>

<div class="hover-key-container">
	{#if hoverAreaWithDataAdded}
		<svg width="60" height="30">
			<path d="M 5 15 L15 15 L25 10  L35 20 L45 15 L55 15" stroke={colorsLookup.selected.color}
			></path>

			{#each [[15, 15], [25, 10], [35, 20], [45, 15]] as coords}
				<circle
					cx={coords[0]}
					cy={coords[1]}
					r="3"
					stroke="white"
					fill={colorsLookup.selected.color}
				></circle>
			{/each}
		</svg>

		<span
			style="color: {colorsLookup.selected.contrast}; background-color: {colorsLookup.selected
				.color}">{hoverAreaWithDataAdded.areanm}</span
		>
	{/if}
</div>

<style>
	.hover-key-container {
		padding: 0px;
		min-height: 40px;
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	path {
		fill: none;
		stroke-width: 2px;
	}

	span {
		padding: 0px 4px;
		border-radius: 2px;
	}
</style>
