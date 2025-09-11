<script>
	import { assets } from '$app/paths';
	import { Map, MapSource, MapLayer } from '@onsvisual/svelte-maps';

	export let geometry;
	export let bounds;
	export let mapDescription;
	export let primaryColor = 'rgb(17, 140, 123)';

	let map, w, h;

	const padding = { left: 40, top: 40, right: 20, bottom: 20 };

	function refitMap(w, h, bounds) {
		if (map) map.fitBounds(bounds, { animate: false, padding });
	}

	$: refitMap(w, h, bounds);
</script>

<div class="map-container" bind:clientWidth={w} bind:clientHeight={h}>
	<Map
		bind:map
		style="{assets}/data/mapstyle-nav.json"
		location={{ bounds }}
		interactive={false}
		options={{
			fitBoundsOptions: { padding }
		}}
		{mapDescription}
	>
		{#key geometry}
			<MapSource id="boundary" type="geojson" data={geometry}>
				<MapLayer
					id="boundary-fill"
					type="fill"
					paint={{ 'fill-color': primaryColor, 'fill-opacity': 0.2 }}
				/>
				<MapLayer
					id="boundary-line"
					type="line"
					paint={{ 'line-color': primaryColor, 'line-width': 2 }}
				/>
			</MapSource>
		{/key}
	</Map>
</div>

<style>
	.map-container {
		position: absolute;
		top: -52px;
		right: 0;
		height: calc(100% + 55.7px);
		width: 35%;
		min-width: 250px;
	}
	.map-container::after {
		position: absolute;
		content: ' ';
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		background-image:
			linear-gradient(to right, #f5f5f6, #00000000 25%),
			linear-gradient(to bottom, #f5f5f6, #00000000 25%);
	}
	@media (max-width: 800px) {
		.map-container {
			display: none;
		}
	}
</style>
