<script>
	import { base } from '$app/paths';
	import { Map, MapSource, MapLayer } from '@onsvisual/svelte-maps';

	export let geometry;
	export let bounds;
</script>

<Map
	style="{base}/data/mapstyle.json"
	location={{ bounds }}
	interactive={false}
	options={{ fitBoundsOptions: { padding: 20 } }}
>
	{#key geometry}
		<MapSource id="boundary" type="geojson" data={geometry}>
			<MapLayer
				id="boundary-fill"
				type="fill"
				paint={{ 'fill-color': 'rgb(17,140,123)', 'fill-opacity': 0.2 }}
			/>
			<MapLayer
				id="boundary-line"
				type="line"
				paint={{ 'line-color': 'rgb(17,140,123)', 'line-width': 2 }}
			/>
		</MapSource>
	{/key}
</Map>
