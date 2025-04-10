<script lang="ts">
	// @ts-nocheck
	import { createEventDispatcher } from 'svelte';
	import { assets } from '$app/paths';
	import { Map, MapSource, MapLayer, MapTooltip } from '@onsvisual/svelte-maps';
	import { analyticsEvent } from '@onsvisual/svelte-components';
	import { getName } from '@onsvisual/robo-utils';
	import { mapSources, geoCodesLookup } from '$lib/config/geoConfig';
	import { makeGeoJSON } from '$lib/util/geo/makeGeoJSON';
	import topojson from '$lib/data/uk-ctry-rgn.json';

	const dispatch = createEventDispatcher();

	export let data;
	export let childType;
	export let mapDescription;

	let map;
	let hovered;
	let areacd = data.place.areacd;

	function doSelect(e) {
		const props = e.detail.feature.properties;
		const eventData = {
			event: 'mapSelect',
			areaCode: props.areacd,
			areaName: props.areanm || props.areacd,
			areaType: geoCodesLookup[props.areacd.slice(0, 3)]?.label
		};
		analyticsEvent(eventData);
		dispatch('select', e.detail);
	}

	function fitBounds(data) {
		if (map && areacd !== data.place.areacd) {
			map.fitBounds(data.place.bounds, { padding: 20 });
			areacd = data.place.areacd;
		}
	}
	$: fitBounds(data);
</script>

<div style:height="450px">
	<Map
		bind:map
		style="{assets}/data/mapstyle.json"
		location={{ bounds: data.place.bounds }}
		options={{
			fitBoundsOptions: { padding: 20 },
			maxBounds: [-19, 48, 12, 62],
			cooperativeGestures: true
		}}
		controls
		{mapDescription}
	>
		{#each mapSources as s}
			<MapSource
				id={s.id}
				type={s.type}
				url={s.type === 'vector' ? s.url : null}
				data={s.type === 'geojson' ? makeGeoJSON(topojson, s.id) : null}
				layer={s.type === 'vector' ? s.layer : null}
				promoteId="areacd"
				minzoom={s.minzoom ? s.minzoom : 0}
				maxzoom={12}
				props={s.type === 'NA' ? { bounds: [-6.3603, 49.88234, 1.76357, 55.8112] } : {}}
			>
				{#each s.layers as l}
					<MapLayer
						id="{l.key}-fill"
						type="fill"
						paint={{
							'fill-color':
								l.key === data.geoType.key
									? ['case', ['==', ['feature-state', 'selected'], true], 'rgb(17,140,123)', 'grey']
									: 'rgb(17,140,123)',
							'fill-opacity': ['case', ['==', ['feature-state', 'hovered'], true], 0.3, 0.1]
						}}
						visible={l.key === data.geoType.key || l.key === childType?.key}
						filter={!childType
							? null
							: l.key === data.geoType.key && l.filter
								? ['all', ...l.filter.slice(1), ['!', ['==', ['get', 'areacd'], data.place.areacd]]]
								: l.key === data.geoType.key
									? ['!', ['==', ['get', 'areacd'], data.place.areacd]]
									: ['in', 'areacd', ...data.place.children.map((d) => d.areacd)]}
						hover
						on:hover={(e) => (hovered = e.detail.feature)}
						select
						selected={data.place.areacd}
						on:select={doSelect}
					>
						<MapTooltip content={hovered ? getName(hovered.properties) : ''} />
					</MapLayer>
					<MapLayer
						id="{l.key}-line"
						type="line"
						paint={{
							'line-color': l.key === data.geoType.key ? 'grey' : 'rgb(17,140,123)',
							'line-width': 1
						}}
						visible={l.key === data.geoType.key || l.key === childType?.key}
						filter={l.key === data.geoType.key && l.filter
							? ['all', ...l.filter.slice(1), ['!', ['==', ['get', 'areacd'], data.place.areacd]]]
							: l.key === data.geoType.key
								? ['!', ['==', ['get', 'areacd'], data.place.areacd]]
								: ['in', 'areacd', ...data.place.children.map((d) => d.areacd)]}
					/>
					<MapLayer
						id="{l.key}-active"
						type="line"
						paint={{ 'line-color': 'rgb(17,140,123)', 'line-width': 2 }}
						visible={l.key === data.geoType.key}
						filter={['==', 'areacd', data.place.areacd]}
					/>
				{/each}
			</MapSource>
		{/each}
		{#if data.place.end}
			<MapSource id="place" type="geojson" data={data.geometry}>
				<MapLayer
					id="place-line"
					type="line"
					paint={{ 'line-color': 'rgb(17,140,123)', 'line-width': 2 }}
				></MapLayer>
			</MapSource>
		{/if}
	</Map>
</div>
