<script lang="ts">
	//@ts-nocheck
	import MarkdownIt from 'markdown-it';
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
	import { capitalise } from '@onsvisual/robo-utils';
	import { pivotData, makeMapData } from '$lib/util/datasets/datasetsHelpers';
	import Lede from '$lib/components/Lede.svelte';
	// import Indicators from '$lib/components/Indicators.svelte';
	import ContentBlock from '$lib/components/ContentBlock.svelte';
	import Map from '$lib/viz/Map.svelte';
	import ChangeAreas from '$lib/prototype-components/change-areas/ChangeAreas.svelte';
	import { constructVisibleAreasArray, updateCustomLookup } from '$lib/utils.js';
	import LineChartContainerIndicatorPage from '$lib/prototype-components/indicator-page/LineChartContainerIndicatorPage.svelte';
	import BarChartContainerIndicatorPage from '$lib/prototype-components/indicator-page/BarChartContainerIndicatorPage.svelte';
	import { onMount } from 'svelte';

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
			...data.indicator.years.map((y) => ({
				key: y,
				label: y,
				sortable: true,
				numeric: true,
				dp: +data.indicator.metadata.decimalPlaces
			}))
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
					accordion: true,
					include: true
				},
				{
					key: 'rgn',
					label: 'Countries and regions',
					data: changeAreasOptionsObject.region,
					accordion: true,
					include: true
				},
				{
					key: 'utla',
					label: 'Upper-tier/unitary authorities',
					data: changeAreasOptionsObject.upper,
					accordion: true,
					include: true
				},
				{
					key: 'ltla',
					label: 'Lower-tier/unitary authorities',
					data: changeAreasOptionsObject.lower,
					accordion: true,
					include: true
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

	$: timePeriodsArray = metadata.periodsLookupArray.filter(
		(el) =>
			el.periodGroup === data.indicator.periodGroup &&
			el.xDomainNumb >= data.indicator.minXDomainNumb &&
			el.xDomainNumb <= data.indicator.maxXDomainNumb
	);

	let timePeriodLabels;

	onMount(() => {
		timePeriodLabels = [
			timePeriodsArray[timePeriodsArray.length - 1].label,
			timePeriodsArray[0].label
		];
	});

	$: year =
		timePeriodLabels && timePeriodsArray
			? timePeriodsArray.find((el) => el.label === timePeriodLabels[1]).xDomainNumb
			: null;

	$: sourceOrgs = data.indicator.metadata.sourceOrg.split('|');
	$: sourceLinks = data.indicator.metadata.sourceURL.split('|');
	$: sourceDate = data.indicator.metadata.sourceDate.split('|');
	$: experimental = data.indicator.metadata.experimentalStatistic === 'T';
	$: caveats = data.indicator.metadata.caveats
		? new MarkdownIt().render(data.indicator.metadata.caveats)
		: null;
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
	titleBadge={!experimental ? capitalise(data.indicator.topic) : null}
	titleBadgeAriaLabel="Topic: {capitalise(data.indicator.topic)}"
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
		<!-- <strong class="selected-areas">Selected areas</strong>
		<StickyHeaderIndicators
			bind:selectionsObject
			{accordionArray}
			customLookup={customLookup['indicator-additional-visible']}
		/> -->

		{#if data.indicator.metadata.standardised === 'T'}
			<NavSection title="Map">
				<div class="row-container">
					<div class="content-dropdowns" data-html2canvas-ignore>
						<Dropdown
							options={data.indicator.inferredGeos.groups}
							bind:value={geoGroup}
							on:change={refreshData}
						/>
						<Dropdown
							id="year"
							options={timePeriodsArray.map((el) => el.label)}
							width={10}
							bind:value={timePeriodLabels[1]}
							on:change={refreshData}
						/>
					</div>
					<div class="buttons-container">
						<ChangeAreas
							{accordionArray}
							bind:selectionsObject
							customLookup={customLookup['indicator-additional-visible']}
							label={selectionsObject['indicator-additional-visible'].length === 0
								? 'Select areas'
								: 'Change areas'}
						></ChangeAreas>
					</div>
				</div>

				<ContentBlock
					type="map"
					title={data.indicator.metadata.label}
					unit={getUnit(data.indicator.metadata)}
					data={mapData.data}
				>
					<p class="subtitle">{data.indicator.metadata.subtitle}, {timePeriodLabels[1]}</p>
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
		{/if}

		{#if data.indicator.maxXDomainNumb != data.indicator.minXDomainNumb}
			<NavSection title="Line chart">
				<div class="row-container">
					<div class="buttons-container">
						<ChangeAreas
							{accordionArray}
							bind:selectionsObject
							customLookup={customLookup['indicator-additional-visible']}
							label={selectionsObject['indicator-additional-visible'].length === 0
								? 'Select areas'
								: 'Change areas'}
						></ChangeAreas>
					</div>
				</div>

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
		{/if}

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

		{#if caveats}
			<NavSection title="Interpretation">
				{@html caveats}
			</NavSection>
		{/if}

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
			{#if experimental}
				<p>
					Please note that these are <a
						href="https://osr.statisticsauthority.gov.uk/policies/official-statistics-policies/official-statistics-in-development/"
						class="">official statistics in development</a
					>.
				</p>
			{/if}
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
		width: 120px !important;
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

	.row-container {
		margin: 20px 0px;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
	}

	.subtitle {
		margin: 0px;
		padding: 0px;
	}
</style>
