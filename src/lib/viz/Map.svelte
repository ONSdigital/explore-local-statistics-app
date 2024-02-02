<script lang="ts">
	//@ts-nocheck
	import { onMount, createEventDispatcher } from 'svelte';
	import { base } from '$app/paths';
	import { makeFeatures } from '$lib/util/geo/makeFeatures';
	import { Map, MapSource, MapLayer } from '@onsvisual/svelte-maps';
	import BreaksChart from './BreaksChart.svelte';

	export let data;
	export let breaks;
	export let selected;
	export let hovered;
	export let unit;
	export let dp = 0;

	let features;

	const dispatch = createEventDispatcher();
	const colors = [
		'rgb(234, 236, 177)',
		'rgb(169, 216, 145)',
		'rgb(0, 167, 186)',
		'rgb(0, 78, 166)',
		'rgb(0, 13, 84)'
	];
	const topoPath = `${base}/data/topo.json`;

	function doHover(e) {
		hovered = e.detail?.feature?.properties?.areacd || e.detail?.d?.areacd;
		dispatch('hover', { id: hovered, e });
	}

	function doSelect(e) {
		selected = e.detail?.feature?.properties?.areacd || e.detail?.d?.areacd;
		dispatch('select', { id: selected, e });
	}

	const featureCollection = (features, data) => ({
		type: 'FeatureCollection',
		features: data.map((d) => {
			const feature = features[d.areacd];
			feature.properties = { ...d, color: colors[d.cluster] };
			return feature;
		})
	});

	onMount(async () => (features = await makeFeatures(topoPath)));
</script>

<div class="map-container">
	<Map
		style="{base}/data/mapstyle.json"
		location={{ bounds: [-8.65, 49.8823, 1.7637, 60.8608] }}
		options={{
			fitBoundsOptions: { padding: 10 },
			maxBounds: [-19, 48, 12, 62],
			cooperativeGestures: true,
			preserveDrawingBuffer: true
		}}
		controls
	>
		{#if features}
			<MapSource
				id="features"
				type="geojson"
				data={featureCollection(features, data)}
				promoteId="areacd"
			>
				<MapLayer
					id="fills"
					type="fill"
					paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.7 }}
					order="place_other"
					hover
					{hovered}
					let:hovered
					on:hover={doHover}
					select
					{selected}
					on:select={doSelect}
				/>
				<MapLayer
					id="lines"
					type="line"
					paint={{ 'line-color': 'white', 'line-width': 0.5 }}
					order="place_other"
				/>
				<MapLayer
					id="highlight"
					type="line"
					paint={{
						'line-color': [
							'case',
							['==', ['feature-state', 'hovered'], true],
							'orange',
							['==', ['feature-state', 'selected'], true],
							'black',
							'rgba(255,255,255,0)'
						],
						'line-width': 2
					}}
					order="place_other"
				/>
			</MapSource>
		{/if}
	</Map>
</div>
<BreaksChart
	{data}
	{breaks}
	{hovered}
	{selected}
	prefix={unit === '£' ? unit : ''}
	suffix={!unit || unit === '£' ? '' : unit === '%' ? unit : ` ${unit}`}
	formatTick={(d) =>
		d.toLocaleString(undefined, {
			minimumFractionDigits: dp,
			maximumFractionDigits: dp
		})}
	on:select={doSelect}
	on:hover={doHover}
/>

<style>
	.map-container {
		display: block;
		width: 100%;
		height: 500px;
	}
</style>
