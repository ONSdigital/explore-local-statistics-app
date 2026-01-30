<script lang="ts">
	// @ts-nocheck
	import { resolve } from '$app/paths';
	import { Map, MapSource, MapLayer, MapTooltip } from '@onsvisual/svelte-maps';
	import { analyticsEvent } from '@onsvisual/svelte-components';
	import { getName } from '@onsvisual/robo-utils';
	import navMapSources from '$lib/config/navMapSources';
	import { geoLevelsNavLookup } from '$lib/config/geoLevels';
	import { makeGeoJSON } from '$lib/utils';
	import topojson from '$lib/data/topo.json';

	let { area, children, mapDescription, primaryColor = 'rgb(17, 140, 123)', onSelect } = $props();

	let map = $state();
	let hovered = $state();

	let { areacd, bounds } = $derived(area.properties);
	let levelcd = $derived(geoLevelsNavLookup?.[area.properties.typecd]?.key);

	function doSelect(e) {
		const props = e.detail.feature.properties;
		const eventData = {
			event: 'mapSelect',
			areaCode: props.areacd,
			areaName: props.areanm || props.areacd
			// areaType: geoCodesLookup[props.areacd.slice(0, 3)]?.label
		};
		analyticsEvent(eventData);
		onSelect(props);
	}

	function fitBounds(bounds) {
		map.fitBounds(bounds, { padding: 20 });
	}
	$effect(() => fitBounds(bounds));
</script>

<div style:height="450px">
	<Map
		bind:map
		css={resolve('/css/maplibre-gl.css')}
		style={resolve('/data/mapstyle-nav.json')}
		location={{ bounds }}
		options={{
			fitBoundsOptions: { padding: 20 },
			maxBounds: [-19, 48, 12, 62],
			cooperativeGestures: true
		}}
		controls
		{mapDescription}
	>
		{#each navMapSources as s}
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
				{#each s.layers ? s.layers : [{ key: s.id }] as l}
					<MapLayer
						id="{l.key}-fill"
						type="fill"
						paint={{
							'fill-color':
								l.key === levelcd
									? ['case', ['==', ['feature-state', 'selected'], true], primaryColor, 'grey']
									: primaryColor,
							'fill-opacity':
								l.key === levelcd
									? [
											'case',
											['==', ['feature-state', 'hovered'], true],
											0.4,
											['==', ['feature-state', 'selected'], true],
											0.2,
											0.1
										]
									: ['case', ['==', ['feature-state', 'hovered'], true], 0.4, 0.2]
						}}
						visible={l.key === levelcd || l.key === children?.key}
						filter={!children
							? null
							: l.key === levelcd && l.filter
								? ['all', ...l.filter.slice(1), ['!', ['==', ['get', 'areacd'], areacd]]]
								: l.key === levelcd
									? ['!', ['==', ['get', 'areacd'], areacd]]
									: ['in', 'areacd', ...(children?.areas?.map?.((d) => d.areacd) || [])]}
						hover
						on:hover={(e) => (hovered = e.detail.feature)}
						select
						selected={areacd}
						on:select={doSelect}
					>
						<MapTooltip content={hovered ? getName(hovered.properties) : ''} />
					</MapLayer>
					<MapLayer
						id="{l.key}-line"
						type="line"
						paint={{
							'line-color': l.key === levelcd ? 'grey' : primaryColor,
							'line-width': 1
						}}
						visible={l.key === levelcd || l.key === children?.key}
						filter={l.key === levelcd && l.filter
							? ['all', ...l.filter.slice(1), ['!', ['==', ['get', 'areacd'], areacd]]]
							: l.key === levelcd
								? ['!', ['==', ['get', 'areacd'], areacd]]
								: ['in', 'areacd', ...(children?.areas?.map?.((d) => d.areacd) || [])]}
					/>
					<MapLayer
						id="{l.key}-active"
						type="line"
						paint={{ 'line-color': primaryColor, 'line-width': 2 }}
						visible={l.key === levelcd}
						filter={['==', 'areacd', areacd]}
					/>
				{/each}
			</MapSource>
		{/each}
		{#if area.properties.end}
			<MapSource id="place" type="geojson" data={area.geometry}>
				<MapLayer
					id="place-line"
					type="line"
					paint={{ 'line-color': primaryColor, 'line-width': 2 }}
				></MapLayer>
			</MapSource>
		{/if}
	</Map>
</div>
