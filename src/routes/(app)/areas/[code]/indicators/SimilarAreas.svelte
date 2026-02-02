<script lang="ts">
	import { resolve } from '$app/paths';
	import { getName } from '@onsvisual/robo-utils';
	import { ONSpalette } from '$lib/config';
	import { makeCanonicalSlug } from '$lib/api/geo/helpers/areaSlugUtils';
	import { Details, Em } from '@onsvisual/svelte-components';
	import ClusterMap from './ClusterMap.svelte';

	let { areaProps, selectedCluster } = $props();
</script>

<div class="ons-u-mb-l">
	<ul class="map-legend">
		<li>
			<span class="map-legend-marker" style:color={ONSpalette[0]} style:background={ONSpalette[0]}
			></span>
			Areas in {selectedCluster.key} cluster {selectedCluster.cluster.label}
		</li>
		<li>
			<span class="map-legend-marker" style:background="#eee"></span>
			20 areas most similar to {getName(areaProps, 'the')}
		</li>
	</ul>
	<ClusterMap
		{selectedCluster}
		mapDescription="Map showing areas similar to {getName(areaProps, 'the')}"
	/>
	{#if selectedCluster.cluster}
		<p>
			<strong>{getName(areaProps)}</strong> is in
			<Em color={ONSpalette[0]}>
				{selectedCluster.key} cluster {selectedCluster.cluster.label}
			</Em>.
			{selectedCluster.cluster.description}
		</p>
		<p></p>
	{/if}
	<Details title="Show the 20 areas most similar to {getName(areaProps, 'the')}">
		<ol>
			{#each selectedCluster.similar as area}
				<li>
					<a href={resolve(`/areas/${makeCanonicalSlug(area)}/indicators`)}>{getName(area)}</a>
				</li>
			{/each}
		</ol>
	</Details>
</div>

<style>
	.map-legend {
		list-style: none;
		padding: 0;
		margin-top: 0.5em;
	}
	.map-legend > li {
		display: inline;
		white-space: nowrap;
		margin-right: 0.5em;
	}
	.map-legend-marker {
		display: inline-block;
		width: 16px;
		height: 16px;
		margin-right: 0.1em;
		border: 2px solid currentColor;
		background: none;
		border-radius: 50%;
		transform: translateY(2px);
	}
</style>
