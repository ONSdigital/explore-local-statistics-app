<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import bbox from '@turf/bbox';
	import { parseData, getMapFeatures, valuesToBreaks } from '$lib/utils';
	import { getPaletteColor } from './chartHelpers';
	import { ukBounds, ONScolours } from '$lib/config';
	import { geoYearFilter } from '$lib/api/geo/helpers/geoFilters';
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
		],
		extendHeight = null
	} = $props();

	const fitBoundsOptions = { padding: 10 };
	const noHighlight = ['K02', 'K03', 'K04']; // Don't highlight UK, GB or England & Wales on map

	let map = $state();
	let features = $state.raw();
	let _data = $derived(parseData(data));
	let breaks = $derived(
		valuesToBreaks(
			_data.map((d) => d.value),
			metadata.decimalPlaces
		)
	);
	let height = $derived(500 + (extendHeight ?? 0));

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

		if (!features || !data)
			return {
				renderedFeatures,
				bounds: ukBounds
			};
		const geoLevelCodes = new Set(geoLevel?.codes || []);

		for (const d of data) {
			const ft = features[d.areacd] ? { ...features[d.areacd] } : null;
			if (!ft) continue;
			if (d.areacd.startsWith('K02')) continue;
			if (geoLevelCodes.has(d.areacd.slice(0, 3)) && geoYearFilter(ft.properties, geoYear)) {
				ft.properties = {
					...ft.properties,
					...d,
					color: valueToColor(d.value, breaks, colors)
				};
				renderedFeatures.push(ft);
			}
		}
		const bounds = renderedFeatures.length ? bbox(featureCollection(renderedFeatures)) : ukBounds;
		return { renderedFeatures, bounds };
	};

	const makeSelectedFeatures = (features, data, selected) => {
		const selectedFeatures = [];
		if (!features) return selectedFeatures;

		for (const cd of selected) {
			const ft = features[cd] ? { ...features[cd] } : null;
			const d = data.find((d) => d.areacd === cd);
			if (ft && d) {
				const colorIndex = selected.indexOf(cd);
				ft.properties = {
					...ft.properties,
					...d,
					color: getPaletteColor(colorIndex, selected.length),
					textColor: getPaletteColor(colorIndex, selected.length, 'text')
				};
				selectedFeatures.push(ft);
			}
		}
		return selectedFeatures;
	};

	let { renderedFeatures, bounds } = $derived(
		makeRenderedFeatures(features, _data, geoLevel, metadata.geography.year)
	);
	let selectedFeatures = $derived(features ? makeSelectedFeatures(features, _data, selected) : []);

	function fitBounds(bounds) {
		if (bounds && map?.fitBounds) map.fitBounds(bounds, fitBoundsOptions);
	}
	$effect(() => fitBounds(bounds));

	onMount(async () => (features = await getMapFeatures()));
</script>

<p class="ons-u-vh">Map of {metadata.label}. The data is available to download below.</p>
<div aria-hidden="true" class="map-outer">
	<div class="map-container" style:height="{height}px">
		<Map
			bind:map
			css={resolve('/css/maplibre-gl.css')}
			style={resolve('/data/mapstyle.json')}
			location={{ bounds: bounds || ukBounds }}
			options={{
				fitBoundsOptions,
				maxBounds: [-22, 48, 17, 62],
				cooperativeGestures: true,
				preserveDrawingBuffer: true,
				dragRotate: false
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
		onHover={(e) => {
			hovered = e.id || null;
			onHover(e);
		}}
		selectedAreas={selectedFeatures.map((ft) => ft.properties)}
		prefix={metadata.prefix}
		suffix={metadata.suffix}
		format={formatValue}
	/>
</div>

<style>
	.map-container {
		display: block;
		width: 100%;
	}
</style>
