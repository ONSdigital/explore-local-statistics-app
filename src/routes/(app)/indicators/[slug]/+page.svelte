<script lang="ts">
	//@ts-nocheck
	import MarkdownIt from 'markdown-it';
	import { base, assets } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import {
		Hero,
		NavSections,
		NavSection,
		Dropdown,
		Table,
		analyticsEvent
	} from '@onsvisual/svelte-components';
	import { capitalise } from '@onsvisual/robo-utils';
	import { pivotData, makeMapData } from '$lib/util/datasets/datasetsHelpers';
	// import Indicators from '$lib/components/Indicators.svelte';
	import ContentBlock from '$lib/components/ContentBlock.svelte';
	import Map from '$lib/viz/Map.svelte';
	import ChangeAreas from '$lib/interactivity/ChangeAreas.svelte';
	import { constructVisibleAreasArray, updateCustomLookup, arrayJoin } from '$lib/utils.js';
	import LineChartContainerIndicatorPage from '$lib/prototype-components/indicator-page/LineChartContainerIndicatorPage.svelte';
	import BarChartContainerIndicatorPage from '$lib/prototype-components/indicator-page/BarChartContainerIndicatorPage.svelte';
	import ChartOptions from '$lib/prototype-components/ChartOptions.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { filterGeoGroups } from '$lib/util/geo/filterGeoGroups.js';

	export let data;

	const getUnit = (ind) => ind.subText || ind.suffix || ind.prefix;

	let geoGroups, geoGroup, prevGeoGroup, columns;
	let pivotedData, mapData;
	let selected = [];
	let chosenXDomainNumbStart,
		chosenXDomainNumbEnd,
		timePeriodsArray,
		chosenTimePeriodDropdownLabel,
		chosenStartTimePeriod;
	let showConfidenceIntervals = false;

	const maxSelection = 10;

	const parseDate = (str) => {
		const intlString = str.split('/').reverse().join('-') + 'T12:00';
		const date = new Date(intlString);
		return date.toLocaleString('en-GB', { year: 'numeric', month: 'long', day: '2-digit' });
	};
	const doSelect = (e) => {
		const chosen = selectionsObject['indicator-additional-chosen'];
		const area = e.detail?.area;
		if (chosen.includes(area.areacd))
			selectionsObject['indicator-additional-chosen'] = chosen.filter((s) => s !== area.areacd);
		else if (chosen.length < maxSelection)
			selectionsObject['indicator-additional-chosen'] = [...chosen, area.areacd];
	};

	const refreshData = () => {
		chosenXDomainNumbEnd = timePeriodsArray.find(
			(el) => el.label === chosenTimePeriodDropdownLabel
		).xDomainNumb;
		chosenXDomainNumbStart = Math.min(chosenXDomainNumbStart, chosenXDomainNumbEnd);

		pivotedData = geoGroup?.codes ? pivotData(data.chartData, geoGroup?.codes) : [];
	};

	afterNavigate(() => {
		geoGroups = filterGeoGroups(data.indicator.inferredGeos);
		geoGroup = geoGroups[geoGroups.length - 1];
		prevGeoGroup = geoGroup;

		timePeriodsArray = metadata.periodsLookupArray.filter(
			(el) =>
				el.id === data.indicator.id &&
				el.xDomainNumb >= data.indicator.minXDomainNumb &&
				el.xDomainNumb <= data.indicator.maxXDomainNumb
		);
		chosenXDomainNumbStart = data.indicator.minXDomainNumb;
		chosenXDomainNumbEnd = data.indicator.maxXDomainNumb;
		chosenTimePeriodDropdownLabel = timePeriodsArray.find(
			(el) => el.xDomainNumb === chosenXDomainNumbEnd
		).label;

		columns = [
			{ key: 'areacd', label: 'Area code' },
			{ key: 'areanm', label: 'Area name' },
			...timePeriodsArray.map((t) => ({
				key: t.xDomainNumb,
				label: t.label,
				numeric: true,
				dp: +data.indicator.metadata.decimalPlaces
			}))
		];
		refreshData();

		selectionsObject['indicator-related-chosen'] = data.indicator.metadata.initialGeographyLevel;

		selectionsObject['indicator-additional-chosen'] =
			data.indicator.metadata.standardised === 'F'
				? []
				: codesForAreasWithData.includes('K02000001')
					? ['K02000001']
					: codesForAreasWithData.includes('K03000001')
						? ['K03000001']
						: countriesWithDataCodes.length === 1
							? countriesWithDataCodes
							: [];
	});

	function filterDuplicateAreas(data, areasObject) {
		const areacds = Array.from(new Set(data.map((d) => d.areacd)));
		const areas = areacds.map((cd) => areasObject[cd]);
		const obsolete = new Set(
			areas
				.filter((area) => area.areanm.endsWith('(obsolete)'))
				.map((area) => `${area.areacd.slice(0, 3)}_${area.areanm.slice(0, -11)}`)
		);
		const remove = new Set(
			areas
				.filter((area) => obsolete.has(`${area.areacd.slice(0, 3)}_${area.areanm}`))
				.map((area) => area.areacd)
		);

		return data.filter((d) => !remove.has(d.areacd));
	}

	$: mapData =
		geoGroup?.codes && chosenXDomainNumbEnd && data.indicator.years.includes(chosenXDomainNumbEnd)
			? makeMapData(
					filterDuplicateAreas(data.chartData, data.metadata.areasObject),
					geoGroup?.codes,
					chosenXDomainNumbEnd
				)
			: { data: [], breaks: [] };

	$: chosenTimePeriodsArray = timePeriodsArray
		? timePeriodsArray.filter(
				(el) => el.xDomainNumb >= chosenXDomainNumbStart && el.xDomainNumb <= chosenXDomainNumbEnd
			)
		: null;

	$: chosenStartTimePeriod = timePeriodsArray
		? timePeriodsArray.find((el) => el.xDomainNumb === chosenXDomainNumbStart)
		: null;

	let metadata = data.metadata;

	$: codesForAreasWithData = [
		...new Set(
			filterDuplicateAreas(data.chartData, data.metadata.areasObject).map((el) => el.areacd)
		)
	];

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
				areas: countriesWithDataAreas.sort((a, b) =>
					a.areanm > b.areanm ? 1 : b.areanm > a.areanm ? -1 : 0
				),
				codes: countriesWithDataCodes
			},
			region: {
				labels: {
					related: 'All regions'
				},
				areas: regionsWithDataAreas.sort((a, b) =>
					a.areanm > b.areanm ? 1 : b.areanm > a.areanm ? -1 : 0
				),
				codes: regionsWithDataCodes
			},
			combined: {
				labels: {
					related: 'All combined authorities'
				},
				areas: combinedAuthoritiesWithDataAreas.sort((a, b) =>
					a.areanm > b.areanm ? 1 : b.areanm > a.areanm ? -1 : 0
				),
				codes: combinedAuthoritiesWithDataCodes
			},
			utla: {
				labels: {
					related: 'All upper-tier/unitary authorities'
				},
				areas: upperTierLocalAuthoritiesWithDataAreas.sort((a, b) =>
					a.areanm > b.areanm ? 1 : b.areanm > a.areanm ? -1 : 0
				),
				codes: upperTierLocalAuthoritiesWithDataCodes
			},
			ltla: {
				labels: {
					related: 'All lower-tier/unitary authorities'
				},
				areas: lowerTierLocalAuthoritiesWithDataAreas.sort((a, b) =>
					a.areanm > b.areanm ? 1 : b.areanm > a.areanm ? -1 : 0
				),
				codes: lowerTierLocalAuthoritiesWithDataCodes
			}
		}
	};

	$: changeAreasOptionsObject = {
		country: countriesWithDataAreas,
		region: regionsWithDataAreas,
		combined: combinedAuthoritiesWithDataAreas,
		upper: upperTierLocalAuthoritiesWithDataAreas,
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

	function updateSelections(chosenElement, related) {
		return constructVisibleAreasArray(
			chosenElement,
			related,
			parentAndRelatedAreasObject,
			metadata.areasObject
		);
	}

	$: selectionsObject['indicator-additional-visible'] = updateSelections(
		selectionsObject['indicator-additional-chosen'],
		false
	);

	$: selectionsObject['indicator-related-visible'] = updateSelections(
		selectionsObject['indicator-related-chosen'],
		true
	);

	$: accordionArrayMap = [
		{
			label: '',
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
					key: 'cauth',
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

	// $: console.log(accordionArrayMap);

	$: accordionArrayLineBarBeeswarm = [
		{
			label: 'Selected areas',
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
			label: 'Other areas',
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
</script>

<Hero
	title={data.indicator.metadata.label}
	width="medium"
	meta={[
		{
			key: sourceOrgs.length === 1 ? 'Data source' : 'Data sources',
			value: arrayJoin(
				Array.from(sourceOrgs.keys()).map(
					(i) => `<a href="${sourceLinks[i]}" target="_blank">${sourceOrgs[i]}</a>`
				)
			)
		},
		{
			key: 'Published on',
			value: sourceDate.every((d) => d === sourceDate[0])
				? parseDate(sourceDate[0])
				: arrayJoin(sourceDate.map((d) => parseDate(d)))
		}
	]}
	background="#eaeaea"
	titleBadge={{
		label: experimental ? 'Official statistics in development' : capitalise(data.indicator.topic),
		ariaLabel: !experimental ? `Topic: ${capitalise(data.indicator.topic)}` : null,
		color: '#003c57'
	}}
>
	<p class="ons-hero__text">
		{data.indicator.metadata.longDescription}
	</p>
</Hero>

{#if mapData && pivotedData}
	<NavSections cls="wider-nav-sections" contentsLabel="Contents" marginTop>
		{#if data.indicator.metadata.standardised === 'T'}
			<NavSection title="Map">
				<div class="row-container">
					<div class="content-dropdowns" data-html2canvas-ignore>
						<Dropdown
							label="Geography type"
							options={geoGroups.filter((g) => g.key !== 'uk')}
							bind:value={geoGroup}
							on:change={refreshData}
						/>
						<Dropdown
							id="year"
							label="Time period"
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

				{#if mapData.data.length === 0 || mapData.breaks.length === 0}
					<ContentBlock>
						<div class="no-chart-container">
							<p>
								No <span style="font-weight: bold;">{data.indicator.metadata.label}</span> data to
								display for
								<span style="font-weight: bold;">{chosenTimePeriodsArray[0].label}.</span>
							</p>
						</div>
					</ContentBlock>
				{:else}
					<ContentBlock
						title={data.indicator.metadata.label}
						indicator={data.indicator}
						metadata={data.metadata}
						unit={getUnit(data.indicator.metadata) === 'in £ millions'
							? getUnit(data.indicator.metadata)
							: null}
						data={mapData.data}
						embedProps={{
							type: 'map',
							geo: geoGroup.key,
							years: chosenTimePeriodDropdownLabel.split('-')[0],
							areas: selectionsObject['indicator-additional-visible']
								.filter((el) => mapData.data.map((elm) => elm.areacd).includes(el.areacd))
								.map((el) => el.areacd)
								.join(',')
						}}
					>
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
						<div class="ons-u-vh">
							Map for {data.indicator.metadata.label}. The data is available to download below.
						</div>
					</ContentBlock>
				{/if}
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
							disableConfidenceIntervals={data.indicator.metadata.confidenceIntervals === 'F'}
						></ChartOptions>
					</div>
				</div>

				<LineChartContainerIndicatorPage
					indicator={data.indicator}
					chartData={filterDuplicateAreas(data.chartData, data.metadata.areasObject)}
					{selectionsObject}
					customLookup={customLookup['indicator-additional-visible']}
					{metadata}
					chosenXDomain={[chosenXDomainNumbStart, chosenXDomainNumbEnd]}
					{showConfidenceIntervals}
					{chosenTimePeriodDropdownLabel}
					{chosenStartTimePeriod}
					{chosenTimePeriodsArray}
					{timePeriodsArray}
				></LineChartContainerIndicatorPage>
			</NavSection>
		{/if}

		<NavSection title="Bar chart">
			<div class="row-container">
				<div class="content-dropdowns" data-html2canvas-ignore>
					<Dropdown
						id="year"
						label="Time period"
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
					{#if data.indicator.metadata.confidenceIntervals != 'F'}
						<ChartOptions
							{metadata}
							bind:chosenXDomainNumbStart
							bind:chosenXDomainNumbEnd
							bind:showConfidenceIntervals
							{timePeriodsArray}
							bind:chosenTimePeriodDropdownLabel
							showSlider={false}
						></ChartOptions>
					{/if}
				</div>
			</div>
			<BarChartContainerIndicatorPage
				indicator={data.indicator}
				chartData={filterDuplicateAreas(data.chartData, data.metadata.areasObject)}
				{selectionsObject}
				customLookup={customLookup['indicator-additional-visible']}
				{metadata}
				chosenXDomain={[chosenXDomainNumbStart, chosenXDomainNumbEnd]}
				{showConfidenceIntervals}
				{chosenTimePeriodDropdownLabel}
				{timePeriodsArray}
				{chosenTimePeriodsArray}
			></BarChartContainerIndicatorPage>
		</NavSection>

		<NavSection title="Table">
			<div class="row-container">
				<div class="content-dropdowns" data-html2canvas-ignore>
					<Dropdown
						label="Geography type"
						options={geoGroups}
						bind:value={geoGroup}
						on:change={refreshData}
					/>
				</div>
			</div>
			<ContentBlock
				title={data.indicator.metadata.label}
				indicator={data.indicator}
				metadata={data.metadata}
				data={pivotedData}
				embedProps={{ type: 'table', geo: geoGroup.key }}
				unit={getUnit(data.indicator.metadata) === 'in £ millions'
					? getUnit(data.indicator.metadata)
					: null}
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
					<Table data={pivotedData} {columns} height={500} stickyHeader compact sortable />
				{/key}
			</ContentBlock>
		</NavSection>

		{#if caveats}
			<NavSection title="Interpretation">
				{@html caveats}
			</NavSection>
		{/if}

		<NavSection title="Get the data">
			<p>The original data source for this indicator can be found here:</p>
			<ul>
				{#each sourceOrgs as org, i}
					<li>
						<a href={sourceLinks[i]} target="_blank">{org}</a>
						<span class="ons-u-ml-xs"><Icon type="launch" /></span>
						<span class="ons-external-link__new-window-description ons-u-vh">
							(opens in a new tab)
						</span>
					</li>
				{/each}
			</ul>
			<p>
				Download all available indicators in <a
					href="{assets}/insights/datadownload.ods"
					rel="external"
					on:click={() =>
						analyticsEvent({
							event: 'fileDownload',
							extension: 'ods',
							chartType: 'all'
						})}>accompanying dataset (ODS, 7MB)</a
				>.
			</p>
			<p>
				If you would like a CSV of the data displayed in one of the individual charts above, you can
				click the "download data" link immediately below it.
			</p>
			{#if experimental}
				<p>
					Please note that these are <a
						href="https://osr.statisticsauthority.gov.uk/policies/official-statistics-policies/official-statistics-in-development/"
						class="">official statistics in development</a
					>.
				</p>
			{/if}
			<p>
				<a
					href="https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandwellbeing/methodologies/explorelocalstatisticsserviceqmi"
					>Quality and Methodology Information</a
				> for the Explore Local Statistics service details the strengths and limitations of the service,
				methods used, data uses and users.
			</p>
		</NavSection>
		<NavSection title="Other indicators">
			<p>
				{data.indicator.metadata.label} is one of
				<span style="font-weight:bold"
					>{data.metadata.indicatorsCodeLabelArray.length} local indicators</span
				>
				on the <a href="{base}/">Explore local statistics</a> service. See the
				<a href="{base}/indicators">full list of local indicators</a>.
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
		padding-bottom: 10px;
		align-items: flex-end;
	}

	.buttons-container :global(button .ons-btn__text) {
		font-size: 16px !important;
		margin-left: 6px !important;
	}

	.subtitle {
		margin: 0px 0px 10px 0px;
		padding: 0px;
		line-height: 24px;
		font-size: 18px;
	}

	.source-notes-container {
		font-size: 16px;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.notes-container {
		padding: 0px;
		margin: 0px;
		line-height: 1;
	}

	.no-chart-container {
		margin: 0px 10px;
		height: 500px;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		text-wrap: balance;
		text-align: center;
	}
</style>
