<script lang="ts">
	// @ts-nocheck

	import { base, assets } from '$app/paths';

	import type { PageData } from './$types';
	import { goto, afterNavigate } from '$app/navigation';

	import {
		Hero,
		NavSections,
		NavSection,
		Grid,
		Card,
		Button,
		Dropdown,
		Details,
		Container,
		Notice,
		analyticsEvent
	} from '@onsvisual/svelte-components';
	import UKMap from '$lib/components/UKMap.svelte';
	import AreaLocMap from '$lib/components/AreaLocMap.svelte';
	import AreaSelect from '$lib/components/AreaSelect.svelte';
	import AreaList from '$lib/components/AreaList.svelte';
	import ContentBlock from '$lib/components/ContentBlock.svelte';
	import Map from '$lib/viz/Map.svelte';
	import Legend from '$lib/viz/Legend.svelte';
	import BigNumber from '$lib/viz/BigNumber.svelte';

	import SelectAnIndicatorSection from './SelectAnIndicatorSection.svelte';
	import IndicatorRowsSection from './IndicatorRowsSection.svelte';

	import { getName, aAn } from '@onsvisual/robo-utils';
	import { capitalizeFirstLetter } from '$lib/utils.js';

	import { changeAreasIncludeExcludeObject, preSelectedComparisonAreasAndGroups } from './config';

	import { makeCanonicalSlug } from '$lib/util/areas/makeCanonicalSlug';
	import { updateVisibleAreasArray } from '$lib/util/interactivity/updateVisibleAreasArray';
	import { updateCustomLookup } from '$lib/util/interactivity/updateCustomLookup';

	import { makeGeoArray } from './util/geo/makeGeoArray';
	import { getSimilarAreas } from './util/geo/getSimilarAreas';
	import { makeNeighboursArray } from './util/geo/makeNeighboursArray';
	import { makeClusterDescriptions } from './util/geo/makeClusterDescriptions';
	import { findChildrenAreas } from './util/geo/findChildrenAreas';
	import { constructRelatedAreasGroups } from './util/geo/constructRelatedAreasGroups.js';
	import { createIndicatorRowsAccordionArray } from './util/interactivity/createIndicatorRowsAccordionArray';
	import { createSelectAnIndicatorAccordionArray } from './util/interactivity/createSelectAnIndicatorAccordionArray';
	// import { navigateToOtherAreaPage } from './util/url/navigateToOtherAreaPage';
	import viewport from './util/interactivity/useViewportAction';

	export let data: PageData;

	let metadata = data.metadata;
	let chartData = data.chartData;
	let nonObsoleteAreas = {};
	let stickyZIndex;

	Object.entries(metadata.areasObject).forEach(([key, value]) => {
		if (!value.areanm.includes('(obsolete)')) {
			nonObsoleteAreas[key] = value;
		}
	});

	let selectElement, postcode, searchValue;
	let areaSearchOpen = false;
	let mapColors = null;

	let navigated;

	let selectedArea, ukAreaCode, parentArea, countryArea, ukArea;

	let filteredIndicators, filteredIndicatorsCodes, chosenIndicatorId;

	let parentAreaCode,
		countryAreaCode,
		sameGeogLevelCodes,
		sameGeogLevelAreas,
		sameParentAreas,
		sameParentSameGeogAreas,
		sameParentSameGeogCodes,
		similarCodesForIndicatorRows,
		similarAreasForIndicatorRows,
		regionChildrenAreas,
		regionChildrenCodes,
		upperTierLocalAuthorityChildrenAreas,
		upperTierLocalAuthorityChildrenCodes,
		lowerTierLocalAuthorityChildrenAreas,
		lowerTierLocalAuthorityChildrenCodes;

	let parentAndRelatedAreasObject, changeAreasOptionsObject;

	let clusterGroupsArray,
		clusterGroup,
		areaClusters,
		areaNeighbours,
		clusterDescriptions,
		similarAreas,
		demographicallySimilarAreas,
		bigNumberData;

	//The same function as used on the /areas/[slug] page - was removed to a separate function but not working because of issues passing data - could possibly be fixed with stores?
	function navTo(e, options = {}, type = 'search') {
		if (e.detail.type === 'postcode') {
			postcode = e.detail;
		} else {
			areaSearchOpen = false;
			selectElement.clearInput();

			// window.location.href = `${base}/areas/${makeCanonicalSlug(e.detail.areacd, e.detail.areanm)}/indicators`;
			goto(
				`${base}/areas/${makeCanonicalSlug(e.detail.areacd, e.detail.areanm)}/indicators`,
				options
			);
		}
	}

	afterNavigate(() => {
		// variables which track search inputs when users search for other areas
		postcode = null;
		searchValue = null;

		// merges together data for our selected area
		selectedArea = {
			...metadata.areasObject[data.place.areacd],
			role: 'main',
			similarCluster:
				metadata.clustersLookup.data.demographic[
					metadata.clustersLookup.data.areacd.indexOf(data.place.areacd)
				]
		};

		// filter indicators to exclude any where there is no data for the selected area
		filteredIndicators = metadata.indicatorsCodeLabelArray
			.filter((el) =>
				chartData.combinedDataObject[el.code].find(
					(elm) => elm.areacd === selectedArea.areacd && elm.value
				)
			)
			.map((ind) => ({ ...ind, topic: metadata.indicatorsObject[ind.code].topic }));
		filteredIndicatorsCodes = filteredIndicators.map((el) => el.code);
		chosenIndicatorId = filteredIndicators[0];

		// determine codes for parent, country and uk areas
		// country area is null if the the selected area or parent area is a country, uk area is set to null if the parent area is the uk

		parentAreaCode = selectedArea.parentcd;
		countryAreaCode = [selectedArea.areacd, selectedArea.parentcd].includes(selectedArea.countrycd)
			? null
			: selectedArea.countrycd;
		ukAreaCode = 'K02000001' === selectedArea.parentcd ? null : 'K02000001';

		parentArea = nonObsoleteAreas[parentAreaCode];
		countryArea = nonObsoleteAreas[countryAreaCode];
		ukArea = nonObsoleteAreas[ukAreaCode];

		// determine which areas are of the same geography level as the selected area
		sameGeogLevelCodes = metadata.areasGeogLevelObject[selectedArea.geogLevel].filter((d) =>
			Object.keys(nonObsoleteAreas).includes(d)
		);
		sameGeogLevelAreas = sameGeogLevelCodes.map((el) => nonObsoleteAreas[el]);

		// determine which areas have the same parentArea as the selected area
		sameParentAreas = metadata.areasArray.filter(
			(el) =>
				el.parentcd === selectedArea.parentcd &&
				el.areacd != selectedArea.areacd &&
				Object.keys(nonObsoleteAreas).includes(el.areacd)
		);

		// determine which areas have the same parentArea and are of the same geography level as the selected area
		sameParentSameGeogAreas = sameGeogLevelAreas.filter(
			(el) =>
				el.parentcd === selectedArea.parentcd &&
				el.areacd != selectedArea.areacd &&
				Object.keys(nonObsoleteAreas).includes(el.areacd)
		);
		sameParentSameGeogCodes = sameParentSameGeogAreas.map((el) => el.areacd);

		// determine the cluster of areas similar to our selected area for the default model (should be global)
		clusterGroupsArray = metadata.clustersLookup.types.map((t) => ({
			id: t,
			label: `${capitalizeFirstLetter(t.replace('global', 'all'))} indicators`
		}));

		clusterGroup = clusterGroupsArray[0];
		// Find the cluster data for the selected area
		areaClusters = data.chartData.clusterData.find((d) => d.areacd === data.place.areacd);
		// Find nearest neighbours for the selected area
		areaNeighbours = data.chartData.neighbourData?.[data.place.areacd] || null;
		console.log({ areaClusters, areaNeighbours });
		// Get the cluster descriptions
		clusterDescriptions = makeClusterDescriptions(data.metadata.clustersLookup.descriptions);
		similarAreas = getSimilarAreas(
			areaClusters,
			clusterGroup,
			metadata,
			chartData.clusterData,
			parentArea
		);

		// determine which areas are the demographically similar areas to our selected area
		demographicallySimilarAreas = getSimilarAreas(
			areaClusters,
			{ id: 'demographic' },
			metadata,
			chartData.clusterData,
			parentArea
		);

		similarAreasForIndicatorRows = [
			...demographicallySimilarAreas.region,
			...demographicallySimilarAreas.other
		].filter((el) => el != selectedArea.areacd);
		similarCodesForIndicatorRows = similarAreasForIndicatorRows.map((el) => el.areacd);

		// determine which regions are children of the selected area
		regionChildrenAreas = findChildrenAreas(metadata, selectedArea, 'region');
		regionChildrenCodes = regionChildrenAreas.map((el) => el.areacd);

		// determine which UTLAs are children of the selected area
		upperTierLocalAuthorityChildrenAreas = findChildrenAreas(metadata, selectedArea, 'upper');
		upperTierLocalAuthorityChildrenCodes = upperTierLocalAuthorityChildrenAreas.map(
			(el) => el.areacd
		);

		// determine which LTLAs are children of the selected area
		lowerTierLocalAuthorityChildrenAreas = findChildrenAreas(metadata, selectedArea, 'lower');
		lowerTierLocalAuthorityChildrenCodes = lowerTierLocalAuthorityChildrenAreas.map(
			(el) => el.areacd
		);

		// create an object which stores all the different areas or groups of areas that the user may want to select
		parentAndRelatedAreasObject = {
			parent: parentArea,
			country: countryArea,
			uk: ukArea,
			groups: constructRelatedAreasGroups(
				selectedArea,
				parentArea,
				sameGeogLevelAreas,
				sameGeogLevelCodes,
				sameParentSameGeogAreas,
				sameParentSameGeogCodes,
				similarAreasForIndicatorRows,
				similarCodesForIndicatorRows,
				regionChildrenAreas,
				regionChildrenCodes,
				upperTierLocalAuthorityChildrenAreas,
				upperTierLocalAuthorityChildrenCodes,
				lowerTierLocalAuthorityChildrenAreas,
				lowerTierLocalAuthorityChildrenCodes
			)
		};

		// filter to get the groups of areas that we want the user to be able to (a) view the median value for, and (b) add as the background beeswarm
		changeAreasOptionsObject = {
			median: Object.keys(parentAndRelatedAreasObject.groups)
				.filter(
					(el) =>
						changeAreasIncludeExcludeObject[selectedArea.geogLevel].median[el] &&
						parentAndRelatedAreasObject.groups[el].areas.length > 0
				)
				.map((el) => ({
					key: el,
					label: parentAndRelatedAreasObject.groups[el].labels.comparison
				})),
			related: Object.keys(parentAndRelatedAreasObject.groups)
				.filter(
					(el) =>
						changeAreasIncludeExcludeObject[selectedArea.geogLevel].related[el] &&
						parentAndRelatedAreasObject.groups[el].areas.length > 0
				)
				.map((el) => ({
					key: el,
					label: parentAndRelatedAreasObject.groups[el].labels.related
				})),
			parents: [parentArea, countryArea, ukArea].filter((el) => el),
			sameParent: sameParentAreas,
			country: makeGeoArray(selectedArea.areacd, 'country', metadata, selectedArea),
			region: makeGeoArray(selectedArea.areacd, 'region', metadata, selectedArea),
			combined: makeGeoArray(selectedArea.areacd, 'combined', metadata, selectedArea),
			upper: makeGeoArray(selectedArea.areacd, 'upper', metadata, selectedArea),
			lower: makeGeoArray(selectedArea.areacd, 'lower', metadata, selectedArea),
			neighbours: makeNeighboursArray(metadata, selectedArea)
		};

		//set initial selections for primary comparison (e.g median of xxx), for related area group on indicator row charts (e.g. all other local authorities ) and related area group on the 'select an indicator' chart
		['areas-rows-comparison-chosen', 'related-rows-chosen', 'related-single-chosen'].forEach(
			(el) => {
				selectionsObject[el] = preSelectedComparisonAreasAndGroups[el][selectedArea.geogLevel];
			}
		);

		// Set data for big numbers
		bigNumberData = [
			'population-indicators-Population count',
			'population-indicators-5-year population change',
			'population-indicators-Median age'
		]
			.map((indicator) => ({
				indicator,
				value: chartData.combinedDataObject[indicator]
					.filter((d) => d.areacd === data.place.areacd)
					.sort((a, b) => b.xDomainNumb - a.xDomainNumb)[0],
				meta: metadata.indicatorsObject[indicator].metadata,
				periods: metadata.periodsLookupObject[metadata.indicatorsObject[indicator].id]
			}))
			.filter((d) => d.value);
		console.log({ bigNumberData });

		//once the after navigate actions have been run we set navigate to true so that the html components are rendered
		navigated = true;
	});

	//define selection options - note that the initial selections for these are set at the end of the afterNavigate function immediately above
	let selectionsObject = {
		'areas-rows-comparison-chosen': new Array(0),
		'areas-rows-comparison-visible': new Array(0),
		'areas-rows-additional-chosen': new Array(0),
		'areas-rows-additional-visible': new Array(0),
		'areas-single-additional-chosen': new Array(0),
		'areas-single-additional-visible': new Array(0),
		'related-rows-chosen': null,
		'related-rows-visible': null,
		'related-single-chosen': null,
		'related-single-visible': null
	};

	//when the indicator rows comparison is updated, filter the additional areas array to exclude the comparison area - this prevents duplication
	$: {
		selectionsObject['areas-rows-additional-chosen'] = selectionsObject[
			'areas-rows-additional-chosen'
		].filter((el) => el != selectionsObject['areas-rows-comparison-chosen']);
	}

	//when a user interacts with the change areas selections, selectionsObject[xxx-chosen] will update, and the updateVisibleAreasArray triggers to update [selectionsObject[xxx-visible] accordingly - with metadata and ascribing a role to each selected group / area
	$: selectionsObject['areas-rows-comparison-visible'] = updateVisibleAreasArray(
		selectionsObject['areas-rows-comparison-chosen'],
		false,
		parentAndRelatedAreasObject,
		nonObsoleteAreas
	);

	$: selectionsObject['areas-rows-additional-visible'] = updateVisibleAreasArray(
		selectionsObject['areas-rows-additional-chosen'],
		false,
		parentAndRelatedAreasObject,
		nonObsoleteAreas
	);

	$: selectionsObject['related-rows-visible'] = updateVisibleAreasArray(
		selectionsObject['related-rows-chosen'],
		true,
		parentAndRelatedAreasObject,
		nonObsoleteAreas
	);

	$: selectionsObject['areas-single-additional-visible'] = updateVisibleAreasArray(
		selectionsObject['areas-single-additional-chosen'],
		false,
		parentAndRelatedAreasObject,
		nonObsoleteAreas
	);

	$: selectionsObject['related-single-visible'] = updateVisibleAreasArray(
		selectionsObject['related-single-chosen'],
		true,
		parentAndRelatedAreasObject,
		nonObsoleteAreas
	);

	//creates the accordion array for the indicator rows section of the page. each element of the array contains a checkbox or radio selection and defines which areas can be chosen from and which selectionsObject entry is updated when a selection is made
	$: rowsAccordionArray = navigated
		? createIndicatorRowsAccordionArray(
				selectedArea,
				parentArea,
				changeAreasOptionsObject,
				selectionsObject,
				areaNeighbours
			)
		: [];

	//creates the accordion array for the 'select an indicator' section of the page. each element of the array contains a checkbox or radio selection and defines which areas can be chosen from and which selectionsObject entry is updated when a selection is made
	$: singleAccordionArray = navigated
		? createSelectAnIndicatorAccordionArray(
				selectedArea,
				parentArea,
				changeAreasOptionsObject,
				selectionsObject
			)
		: [];

	//custom lookup keeps a track of all selected areas with a 'custom' role (e.g. they're not a main, parent, uk area or a related group) - it then gives each area a integer id, which it keeps until it is deselected. this id is used to give these custom areas a colour which is preserved when other areas are deselected
	let customLookup = {
		'areas-rows-additional-visible': {},
		'areas-single-additional-visible': {}
	};

	$: {
		customLookup['areas-rows-additional-visible'] = updateCustomLookup(
			customLookup['areas-rows-additional-visible'],
			selectionsObject['areas-rows-additional-visible'].filter((el) => el.role === 'custom')
		);

		customLookup['areas-single-additional-visible'] = updateCustomLookup(
			customLookup['areas-single-additional-visible'],
			selectionsObject['areas-single-additional-visible'].filter((el) => el.role === 'custom')
		);
	}
	// handles change when choosing different cluster types. Only clusterGroup changes as it's bound to the dropdown, everything is coming for data on load.
	$: similarAreas = getSimilarAreas(
		areaClusters,
		clusterGroup,
		metadata,
		chartData.clusterData,
		parentArea
	);

	$: console.log('chartData', chartData);
</script>

{#if navigated}
	<div class="titleblock-container">
		<Hero
			width="medium"
			title="Local indicators for {getName(data.place, 'the')}"
			background="#f5f5f6"
		>
			<p class="ons-hero__text">
				Local indicators, trends and data for {getName(data.place, 'the', 'prefix')}
				<a href="{base}/areas/{makeCanonicalSlug(data.place.areacd, data.place.areanm)}"
					>{getName(data.place)}</a
				>
				({data.place.areacd})
				{#if data.place.end}
					<span class="inactive-badge">Inactive</span>
				{/if}
			</p>
			<div style:margin="20px 0 -36px" style:max-width="450px" style:z-index={1}>
				<Details title="Find another area" bind:open={areaSearchOpen}>
					<label for="search" style:display="block" style:margin-bottom="8px"
						>Search for a place name or postcode</label
					>
					<AreaSelect
						id="search"
						mode="search"
						idKey="areacd"
						labelKey="areanm"
						groupKey="group"
						placeholder="Eg. Fareham or PO15 5RR"
						essOnly
						hideIcon
						bind:selectElement
						bind:value={searchValue}
						on:submit={navTo}
						on:clear={() => (postcode = null)}
					/>
					{#if postcode}
						<AreaList
							{postcode}
							on:clear={() => {
								postcode = null;
								searchValue = null;
							}}
							urlSuffix="/indicators"
						/>
					{/if}
				</Details>
			</div>
		</Hero>

		<AreaLocMap
			geometry={data.geometry}
			bounds={data.place.bounds}
			mapDescription={'Map of ' + getName(data.place, 'the')}
		/>
	</div>

	{#if data.place.end}
		<Container width="medium" marginTop>
			<Notice>
				<p>
					This geographic area is no longer active.
					{#if data.place.successor && data.place.end === new Date().getFullYear() - 1}
						However, for a period it may continue to have more data available than its successor
						area, {getName(data.place.successor, 'the', 'prefix')}
						<a
							data-sveltekit-reload
							href="{base}/areas/{makeCanonicalSlug(
								data.place.successor.areacd,
								data.place.successor.areanm
							)}/indicators">{getName(data.place.successor)}</a
						>
						({data.place.successor.areacd}).
					{:else if data.place.successor}
						You may find more data available for its successor area,
						{getName(data.place.successor, 'the', 'prefix')}
						<a
							data-sveltekit-reload
							href="{base}/areas/{makeCanonicalSlug(
								data.place.successor.areacd,
								data.place.successor.areanm
							)}/indicators">{getName(data.place.successor)}</a
						>
						({data.place.successor.areacd}).
					{/if}
				</p>
			</Notice>
		</Container>
	{:else if data.place.replaces?.[0]?.areacd && data.place?.start === new Date().getFullYear()}
		<Container width="medium" marginTop>
			<Notice>
				<p>
					This is a newly defined geographic area. For a period you may find more data for
					{#each data.place.replaces as rep, i}
						{data.place.areanm === rep.areanm ? 'the previous' : getName(rep, 'the', 'prefix')}
						<a
							data-sveltekit-reload
							href="{base}/areas/{makeCanonicalSlug(rep.areacd, rep.areanm)}/indicators"
							data-sveltekit-noscroll>{getName(rep)}</a
						>
						({rep.areacd}){i === data.place.replaces.length - 2 ? ' and ' : ', '}
					{/each}
					which it superseded.
				</p>
			</Notice>
		</Container>
	{/if}

	{#if bigNumberData.length > 0}
		<Grid colWidth="medium" marginTop marginBottom={false}>
			{#each bigNumberData as props}
				<BigNumber {...props} />
			{/each}
		</Grid>
	{/if}

	<div
		use:viewport
		on:enterViewport={() => {
			stickyZIndex = 0;
		}}
		on:exitViewport={() => {
			stickyZIndex = 10;
		}}
	></div>

	{#key filteredIndicators}
		<NavSections
			cls="no-display-hidden-header wider-nav-sections"
			contentsLabel="Contents"
			marginTop
		>
			<IndicatorRowsSection
				{selectedArea}
				{metadata}
				{chartData}
				{filteredIndicatorsCodes}
				bind:selectionsObject
				accordionArray={rowsAccordionArray}
				customLookup={customLookup['areas-rows-additional-visible']}
				bind:stickyZIndex
			></IndicatorRowsSection>

			<NavSection title="Select an indicator">
				<SelectAnIndicatorSection
					customLookup={customLookup['areas-single-additional-visible']}
					bind:selectionsObject
					accordionArray={singleAccordionArray}
					{filteredIndicators}
					{chartData}
					{metadata}
					{selectedArea}
					{chosenIndicatorId}
				></SelectAnIndicatorSection>
			</NavSection>

			{#if areaClusters && areaNeighbours}
				<NavSection title="Similar areas">
					<p>
						See which areas are similar to {getName(data.place, 'the')} based on specific groups of indicators.
						These clusters of areas are based on
						<a
							href="https://www.ons.gov.uk/peoplepopulationandcommunity/wellbeing/methodologies/clusteringsimilarlocalauthoritiesandstatisticalnearestneighboursintheukmethodology"
							>an analysis carried out by the ONS</a
						>.
					</p>
					<ContentBlock showActions={false}>
						<Dropdown
							label="Select a group of indicators:"
							options={clusterGroupsArray.filter((c) => areaClusters[c.id])}
							bind:value={clusterGroup}
						/>
						{#if mapColors}
							<Legend
								items={[
									{
										colour: mapColors[areaClusters[clusterGroup.id]] || 'lightgrey',
										label: 'Areas in cluster',
										type: 'circle'
									},
									{ colour: 'black', label: 'Statistically similar areas', type: 'refline' }
								]}
							/>
						{/if}
						<Map
							data={data.chartData.clusterData}
							clusterKey={clusterGroup.id}
							legendType={null}
							selected={[data.place]}
							neighbours={areaNeighbours[clusterGroup.id].map((d) => ({
								areacd: d,
								global: 'a'
							}))}
							bind:colors={mapColors}
							mapDescription="Map showing clusters of similar areas"
						/>

						{#if areaClusters[clusterGroup.id] && mapColors}
							<p style:margin-top="12px">
								<strong
									class="cluster-highlight"
									style:background={mapColors[areaClusters[clusterGroup.id]]}
								>
									{capitalizeFirstLetter(getName(data.place, 'the'))} is in {clusterGroup.id} cluster
									{areaClusters[clusterGroup.id].toUpperCase()}.
								</strong>
							</p>
						{/if}
						<Details
							title={clusterGroup.id === 'global'
								? `Show the twenty most statistically similar areas for ${getName(data.place, 'the')}`
								: `Show the twenty most similar areas to ${getName(data.place, 'the')}, according to ${clusterGroup.id} statistics.`}
						>
							<ol>
								{#each areaNeighbours[clusterGroup.id] as neighbour}
									<li>
										<a
											href="{base}/areas/{makeCanonicalSlug(
												neighbour,
												metadata.areasObject[neighbour].areanm
											)}/indicators">{metadata.areasObject[neighbour].areanm}</a
										>
									</li>
								{/each}
							</ol>
						</Details>
						<p style:margin-top="12px">
							{clusterDescriptions?.[clusterGroup.id]?.[areaClusters[clusterGroup.id]] || ''}
						</p>
					</ContentBlock>
				</NavSection>
			{:else if areaNeighbours}
				<NavSection title="Similar areas">
					<p>
						Below is the ranked list of areas statistically similar to {getName(data.place, 'the')},
						based on a specific group of indicators. This ranking is derived from
						<a
							href="https://www.ons.gov.uk/peoplepopulationandcommunity/wellbeing/methodologies/clusteringsimilarlocalauthoritiesandstatisticalnearestneighboursintheukmethodology"
							>an analysis carried out by the ONS</a
						>.
					</p>
					<ContentBlock showActions={false}>
						<Dropdown
							label="Select a group of indicators:"
							options={clusterGroupsArray.filter((c) => areaNeighbours[c.id])}
							bind:value={clusterGroup}
						/>

						<ol>
							{#each areaNeighbours[clusterGroup.id] as neighbour}
								<li>
									<a
										href="{base}/areas/{makeCanonicalSlug(
											neighbour,
											metadata.areasObject[neighbour].areanm
										)}/indicators">{metadata.areasObject[neighbour].areanm}</a
									>
								</li>
							{/each}
						</ol>
					</ContentBlock>
				</NavSection>
			{/if}

			<NavSection title="Get the data" cls="ons-u-mt-xl">
				<p>
					Download <a
						href="{assets}/insights/datadownload.ods"
						rel="external"
						on:click={() =>
							analyticsEvent({
								event: 'fileDownload',
								extension: 'ods',
								chartType: 'all'
							})}>accompanying datasets with indicators for all areas (ODS, 7MB)</a
					>.
				</p>
				<p>
					To download a CSV of the <a href="#select-an-indicator">Select an indicator</a> data, click
					the "download the data" link immediately below the chart.
				</p>
				<p>
					Information on the strengths and limitations of the Explore Local Statistics (ELS) service
					and methods used is available in
					<a
						href="https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandwellbeing/methodologies/explorelocalstatisticsserviceqmi"
						>ELS quality and methodology information (QMI) report</a
					>.
				</p>
				<p>
					We value your feedback on these statistics. If you would like to get in touch, please
					email <a href="mailto:explore.local.statistics@ons.gov.uk"
						>explore.local.statistics@ons.gov.uk</a
					>.
				</p>
			</NavSection>
		</NavSections>
	{/key}
{/if}

<style>
	:global(.select-wrapper label.ons-label) {
		font-weight: normal;
	}
	.cluster-highlight {
		display: inline-block;
		font-weight: bold;
		color: white;
		padding: 0 6px;
		border-radius: 3px;
	}
	:global(.no-display-hidden-header h3.ons-u-vh) {
		display: none;
	}

	.titleblock-container {
		position: relative;
	}

	:global(.title-container) {
		position: relative;
		max-width: 700px;
		z-index: 1;
	}

	:global(.ons-breadcrumb__items) {
		z-index: 1;
	}

	.inactive-badge {
		font-weight: bold;
		color: white;
		padding: 0 8px 2px 8px;
		border-radius: 4px;
		background-color: #fa6401;
		margin-right: 2px;
	}
</style>
