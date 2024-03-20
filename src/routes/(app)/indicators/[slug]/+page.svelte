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
	import ChartOptions from '$lib/prototype-components/ChartOptions.svelte';
	import { onMount } from 'svelte';

	export let data;

	let geoGroup, prevGeoGroup, columns;
	let pivotedData, mapData;
	let selected = [];
	let chosenXDomainNumbStart,
		chosenXDomainNumbEnd,
		timePeriodsArray,
		chosenTimePeriodDropdownLabel,
		chosenStartTimePeriod;
	let showConfidenceIntervals = false;

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
		/*if (geoGroup.key !== prevGeoGroup.key) {
			selectionsObject = {
				'indicator-additional-chosen': new Array(0),
				'indicator-additional-visible': new Array(0)
			};
			prevGeoGroup = geoGroup;
		}*/

		chosenXDomainNumbEnd = timePeriodsArray.find(
			(el) => el.label === chosenTimePeriodDropdownLabel
		).xDomainNumb;
		chosenXDomainNumbStart = Math.min(chosenXDomainNumbStart, chosenXDomainNumbEnd);

		pivotedData = geoGroup?.codes ? pivotData(data.chartData, geoGroup?.codes) : [];
	};

	$: mapData =
		geoGroup?.codes && chosenXDomainNumbEnd && data.indicator.years.includes(chosenXDomainNumbEnd)
			? makeMapData(data.chartData, geoGroup?.codes, chosenXDomainNumbEnd)
			: { data: [], breaks: [] };

	afterNavigate(() => {
		geoGroup = data.indicator.inferredGeos.groups[data.indicator.inferredGeos.groups.length - 1];
		prevGeoGroup = geoGroup;

		timePeriodsArray = metadata.periodsLookupArray.filter(
			(el) =>
				el.periodGroup === data.indicator.periodGroup &&
				el.xDomainNumb >= data.indicator.minXDomainNumb &&
				el.xDomainNumb <= data.indicator.maxXDomainNumb
		);

		chosenXDomainNumbStart = data.indicator.minXDomainNumb;
		chosenXDomainNumbEnd = data.indicator.maxXDomainNumb;
		chosenTimePeriodDropdownLabel = timePeriodsArray.find(
			(el) => el.xDomainNumb === chosenXDomainNumbEnd
		).label;

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

	$: codesForAreasWithData = [...new Set(data.chartData.map((el) => el.areacd))];

	$: lowerTierLocalAuthoritiesWithDataCodes = metadata.areasGeogLevelObject.lower.filter((el) =>
		codesForAreasWithData.includes(el)
	);
	$: lowerTierLocalAuthoritiesWithDataAreas = lowerTierLocalAuthoritiesWithDataCodes.map(
		(el) => metadata.areasObject[el]
	);

	$: upperTierLocalAuthoritiesWithDataCodes = metadata.areasGeogLevelObject.upper.filter((el) =>
		codesForAreasWithData.includes(el)
	);
	$: upperTierLocalAuthoritiesWithDataAreas = upperTierLocalAuthoritiesWithDataCodes.map(
		(el) => metadata.areasObject[el]
	);

	$: combinedAuthoritiesWithDataCodes = metadata.areasGeogLevelObject.combined.filter((el) =>
		codesForAreasWithData.includes(el)
	);
	$: combinedAuthoritiesWithDataAreas = combinedAuthoritiesWithDataCodes.map(
		(el) => metadata.areasObject[el]
	);

	$: regionsWithDataCodes = metadata.areasGeogLevelObject.region.filter((el) =>
		codesForAreasWithData.includes(el)
	);
	$: regionsWithDataAreas = regionsWithDataCodes.map((el) => metadata.areasObject[el]);

	$: countriesWithDataCodes = metadata.areasGeogLevelObject.country.filter((el) =>
		codesForAreasWithData.includes(el)
	);
	$: countriesWithDataAreas = countriesWithDataCodes.map((el) => metadata.areasObject[el]);

	$: parentAndRelatedAreasObject = {
		parent: null,
		country: null,
		uk: null,
		groups: {
			country: {
				labels: {
					related: 'All countries'
				},
				areas: countriesWithDataAreas,
				codes: countriesWithDataCodes
			},
			region: {
				labels: {
					related: 'All regions'
				},
				areas: regionsWithDataAreas,
				codes: regionsWithDataCodes
			},
			combined: {
				labels: {
					related: 'All combined authorities'
				},
				areas: combinedAuthoritiesWithDataAreas,
				codes: combinedAuthoritiesWithDataCodes
			},
			utla: {
				labels: {
					related: 'All upper-tier/unitary authorities'
				},
				areas: upperTierLocalAuthoritiesWithDataAreas,
				codes: upperTierLocalAuthoritiesWithDataCodes
			},
			ltla: {
				labels: {
					related: 'All lower-tier/unitary authorities'
				},
				areas: lowerTierLocalAuthoritiesWithDataAreas,
				codes: lowerTierLocalAuthoritiesWithDataCodes
			}
		}
	};

	$: changeAreasOptionsObject = {
		country: metadata.areasGeogLevelObject.country.map((el) => metadata.areasObject[el]),
		region: metadata.areasGeogLevelObject.region.map((el) => metadata.areasObject[el]),
		combined: metadata.areasGeogLevelObject.combined.map((el) => metadata.areasObject[el]),
		upper: metadata.areasGeogLevelObject.upper.map((el) => metadata.areasObject[el]),
		lower: lowerTierLocalAuthoritiesWithDataAreas,
		related: Object.keys(parentAndRelatedAreasObject.groups)
			.filter((el) => parentAndRelatedAreasObject.groups[el].areas.length > 0)
			.map((el) => ({
				key: el,
				label: parentAndRelatedAreasObject.groups[el].labels.related
			}))
	};

	let selectionsObject = {
		'indicator-additional-chosen': new Array(0),
		'indicator-additional-visible': new Array(0),
		'indicator-related-chosen': null,
		'indicator-related-visible': null
	};

	$: {
		selectionsObject['indicator-additional-visible'] = constructVisibleAreasArray(
			selectionsObject['indicator-additional-chosen'],
			false,
			parentAndRelatedAreasObject,
			metadata.areasObject
		);

		selectionsObject['indicator-related-visible'] = constructVisibleAreasArray(
			selectionsObject['indicator-related-chosen'],
			true,
			parentAndRelatedAreasObject,
			metadata.areasObject
		);
	}

	$: accordionArrayMap = [
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
					key: 'combined',
					label: 'Combined authorities',
					data: changeAreasOptionsObject.combined,
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

	$: accordionArrayLineBarBeeswarm = [
		{
			label: 'Additional areas',
			type: 'checkbox',
			chosenKey: 'indicator-additional',
			accordion: true,
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
					key: 'combined',
					label: 'Combined authorities',
					data: changeAreasOptionsObject.combined,
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
			]
		},
		{
			label: 'Geography level',
			type: 'radio',
			search: null,
			chosenKey: 'indicator-related',
			accordion: true,
			options: [
				{
					data: changeAreasOptionsObject.related,
					accordion: false,
					labelKey: 'label',
					idKey: 'key'
				},
				{
					data: [{ label: 'None', key: 'none' }],
					accordion: false,
					labelKey: 'label',
					idKey: 'key'
				}
			]
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
	$: caveats = data.indicator.metadata.caveats
		? new MarkdownIt().render(data.indicator.metadata.caveats)
		: null;

	$: chosenStartTimePeriod = timePeriodsArray
		? timePeriodsArray.find((el) => el.xDomainNumb === chosenXDomainNumbStart)
		: null;

	onMount(() => {
		selectionsObject['indicator-related-chosen'] = 'ltla';
		selectionsObject['indicator-additional-chosen'] = codesForAreasWithData.includes('K02000001')
			? ['K02000001']
			: countriesWithDataCodes;
	});
</script>

<Breadcrumb
	links={[
		{ label: 'Home', href: 'https://www.ons.gov.uk/', refresh: true },
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
	<NavSections contentsLabel="Contents" marginTop>
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
							options={data.indicator.inferredGeos.groups.filter((g) => g.key !== 'uk')}
							bind:value={geoGroup}
							on:change={refreshData}
						/>
						<Dropdown
							id="year"
							options={timePeriodsArray.map((el) => el.label)}
							width={10}
							bind:value={chosenTimePeriodDropdownLabel}
							on:change={refreshData}
						/>
					</div>
					<div class="buttons-container">
						<ChangeAreas
							accordionArray={accordionArrayMap}
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
					{#if mapData.data.length > 0 && mapData.breaks.length > 0}
						<p class="subtitle">
							{data.indicator.metadata.subtitle}, {chosenTimePeriodDropdownLabel}
						</p>
						<Map
							data={mapData.data}
							breaks={mapData.breaks}
							geos={data.indicator.inferredGeos}
							prefix={data.indicator.metadata.prefix}
							suffix={data.indicator.metadata.suffix}
							dp={+data.indicator.metadata.decimalPlaces}
							selected={selectionsObject['indicator-additional-visible'].filter((el) =>
								mapData.data.map((elm) => elm.areacd).includes(el.areacd)
							)}
							customLookup={customLookup['indicator-additional-visible']}
							on:select={doSelect}
						/>
					{:else}{/if}
				</ContentBlock>
			</NavSection>
		{/if}

		{#if data.indicator.maxXDomainNumb != data.indicator.minXDomainNumb}
			<NavSection title="Line chart">
				<div class="row-container">
					<div class="buttons-container">
						<ChangeAreas
							accordionArray={accordionArrayLineBarBeeswarm}
							bind:selectionsObject
							customLookup={customLookup['indicator-additional-visible']}
							label={selectionsObject['indicator-additional-visible'].length === 0
								? 'Select areas'
								: 'Change areas'}
						></ChangeAreas>
						<ChartOptions
							{metadata}
							bind:chosenXDomainNumbStart
							bind:chosenXDomainNumbEnd
							bind:showConfidenceIntervals
							{timePeriodsArray}
							bind:chosenTimePeriodDropdownLabel
						></ChartOptions>
					</div>
				</div>

				<ContentBlock
					type="line-chart"
					title={data.indicator.metadata.label}
					unit={getUnit(data.indicator.metadata)}
					data={[]}
				>
					<p class="subtitle">
						{data.indicator.metadata.subtitle}, {chosenStartTimePeriod.label} to {chosenTimePeriodDropdownLabel}
					</p>
					<LineChartContainerIndicatorPage
						indicator={data.indicator}
						chartData={data.chartData}
						{selectionsObject}
						customLookup={customLookup['indicator-additional-visible']}
						{metadata}
						chosenXDomain={[chosenXDomainNumbStart, chosenXDomainNumbEnd]}
						{showConfidenceIntervals}
					></LineChartContainerIndicatorPage>
				</ContentBlock>
			</NavSection>
		{/if}

		<NavSection title="Bar chart">
			<div class="row-container">
				<div class="content-dropdowns" data-html2canvas-ignore>
					<Dropdown
						id="year"
						options={timePeriodsArray.map((el) => el.label)}
						width={10}
						bind:value={chosenTimePeriodDropdownLabel}
						on:change={refreshData}
					/>
				</div>
				<div class="buttons-container">
					<ChangeAreas
						accordionArray={accordionArrayLineBarBeeswarm}
						bind:selectionsObject
						customLookup={customLookup['indicator-additional-visible']}
						label={selectionsObject['indicator-additional-visible'].length === 0
							? 'Select areas'
							: 'Change areas'}
					></ChangeAreas>
					<ChartOptions
						{metadata}
						bind:chosenXDomainNumbStart
						bind:chosenXDomainNumbEnd
						bind:showConfidenceIntervals
						{timePeriodsArray}
						bind:chosenTimePeriodDropdownLabel
						showSlider={false}
					></ChartOptions>
				</div>
			</div>
			<ContentBlock
				type="bar-chart"
				title={data.indicator.metadata.label}
				unit={getUnit(data.indicator.metadata)}
				data={[]}
			>
				<p class="subtitle">
					{data.indicator.metadata.subtitle}, {chosenTimePeriodDropdownLabel}
				</p>
				<BarChartContainerIndicatorPage
					indicator={data.indicator}
					chartData={data.chartData}
					{selectionsObject}
					customLookup={customLookup['indicator-additional-visible']}
					{metadata}
					chosenXDomain={[chosenXDomainNumbStart, chosenXDomainNumbEnd]}
					{showConfidenceIntervals}
				></BarChartContainerIndicatorPage>
			</ContentBlock>
		</NavSection>

		<NavSection title="Table">
			<div class="row-container">
				<div class="content-dropdowns" data-html2canvas-ignore>
					<Dropdown
						options={data.indicator.inferredGeos.groups}
						bind:value={geoGroup}
						on:change={refreshData}
					/>
				</div>
			</div>
			<ContentBlock
				type="table"
				title={data.indicator.metadata.label}
				unit={getUnit(data.indicator.metadata)}
				data={pivotedData}
			>
				<p class="subtitle">
					{#if timePeriodsArray.length > 1}
						{data.indicator.metadata.subtitle}, {timePeriodsArray[timePeriodsArray.length - 1]
							.label} to {timePeriodsArray[0].label}
					{:else}
						{data.indicator.metadata.subtitle}, {timePeriodsArray[0].label}
					{/if}
				</p>

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

	.buttons-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 10px;
	}

	.subtitle {
		margin: 0px 0px 10px 0px;
		padding: 0px;
		line-height: 24px;
		font-size: 18px;
	}
</style>
