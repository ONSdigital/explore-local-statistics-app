<script lang="ts">
	//@ts-nocheck
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import {
		Breadcrumb,
		Titleblock,
		NavSections,
		NavSection,
		Dropdown,
		Table
	} from '@onsvisual/svelte-components';
	import { pivotData, makeMapData } from '$lib/util/datasets/datasetsHelpers';
	import Lede from '$lib/components/Lede.svelte';
	// import Indicators from '$lib/components/Indicators.svelte';
	import ContentBlock from '$lib/components/ContentBlock.svelte';
	import Map from '$lib/viz/Map.svelte';
	import ChangeAreas from '$lib/prototype-components/change-areas/ChangeAreas.svelte';
	import AreaPanel from '$lib/prototype-components/AreaPanel.svelte';
	import { constructVisibleAreasArray, updateCustomLookup } from '$lib/utils.js';

	export let data;

	let geoGroup, prevGeoGroup, year, columns;
	let pivotedData, mapData;
	let selected = [];

	const maxSelection = 10;

	const getUnit = (ind) => ind.subText || ind.suffix || ind.prefix;
	const doSelect = (e) => {
		const chosen = selectionsObject['indicator-additional-chosen'];
		const area = e.detail?.area;
		if (chosen.includes(area.areacd))
			selectionsObject['indicator-additional-chosen'] = chosen.filter((s) => s !== area.areacd);
		else if (chosen.length < maxSelection)
			selectionsObject['indicator-additional-chosen'] = [...chosen, area.areacd];
		console.log(selectionsObject);
	};
	const refreshData = () => {
		if (geoGroup.key !== prevGeoGroup.key) {
			selectionsObject = {
				'indicator-additional-chosen': new Array(0),
				'indicator-additional-visible': new Array(0)
			};
			prevGeoGroup = geoGroup;
		}
		pivotedData = geoGroup?.codes ? pivotData(data.chartData, geoGroup?.codes) : [];
		mapData =
			geoGroup?.codes && year
				? makeMapData(data.chartData, geoGroup?.codes, year)
				: { data: [], breaks: [] };
	};

	afterNavigate(() => {
		geoGroup = data.indicator.inferredGeos.groups[data.indicator.inferredGeos.groups.length - 1];
		prevGeoGroup = geoGroup;
		year = data.indicator.years[data.indicator.years.length - 1];
		columns = [
			{ key: 'areacd', label: 'Area code', sortable: true },
			{ key: 'areanm', label: 'Area name', sortable: true },
			...data.indicator.years.map((y) => ({ key: y, label: y, sortable: true }))
		];
		refreshData();
	});

	let metadata = data.metadata;

	$: parentAndRelatedAreasObject = {
		parent: null,
		country: null,
		uk: null,
		groups: {}
	};

	let changeAreasOptionsObject = {
		country: metadata.areasGeogLevelObject.country.map((el) => metadata.areasObject[el]),
		region: metadata.areasGeogLevelObject.region.map((el) => metadata.areasObject[el]),
		upper: metadata.areasGeogLevelObject.upper.map((el) => metadata.areasObject[el]),
		lower: metadata.areasGeogLevelObject.lower.map((el) => metadata.areasObject[el])
	};

	let selectionsObject = {
		'indicator-additional-chosen': new Array(0),
		'indicator-additional-visible': new Array(0)
	};

	$: {
		selectionsObject['indicator-additional-visible'] = constructVisibleAreasArray(
			selectionsObject['indicator-additional-chosen'],
			false,
			parentAndRelatedAreasObject,
			metadata.areasObject
		);
	}

	$: accordionArray = [
		{
			label: '',
			type: 'checkbox',
			chosenKey: 'indicator-additional',
			accordion: false,
			options: [
				{
					key: 'ctry',
					label: 'Countries',
					data: changeAreasOptionsObject.country,
					accordion: true
				},
				{
					key: 'rgn',
					label: 'Countries and regions',
					data: changeAreasOptionsObject.region,
					accordion: true
				},
				{
					key: 'utla',
					label: 'Upper-tier local authorities',
					data: changeAreasOptionsObject.upper,
					accordion: true
				},
				{
					key: 'ltla',
					label: 'Lower-tier local authorities',
					data: changeAreasOptionsObject.lower,
					accordion: true
				}
			].filter((op) => op.key === geoGroup?.key)
		}
	];

	$: customLookup = {
		'indicator-additional-visible': {}
	};

	$: {
		customLookup['indicator-additional-visible'] = updateCustomLookup(
			customLookup['indicator-additional-visible'],
			selectionsObject['indicator-additional-visible'].filter((el) => el.role === 'custom')
		);
	}
</script>

<Breadcrumb
	links={[
		{ label: 'Home', href: '/', refresh: true },
		{ label: 'Explore local statistics', href: `${base}/` },
		{ label: 'Local indicators', href: `${base}/datasets` },
		{ label: data.indicator.metadata.label }
	]}
	background="#eaeaea"
/>
<Titleblock
	title={data.indicator.metadata.label}
	meta={[
		{
			key: 'Data source',
			value: 'Organisation name'
		},
		{
			key: 'Last updated',
			value: 'DD MMM YYYY'
		}
	]}
	background="#eaeaea"
>
	<Lede marginBottom>
		{data.indicator.metadata.subtitle}.
	</Lede>
</Titleblock>

{#if mapData && pivotedData}
	<NavSections contentsLabel="Explore this indicator" marginTop>
		<strong class="selected-areas">Selected areas</strong>
		<div class="row-container sticky">
			<div class="visible-areas-key-container">
				{#each selectionsObject['indicator-additional-visible'] as area}
					<AreaPanel
						{area}
						bind:chosen={selectionsObject['indicator-additional-chosen']}
						customLookup={customLookup['indicator-additional-visible']}
						backgroundColor="color"
						color="contrast"
					/>
				{/each}
				{#if selectionsObject['indicator-additional-visible'].length === 0}
					<span class="no-selection">No areas selected</span>
				{/if}
			</div>
			<div class="row-container buttons-container">
				<ChangeAreas
					{accordionArray}
					bind:selectionsObject
					customLookup={customLookup['indicator-additional-visible']}
				></ChangeAreas>
			</div>
		</div>
		<NavSection title="Map">
			<ContentBlock
				type="map"
				title={data.indicator.metadata.label}
				unit={getUnit(data.indicator.metadata)}
				data={mapData.data}
			>
				<div class="content-dropdowns" data-html2canvas-ignore>
					<Dropdown
						options={data.indicator.inferredGeos.groups}
						bind:value={geoGroup}
						on:change={refreshData}
					/>
					<Dropdown
						id="year"
						options={data.indicator.years}
						width={10}
						bind:value={year}
						on:change={refreshData}
					/>
				</div>

				<Map
					data={mapData.data}
					breaks={mapData.breaks}
					geos={data.indicator.inferredGeos}
					prefix={data.indicator.metadata.prefix}
					suffix={data.indicator.metadata.suffix}
					dp={+data.indicator.metadata.decimalPlaces}
					selected={selectionsObject['indicator-additional-visible']}
					customLookup={customLookup['indicator-additional-visible']}
					on:select={doSelect}
				/>
			</ContentBlock>
		</NavSection>
		<NavSection title="Table">
			<ContentBlock
				type="table"
				title={data.indicator.metadata.label}
				unit={getUnit(data.indicator.metadata)}
				data={pivotedData}
			>
				<div class="content-dropdowns" data-html2canvas-ignore>
					<Dropdown
						options={data.indicator.inferredGeos.groups}
						bind:value={geoGroup}
						on:change={refreshData}
					/>
				</div>
				{#key pivotedData}
					<Table data={pivotedData} {columns} height={500} stickyHeader compact />
				{/key}
			</ContentBlock>
		</NavSection>
		<NavSection title="Get the data">
			<p>
				This indicator was produced by the Office for National Statistics. The original source data
				can be <a href="#0">found here</a>.
			</p>
			<p>
				If you would like a CSV of the data displayed in one of the above charts, you can click the
				"download data" link immediately below it.
			</p>
		</NavSection>
		<NavSection title="Other indicators">
			<p>
				{data.indicator.metadata.label} is one of {data.metadata.indicatorsCodeLabelArray.length} local
				indicators on the <a href="{base}/">Explore local statistics</a> service. See the
				<a href="{base}/datasets">full list of local indicators</a>.
			</p>
		</NavSection>
	</NavSections>
{/if}

<style>
	:global(div.ons-grid__col > section:first-of-type > h2) {
		margin-top: 0 !important;
	}
	:global(.ons-field) {
		margin: 0 4px 8px 0 !important;
	}
	.content-dropdowns :global(.ons-field) {
		display: inline-block;
	}
	:global(select.ons-input--select) {
		max-width: 300px !important;
	}
	:global(select#year) {
		width: 90px !important;
	}
	:global(section#map > h2) {
		margin-top: -6px !important;
	}

	/* Sticky header CSS */
	.selected-areas {
		color: #999;
		text-transform: uppercase;
	}

	.no-selection {
		display: inline-block;
		color: #222;
		background: #ddd;
		padding: 6px;
		border-radius: 3px;
		line-height: 20px;
	}

	.sticky {
		margin: 0 0 24px;
		width: 100%;
		background-color: white;
		padding: 10px 0px;
		position: sticky;
		top: 0px;
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: 10px;
		justify-content: space-between;
	}

	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 4px;
	}

	.col1 {
		white-space: nowrap; /* Prevent text in the first column from wrapping */
		text-align: end;
	}

	.col2 {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
	}

	.button-container {
		justify-content: flex-end;
	}
</style>
