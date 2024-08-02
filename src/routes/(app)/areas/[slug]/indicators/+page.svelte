<script lang="ts">
	// @ts-nocheck

	import { base } from '$app/paths';

	import type { PageData } from './$types';
	import { goto, afterNavigate } from '$app/navigation';

	import {
		Breadcrumb,
		Titleblock,
		NavSections,
		NavSection,
		Cards,
		Card,
		Button,
		Dropdown,
		Twisty,
		analyticsEvent
	} from '@onsvisual/svelte-components';

	import AreaLocMap from '$lib/components/AreaLocMap.svelte';
	import Lede from '$lib/components/Lede.svelte';
	import AreaSelect from '$lib/components/AreaSelect.svelte';
	import AreaList from '$lib/components/AreaList.svelte';
	import ContentBlock from '$lib/components/ContentBlock.svelte';
	import Map from '$lib/viz/Map.svelte';

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

	let postcode, searchValue;
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
		clusterDescriptions,
		similarAreas,
		demographicallySimilarAreas;

	//The same function as used on the /areas/[slug] page - was removed to a separate function but not working because of issues passing data - could possibly be fixed with stores?
	function navTo(e, options = {}, type = 'search') {
		if (e.detail.type === 'postcode') {
			postcode = e.detail;
		} else {
			goto(`${base}/areas/${makeCanonicalSlug(e.detail.areacd, e.detail.areanm)}`, options);
		}
	}

	afterNavigate(() => {
		// variables which track search inputs when users search for other areas
		postcode = null;
		searchValue = null;

		// merges together data for our selected area
		selectedArea = {
			...nonObsoleteAreas[data.place.areacd],
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
		areaClusters = data.chartData.clusterData.find((d) => d.areacd === data.place.areacd);
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
			lower: makeGeoArray(selectedArea.areacd, 'lower', metadata, selectedArea)
		};

		//set initial selections for primary comparison (e.g median of xxx), for related area group on indicator row charts (e.g. all other local authorities ) and related area group on the 'select an indicator' chart
		['areas-rows-comparison-chosen', 'related-rows-chosen', 'related-single-chosen'].forEach(
			(el) => {
				selectionsObject[el] = preSelectedComparisonAreasAndGroups[el][selectedArea.geogLevel];
			}
		);

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
				selectionsObject
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
</script>

{#if navigated}
	<Breadcrumb
		links={[
			{ label: 'Home', href: 'https://www.ons.gov.uk/', refresh: true },
			{ label: 'Explore local statistics', href: `${base}/` },
			...[...data.place.parents].reverse().map((p) => ({
				label: getName(p),
				href: `${base}/areas/${makeCanonicalSlug(p.areacd, p.areanm)}`
			})),

			{
				label: getName(data.place),
				href: `${base}/areas/${makeCanonicalSlug(data.place.areacd, data.place.areanm)}`
			},
			{ label: `Local indictators` }
		]}
		background="#eaeaea"
	/>

	<Titleblock title="Local indicators for {getName(data.place, 'the')}" background="#eaeaea">
		<Lede>Explore local indicators, trends and get data for {getName(data.place, 'the')}</Lede>
	</Titleblock>

	<Cards marginTop>
		<Card noBackground>
			<div style:height="200px">
				{#key data.geometry}
					<AreaLocMap geometry={data.geometry} bounds={data.place.bounds} />
				{/key}
			</div>
		</Card>
		<Card title="About this area">
			<p>
				{getName(data.place)} ({data.place.areacd}) is {aAn(data.place.typenm)}
				{getName(data.place.parents[0], 'in', 'prefix')}
				<a
					href="{base}/areas/{makeCanonicalSlug(
						data.place.parents[0].areacd,
						data.place.parents[0].areanm
					)}"
					data-sveltekit-noscroll>{getName(data.place.parents[0])}</a
				>.
			</p>
			<Button
				variant="secondary"
				icon="arrow"
				iconPosition="after"
				href="{base}/areas/{makeCanonicalSlug(data.place.areacd, data.place.areanm)}"
				small>Read more</Button
			>
		</Card>
		<Card title="Other areas">
			<label for="search" style:display="block" style:margin-bottom="8px"
				>Type a place name or postcode</label
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
		</Card>
	</Cards>
	<div
		use:viewport
		on:enterViewport={() => {
			stickyZIndex = 0;
		}}
		on:exitViewport={() => {
			stickyZIndex = 10;
		}}
	></div>
	<NavSections cls="no-display-hidden-header" contentsLabel="Contents">
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

		{#if areaClusters}
			<NavSection title="Similar areas">
				<p>
					See which areas are similar to {getName(data.place, 'the')} based on specific groups of indicators.
					These clusters of areas are based on
					<a
						href="https://www.ons.gov.uk/peoplepopulationandcommunity/wellbeing/methodologies/clusteringsimilarlocalauthoritiesintheukmethodology"
						target="_blank">an analysis carried out by the ONS</a
					>.
				</p>
				<ContentBlock showActions={false}>
					<Dropdown
						label="Select a group of indicators:"
						options={clusterGroupsArray.filter((c) => areaClusters[c.id])}
						bind:value={clusterGroup}
					/>
					<Map
						data={data.chartData.clusterData}
						clusterKey={clusterGroup.id}
						legendType={null}
						selected={[data.place]}
						bind:colors={mapColors}
					/>
					{#if areaClusters[clusterGroup.id] && mapColors}
						<p style:margin-top="12px">
							<strong
								class="cluster-highlight"
								style:background={mapColors[areaClusters[clusterGroup.id]]}
							>
								{capitalizeFirstLetter(getName(data.place, 'the'))} is in
								{clusterGroup.id} cluster {areaClusters[clusterGroup.id].toUpperCase()}
							</strong>
						</p>
						<Twisty
							title="Show all areas in {clusterGroup.id} cluster {areaClusters[
								clusterGroup.id
							].toUpperCase()}"
						>
							<p>
								Areas {getName(parentArea, 'in')}<br />
								{#each similarAreas.region as area, i}
									<a href="{base}/areas/{makeCanonicalSlug(area.areacd, area.areanm)}/indicators"
										>{area.areanm}</a
									>{i < similarAreas.region.length - 1 ? `, ` : '.'}
								{/each}
							</p>
							<p>
								Other areas<br />
								{#each similarAreas.other as area, i}
									<a href="{base}/areas/{makeCanonicalSlug(area.areacd, area.areanm)}/indicators"
										>{area.areanm}</a
									>{i < similarAreas.other.length - 1 ? `, ` : '.'}
								{/each}
							</p>
						</Twisty>
						<p style:margin-top="12px">
							{clusterDescriptions?.[clusterGroup.id]?.[areaClusters[clusterGroup.id]] || ''}
						</p>
					{/if}
				</ContentBlock>
			</NavSection>
		{/if}

		<NavSection title="Get the data">
			<p>
				Download available indicators for all areas in our <a
					href="{base}/insights/datadownload.ods"
					rel="external"
					on:click={() =>
						analyticsEvent({
							event: 'fileDownload',
							extension: 'ods',
							chartType: 'all'
						})}>accompanying dataset (ODS, 4MB)</a
				>.
			</p>
			<p>
				If you would like a CSV of the data displayed in the <a href="#select-an-indicator"
					>select an indicator</a
				> chart above, you can click the "download data" link immediately below it.
			</p>
		</NavSection>
	</NavSections>
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
</style>
