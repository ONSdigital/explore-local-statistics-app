<script lang="ts">
	//@ts-nocheck
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import bbox from '@turf/bbox';
	import { parseData, makeMapFeatures, valuesToBreaks } from '$lib/utils';
	import { ONSpalette, ONStextPalette, ONScolours } from '$lib/config';
	import { validYear } from '$lib/util/linkHelpers';
	import topo from '$lib/data/topo.json';
	import { Map, MapSource, MapLayer, MapTooltip } from '@onsvisual/svelte-maps';
	import MapLegend from './MapLegend.svelte';

	let {
		data,
		metadata,
		selected = [],
		hovered = $bindable(),
		onHover = () => null,
		formatValue = (d) => d,
		formatPeriod = (d) => d,
		geoLevel = null,
		colors = [
			'rgb(234, 236, 177)',
			'rgb(169, 216, 145)',
			'rgb(0, 167, 186)',
			'rgb(0, 78, 166)',
			'rgb(0, 13, 84)'
		]
	} = $props();

	const topoPath = resolve('/data/topo.json');
	const ukBounds = [-8.65, 49.867, 1.761, 60.856];
	const fitBoundsOptions = { padding: 10 };
	const noHighlight = ['K02', 'K03', 'K04']; // Don't highlight UK, GB or England & Wales on map

	const features = makeMapFeatures(topo);

	let map = $state();
	let _data = $derived(parseData(data));
	let breaks = $derived(valuesToBreaks(_data.map((d) => d.value)));
	let { renderedFeatures, bounds } = $derived(
		makeRenderedFeatures(features, _data, geoLevel, metadata.geography.year)
	);
	let selectedFeatures = $derived(makeSelectedFeatures(features, _data, selected));

	function doHover(e) {
		const area = e.detail?.feature?.properties || e.detail?.d;
		hovered = area?.areacd;
		onHover({ id: hovered, area, e });
	}

	function valueToColor(value, breaks, colors) {
		for (let i = 0; i < breaks.length - 1; i++) {
			if (value < breaks[i + 1]) return colors[i];
		}
		return colors[breaks.length - 2];
	}

	const featureCollection = (features) => ({ type: 'FeatureCollection', features });

	const makeRenderedFeatures = (features, data, geoLevel, geoYear) => {
		const renderedFeatures = [];

		if (!data)
			return {
				renderedFeatures,
				bounds: ukBounds
			};
		const geoLevelCodes = new Set(geoLevel?.codes || []);

		for (const d of data) {
			const ft = features[d.areacd] ? { ...features[d.areacd] } : null;
			if (!ft) continue;
			if (geoLevelCodes.has(d.areacd.slice(0, 3)) && validYear(ft.properties, geoYear)) {
				ft.properties = {
					...ft.properties,
					...d,
					color: valueToColor(d.value, breaks, colors)
				};
				renderedFeatures.push(ft);
			}
		}
		const bounds = bbox(featureCollection(renderedFeatures));
		return { renderedFeatures, bounds };
	};

	const makeSelectedFeatures = (features, data, selected) => {
		const selectedFeatures = [];

		for (const cd of selected) {
			const ft = features[cd] ? { ...features[cd] } : null;
			const d = data.find((d) => d.areacd === cd);
			if (ft && d) {
				const colorIndex = selected.indexOf(cd);
				ft.properties = {
					...ft.properties,
					...d,
					color: ONSpalette[colorIndex],
					textColor: ONStextPalette[colorIndex]
				};
				selectedFeatures.push(ft);
			}
		}
		return selectedFeatures;
	};

	function fitBounds(bounds) {
		map?.fitBounds?.(bounds, fitBoundsOptions);
	}
	$effect(() => fitBounds(bounds));
</script>

<div aria-hidden="true" class="map-outer">
	<div class="map-container">
		<Map
			bind:map
			css={resolve('/css/maplibre-gl.css')}
			style={resolve('/data/mapstyle.json')}
			location={{ bounds: bounds || ukBounds }}
			options={{
				fitBoundsOptions,
				maxBounds: [-19, 48, 12, 62],
				cooperativeGestures: true,
				preserveDrawingBuffer: true
			}}
			controls
			mapDescription="Map of {metadata.label}"
		>
			<MapSource
				id="features"
				type="geojson"
				data={featureCollection(renderedFeatures)}
				promoteId="areacd"
			>
				<MapLayer
					id="fills"
					type="fill"
					paint={{
						'fill-color': ['get', 'color'],
						'fill-opacity': 0.7
					}}
					order="place_other"
					hover
					{hovered}
					let:hovered
					on:hover={doHover}
				>
					<MapTooltip content={features?.[hovered]?.properties?.areanm || ''} />
				</MapLayer>
				<MapLayer
					id="outline"
					type="line"
					paint={{
						'line-color': 'grey',
						'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.2, 11, 1]
					}}
					order="place_other"
				/>
				<MapLayer
					id="hovered"
					type="line"
					paint={{
						'line-color': [
							'case',
							['==', ['feature-state', 'hovered'], true],
							ONScolours.highlightOrangeDark,
							'rgba(255,255,255,0)'
						],
						'line-width': 2.5
					}}
					order="place_suburb"
				/>
			</MapSource>
			<MapSource
				id="selected"
				type="geojson"
				data={featureCollection(
					selectedFeatures.filter((ft) => !noHighlight.includes(ft.properties.areacd.slice(0, 3)))
				)}
				promoteId="areacd"
			>
				<MapLayer
					id="highlighted-outline"
					type="line"
					paint={{
						'line-color': 'white',
						'line-width': 4.5
					}}
					order="place_other"
				/>
				<MapLayer
					id="highlighted"
					type="line"
					paint={{
						'line-color': ['get', 'color'],
						'line-width': 2.5
					}}
					order="place_other"
				/>
			</MapSource>
		</Map>
	</div>
	<MapLegend
		data={_data}
		{breaks}
		{hovered}
		selectedAreas={selectedFeatures.map((ft) => ft.properties)}
		prefix={metadata.prefix}
		suffix={metadata.suffix}
		format={formatValue}
		on:hover={doHover}
	/>
</div>

<style>
	.map-container {
		display: block;
		width: 100%;
		height: 500px;
	}
</style>
