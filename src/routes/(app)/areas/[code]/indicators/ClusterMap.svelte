<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import bbox from '@turf/bbox';
	import { getName } from '@onsvisual/robo-utils';
	import { Map, MapSource, MapLayer, MapTooltip } from '@onsvisual/svelte-maps';
	import { getMapFeatures } from '$lib/utils';
	import { ukBounds, ONScolours } from '$lib/config';

	let features = $state.raw();

	const fitBoundsOptions = { padding: 10 };

	let { areaProps, selectedCluster } = $props();

	let mapDescription = $derived(`Map showing areas similar to ${getName(areaProps, 'the')}`);
	let similarAreas = $derived(
		features ? [areaProps, ...selectedCluster.similar].map((area) => features[area.areacd]) : []
	);
	let clusterAreas = $derived(
		features && selectedCluster.cluster
			? selectedCluster.cluster.areas.map((area) => features[area.areacd])
			: []
	);
	let combinedAreas = $derived([...similarAreas, ...clusterAreas]);
	let bounds = $derived(
		similarAreas.length || clusterAreas.length
			? bbox({
					type: 'FeatureCollection',
					features: combinedAreas
				})
			: ukBounds
	);

	let map = $state();
	let hovered = $state();

	function fitBounds(bounds) {
		if (map) map.fitBounds(bounds, fitBoundsOptions);
	}
	$effect(() => fitBounds(bounds));

	onMount(async () => (features = await getMapFeatures()));
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
			preserveDrawingBuffer: true,
			dragRotate: false
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
					paint={{ 'fill-color': ONScolours.oceanBlue, 'fill-opacity': 0.7 }}
					order="place_other"
				/>
				<MapLayer
					id="cluster-line"
					type="line"
					paint={{
						'line-color': 'white',
						'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 11, 1.2]
					}}
					order="place_other"
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
				id="similar-outline"
				type="line"
				paint={{ 'line-color': 'white', 'line-width': 3 }}
				order="place_suburb"
			/>
			<MapLayer
				id="similar-line"
				type="line"
				paint={{ 'line-color': 'black', 'line-width': 2 }}
				order="place_suburb"
			/>
		</MapSource>
		<MapSource
			id="combined"
			type="geojson"
			data={{ type: 'FeatureCollection', features: combinedAreas }}
			promoteId="areacd"
		>
			<MapLayer
				id="combined-fill"
				type="fill"
				paint={{ 'fill-color': 'rgba(0,0,0,0)' }}
				hover
				bind:hovered
			>
				<MapTooltip content={features?.[hovered]?.properties?.areanm} />
			</MapLayer>
			<MapLayer
				id="combined-hover"
				type="line"
				paint={{
					'line-color': [
						'case',
						['==', ['feature-state', 'hovered'], true],
						ONScolours.highlightOrangeDark,
						'rgba(255,255,255,0)'
					],
					'line-width': 2
				}}
				order="place_village"
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
