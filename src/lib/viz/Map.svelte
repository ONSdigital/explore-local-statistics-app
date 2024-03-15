<script lang="ts">
	//@ts-nocheck
	import { onMount, createEventDispatcher } from 'svelte';
	import { base } from '$app/paths';
	import bbox from '@turf/bbox';
	import { makeFeatures } from '$lib/util/geo/makeFeatures';
	import { countryLookup } from '$lib/config/geoConfig';
	import { Map, MapSource, MapLayer, MapTooltip } from '@onsvisual/svelte-maps';
	import { colorsLookup } from '$lib/config';
	import BreaksChart from './BreaksChart.svelte';

	export let data;
	export let breaks = null;
	export let geos = null;
	export let prefix = '';
	export let suffix = '';
	export let selected = [];
	export let hovered = null;
	export let dp = 0;
	export const colors = {
		0: 'rgb(234, 236, 177)',
		1: 'rgb(169, 216, 145)',
		2: 'rgb(0, 167, 186)',
		3: 'rgb(0, 78, 166)',
		4: 'rgb(0, 13, 84)',
		a: '#206095',
		b: '#27A0CC',
		c: '#871A5B',
		d: '#A8BD3A'
	};
	export let topoPath = `${base}/data/topo.json`;
	export let customLookup = null;
	export let legendType = 'choropleth';
	export let clusterKey = 'cluster';

	let features, bounds;

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

	const featureCollection = (features, data, options = {}) => {
		const selectedArea =
			!options.boundary && clusterKey !== 'cluster' && selected.length === 1
				? data.find((d) => d.areacd === selected[0].areacd)
				: null;
		return {
			type: 'FeatureCollection',
			features: data
				.map((d) => {
					const feature = features[d.areacd];
					if (!feature) return null;
					feature.properties = {
						...feature.properties,
						...d,
						color: options.boundary
							? getColor(d)?.color || 'lightgrey'
							: clusterKey !== 'cluster'
								? getClusterColor(d, selectedArea)
								: colors[d[clusterKey]] || 'lightgrey'
					};
					return feature;
				})
				.filter((f) => f !== null)
		};
	};

	function getColor(area) {
		if (!customLookup) return { color: 'black', contrast: null };
		return area
			? area.role === 'custom'
				? Object.keys(customLookup).length > colorsLookup.custom.length
					? colorsLookup.customExceedThreshold
					: colorsLookup.custom[area.areacd in customLookup ? customLookup[area.areacd] : 0]
				: colorsLookup[area.role]
			: { color: null, constrast: null };
	}

	function getClusterColor(area, selectedArea) {
		if (area[clusterKey] === selectedArea?.[clusterKey]) return colors[area[clusterKey]];
		return 'lightgrey';
	}

	onMount(async () => {
		features = await makeFeatures(topoPath);
		const countryCodes = Object.keys(countryLookup).filter((c) =>
			geos ? geos.ctrys.includes(c[0]) : true
		);
		const geojson = featureCollection(
			features,
			countryCodes.map((c) => ({ areacd: c }))
		);
		bounds = bbox(geojson);
	});
</script>

<div class="map-container">
	{#if features && bounds}
		<Map
			style="{base}/data/mapstyle.json"
			location={{ bounds }}
			options={{
				fitBoundsOptions: { padding: 10 },
				maxBounds: [-19, 48, 12, 62],
				cooperativeGestures: true,
				preserveDrawingBuffer: true
			}}
			controls
		>
			{#key clusterKey}
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
					>
						<MapTooltip content={features?.[hovered]?.properties?.areanm || ''} />
					</MapLayer>
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
			{/key}
			{#if selected[0]}
				<MapSource
					id="selected"
					type="geojson"
					data={featureCollection(features, selected, { boundary: true })}
					promoteId="areacd"
				>
					<MapLayer
						id="selected-outline"
						type="line"
						paint={{
							'line-color': 'white',
							'line-width': 4
						}}
						order="place_other"
					/>
					<MapLayer
						id="selected"
						type="line"
						paint={{
							'line-color': ['get', 'color'],
							'line-width': 2.5
						}}
						order="place_other"
					/>
				</MapSource>
			{/if}
		</Map>
	{/if}
</div>
{#if legendType === 'choropleth'}
	<BreaksChart
		{data}
		{breaks}
		{hovered}
		{selected}
		{prefix}
		{suffix}
		formatTick={(d) =>
			d.toLocaleString(undefined, {
				minimumFractionDigits: dp,
				maximumFractionDigits: dp
			})}
		{getColor}
		on:select={doSelect}
		on:hover={doHover}
	/>
{:else if legendType === 'categorical'}
	<ul class="legend-list">
		{#each ['a', 'b', 'c', 'd'] as cluster}
			<li class="legend-chip" style:background={colors[cluster]}>
				Cluster {cluster.toUpperCase()}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.map-container {
		display: block;
		width: 100%;
		height: 500px;
	}
	ul.legend-list {
		list-style: none;
		margin: 12px 0 0;
		padding: 0;
	}
	ul.legend-list > li {
		display: inline-block;
		margin-right: 6px;
	}
	.legend-chip {
		font-weight: bold;
		color: white;
		padding: 0 6px;
		border-radius: 3px;
	}
</style>
