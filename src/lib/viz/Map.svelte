<script lang="ts">
	//@ts-nocheck
	import { onMount, createEventDispatcher } from 'svelte';
	import { base } from '$app/paths';
	import { makeFeatures } from '$lib/util/geo/makeFeatures';
	import { Map, MapSource, MapLayer } from '@onsvisual/svelte-maps';
	import BreaksChart from './BreaksChart.svelte';

	export let data;
	export let breaks;
	export let selected = [];
	export let hovered = null;
	export let unit = '';
	export let dp = 0;
	export let colors = [
		'rgb(234, 236, 177)',
		'rgb(169, 216, 145)',
		'rgb(0, 167, 186)',
		'rgb(0, 78, 166)',
		'rgb(0, 13, 84)'
	];
	export let markerColors = ['#206095', '#a8bd3a', '#871a5b', '#27a0cc', 'grey'];
	export let topoPath = `${base}/data/topo.json`;

	let features;

	const dispatch = createEventDispatcher();

	function doHover(e) {
		const area = e.detail?.feature?.properties || e.detail?.d;
		hovered = area?.areacd;
		dispatch('hover', { id: hovered, area, e });
	}

	function doSelect(e) {
		const area = e.detail?.feature?.properties || e.detail?.d;
		dispatch('select', { id: area?.areacd, area, e });
	}

	const featureCollection = (features, data) => ({
		type: 'FeatureCollection',
		features: data.map((d, i) => {
			const feature = features[d.areacd];
			feature.properties = { ...d, color: data.length < 6 ? markerColors[i] : colors[d.cluster] };
			console.log(d, i, feature.properties.color);
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
					on:select={doSelect}
					highlight
					highlighted={selected?.[0] ? selected.map((s) => s.areacd) : []}
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
							'rgba(255,255,255,0)'
						],
						'line-width': 2
					}}
					order="place_suburb"
				/>
			</MapSource>
			{#if selected[0]}
				<MapSource
					id="selected"
					type="geojson"
					data={featureCollection(features, selected)}
					promoteId="areacd"
				>
					<MapLayer
						id="selected"
						type="line"
						paint={{
							'line-color': ['get', 'color'],
							'line-width': 2
						}}
						order="place_other"
					/>
				</MapSource>
			{/if}
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
