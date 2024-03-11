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
	import StickyHeaderIndicators from '$lib/prototype-components/sticky-header/StickyHeaderIndicators.svelte';
	import { constructVisibleAreasArray, updateCustomLookup } from '$lib/utils.js';
	import LineChartContainerIndicatorPage from '$lib/prototype-components/indicator-page/LineChartContainerIndicatorPage.svelte';
	import BarChartContainerIndicatorPage from '$lib/prototype-components/indicator-page/BarChartContainerIndicatorPage.svelte';

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

	$: sourceOrgs = data.indicator.metadata.sourceOrg.split('|');
	$: sourceLinks = data.indicator.metadata.sourceURL.split('|');
	$: sourceDate = data.indicator.metadata.sourceDate.split('|');
	$: experimental = data.indicator.metadata.experimentalStatistic === 'T';
</script>

<Breadcrumb
	links={[
		{ label: 'Home', href: '/', refresh: true },
		{ label: 'Explore local statistics', href: `${base}/` },
		{ label: 'Local indicators', href: `${base}/indicators` },
		{ label: data.indicator.metadata.label }
	]}
	background="#eaeaea"
/>
<Titleblock
	title={data.indicator.metadata.label}
	meta={[
		{
			key: sourceOrgs.length === 1 ? 'Data source' : 'Data sources',
			value: Array.from(sourceOrgs.keys())
				.map((i) => `<a href="${sourceLinks[i]}" target="_blank">${sourceOrgs[i]}</a>`)
				.join(', ')
		},
		{
			key: 'Published on',
			value: sourceDate.join(', ')
		}
	]}
	background="#eaeaea"
>
	{#if experimental}
		<div class="stat-in-dev">
			<div>Official statistics in development</div>
		</div>
	{/if}
	<Lede marginBottom>
		{data.indicator.metadata.longDescription}
	</Lede>
</Titleblock>

{#if mapData && pivotedData}
	<NavSections contentsLabel="Explore this indicator" marginTop>
		<strong class="selected-areas">Selected areas</strong>
		<StickyHeaderIndicators
			bind:selectionsObject
			{accordionArray}
			customLookup={customLookup['indicator-additional-visible']}
		/>
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

		<NavSection title="Line chart">
			<ContentBlock
				type="line-chart"
				title={data.indicator.metadata.label}
				unit={getUnit(data.indicator.metadata)}
				data={[]}
			>
				<LineChartContainerIndicatorPage
					indicator={data.indicator}
					chartData={data.chartData}
					{selectionsObject}
					customLookup={customLookup['indicator-additional-visible']}
					{metadata}
				></LineChartContainerIndicatorPage>
			</ContentBlock>
		</NavSection>

		<NavSection title="Bar chart">
			<ContentBlock
				type="bar-chart"
				title={data.indicator.metadata.label}
				unit={getUnit(data.indicator.metadata)}
				data={[]}
			>
				<BarChartContainerIndicatorPage
					indicator={data.indicator}
					chartData={data.chartData}
					{selectionsObject}
					customLookup={customLookup['indicator-additional-visible']}
					{metadata}
				></BarChartContainerIndicatorPage>
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
				This indicator was produced by the {sourceOrgs.join(' and ')}. The original source data can
				be found {#each sourceOrgs as org, i}
					<a href={sourceLinks[i]}>{i === sourceOrgs.length - 1 ? 'here.' : 'here'}</a>
					{#if i < sourceOrgs.length - 2}
						{','}
					{:else if i === sourceOrgs.length - 2}
						{'and '}
					{/if}{/each}
			</p>
			<p>
				If you would like a CSV of the data displayed in one of the above charts, you can click the
				"download data" link immediately below it.
			</p>
		</NavSection>
		<NavSection title="Other indicators">
			<p>
				{data.indicator.metadata.label} is one of
				<span style="font-weight:bold"
					>{data.metadata.indicatorsCodeLabelArray.length} local indicators</span
				>
				on the <a href="{base}/">Explore local statistics</a> service. See the
				<a href="{base}/datasets">full list of local indicators</a>.
			</p>

			{#if experimental}
				<p>
					Please note that these indicators are <a
						href="https://osr.statisticsauthority.gov.uk/policies/official-statistics-policies/official-statistics-in-development/"
						class="">official statistics in development</a
					>.
				</p>
			{/if}
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
	.selected-areas {
		color: #999;
		text-transform: uppercase;
	}
	.stat-in-dev {
		display: flex;
		margin-bottom: 28px;
	}
	.stat-in-dev > div {
		font-weight: bold;
		color: white;
		background-color: #003c57;
		padding: 2px 8px;
		border-radius: 4px;
	}
</style>
