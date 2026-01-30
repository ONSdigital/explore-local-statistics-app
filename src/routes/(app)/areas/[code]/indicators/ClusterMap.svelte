<script lang="ts">
	import { resolve } from '$app/paths';
	import { feature } from 'topojson-client';
	import bbox from '@turf/bbox';
	import { Map, MapSource, MapLayer, MapTooltip } from '@onsvisual/svelte-maps';
	import topo from '$lib/data/topo.json';
	import { ONSpalette } from '$lib/config';

	const features = (() => {
		const features = {};
		for (const key in topo.objects) {
			const geojson = feature(topo, key);
			for (const f of geojson.features) features[f.properties.areacd] = f;
		}
		return features;
	})();

	const fitBoundsOptions = { padding: 10 };

	let { selectedCluster, mapDescription } = $props();

	let similarAreas = $derived(selectedCluster.similar.map((area) => features[area.areacd]));
	let clusterAreas = $derived(
		selectedCluster.cluster
			? selectedCluster.cluster.areas.map((area) => features[area.areacd])
			: []
	);
	let bounds = $derived(
		bbox({
			type: 'FeatureCollection',
			features: [...similarAreas, ...clusterAreas]
		})
	);

	let map = $state();
	let hovered = $state();

	function fitBounds(bounds) {
		if (map) map.fitBounds(bounds, fitBoundsOptions);
	}
	$effect(() => fitBounds(bounds));
</script>

<div class="map-container">
	<Map
		bind:map
		css={resolve('/css/maplibre-gl.css')}
		style={resolve('/data/mapstyle.json')}
		location={{ bounds }}
		options={{
			fitBoundsOptions,
			maxBounds: [-19, 48, 12, 62],
			cooperativeGestures: true,
			preserveDrawingBuffer: true
		}}
		controls
		{mapDescription}
	>
		{#if clusterAreas.length > 0}
			<MapSource
				id="cluster"
				type="geojson"
				data={{ type: 'FeatureCollection', features: clusterAreas }}
				promoteId="areacd"
			>
				<MapLayer
					id="cluster-fill"
					type="fill"
					paint={{ 'fill-color': ONSpalette[0], 'fill-opacity': 0.7 }}
					order="place_other"
					hover
					bind:hovered
				>
					<MapTooltip content={features?.[hovered]?.properties?.areanm} />
				</MapLayer>
				<MapLayer
					id="cluster-line"
					type="line"
					paint={{ 'line-color': 'white', 'line-width': 0.5 }}
					order="place_other"
				/>
				<MapLayer
					id="cluster-hover"
					type="line"
					paint={{
						'line-color': [
							'case',
							['==', ['feature-state', 'hovered'], true],
							'orange',
							'rgba(255,255,255,0)'
						],
						'line-width': 2
					}}
					order="place_suburb"
				/>
			</MapSource>
		{/if}
		<MapSource
			id="similar"
			type="geojson"
			data={{ type: 'FeatureCollection', features: similarAreas }}
			promoteId="areacd"
		>
			<MapLayer
				id="similar-line"
				type="line"
				paint={{ 'line-color': 'black', 'line-width': 1.5 }}
				order="place_other"
			/>
		</MapSource>
	</Map>
</div>

<style>
	.map-container {
		display: block;
		width: 100%;
		height: 500px;
		margin: 1rem 0;
	}
</style>
