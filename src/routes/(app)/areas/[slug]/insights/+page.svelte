<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import {
		Breadcrumb,
		Titleblock,
		NavSections,
		NavSection,
		Cards,
		Card,
		Button
	} from '@onsvisual/svelte-components';
	import AreaLocMap from '$lib/components/AreaLocMap.svelte';
	import Lede from '$lib/components/Lede.svelte';
	import TopicSections from '$lib/prototype-components/area-page/TopicSections.svelte';
	import MainChartSection from '$lib/prototype-components/area-page/MainChartSection.svelte';
	import AreaSelect from '$lib/components/AreaSelect.svelte';
	import AreaList from '$lib/components/AreaList.svelte';
	import type { PageData } from './$types';

	import { onMount } from 'svelte';
	import { getName, aAn } from '@onsvisual/robo-utils';
	import { constructSameRegionAreasLabel, generateComparisonAreaGroups } from '$lib/utils.js';
	import { regions } from '$lib/config';
	import { makeCanonicalSlug } from '$lib/util/areas/makeCanonicalSlug';

	export let data: PageData;

	let metadata = data.metadata;
	let chartData = data.chartData;
	let postcode;

	//////// defining initial area data ///////

	$: selectedArea = {
		...metadata.areasObject[data.place.areacd],
		role: 'main'
	};

	$: console.log(metadata);

	// filter indicators to exclude any where there is no data for the selected area
	$: filteredIndicators = metadata.indicatorsCodeLabelArray
		.filter(
			(el) =>
				chartData.combinedDataObject[el.code].filter(
					(elm) => elm.areacd === selectedArea.areacd && elm.value
				).length > 0
		)
		.map((ind) => ({ ...ind, topic: metadata.indicatorsObject[ind.code].topic }));
	$: filteredIndicatorsCodes = filteredIndicators.map((el) => el.code);

	// determine codes for parent, country and uk areas
	// country area is null if the the selected area or parent area is a country, uk area is set to null if the parent area is the uk

	$: parentAreaCode = selectedArea.parentcd;
	$: countryAreaCode = [selectedArea.areacd, selectedArea.parentcd].includes(selectedArea.countrycd)
		? null
		: selectedArea.countrycd;
	$: ukAreaCode = 'K02000001' === selectedArea.parentcd ? null : 'K02000001';

	// determine the codes for the areas which have the same parent as the selected area (includes the selected area itself)
	$: sameRegionAreasCodes = metadata.areasArray
		.filter((el) => el.parentcd === selectedArea.parentcd)
		.map((el) => el.areacd);

	// determine the codes for similar areas to the selected area
	$: similarAreasCodes = [];
	// TODO: Use the new clustersLookup. The previous code is commented out in
	// the following lines and should be deleted.
	// $: similarAreasCodes = metadata.similarAreasLookupObject[selectedArea.areacd]
	// 	? metadata.similarAreasLookupObject[selectedArea.areacd].split('|')
	// 	: [];

	//////// defining arrays which track which areas are visible on the graphs ///////

	let chosenParentAreasArray = new Array(0),
		chosenRelatedAreasId = new Array(0),
		chosenSameRegionArray = new Array(0),
		chosenCountriesArray = new Array(0),
		chosenRegionsArray = new Array(0),
		chosenAllOtherArray = new Array(0);

	$: customAreasArray = [
		...chosenCountriesArray,
		...chosenRegionsArray,
		...chosenSameRegionArray,
		...chosenAllOtherArray
	];

	let testChosen = {
		aaaa: new Array(0),
		bbbb: new Array(0)
	};

	$: console.log(testChosen);

	//////// define area groups ///////

	// define parent areas (with respective roles) and track which of these areas are visible on the graph
	$: parentAreasCodes = [parentAreaCode, countryAreaCode, ukAreaCode].filter((el) => el);

	$: parentArea = metadata.areasObject[parentAreaCode];
	$: countryArea = metadata.areasObject[countryAreaCode];
	$: ukArea = metadata.areasObject[ukAreaCode];

	$: parentAreas = [parentArea, countryArea, ukArea]
		.filter((el) => el)
		.map((el) => ({
			...el,
			role:
				el.areacd === selectedArea.parentcd
					? 'parent'
					: el.areacd === selectedArea.countrycd
						? 'country'
						: 'uk'
		}));
	$: visibleParentAreas = parentAreas.filter((e) => chosenParentAreasArray.includes(e.areacd));

	// determine areas which are in the same region and which are similar to the selected area based on the codes
	$: sameRegionAreas = sameRegionAreasCodes.map((el) => metadata.areasObject[el]);
	$: similarAreas = similarAreasCodes.map((el) => metadata.areasObject[el]);

	// define custom areas (with respective roles = custom1, custom2,... - used for visual encoding) which are visible on the graph
	$: visibleCustomAreas = customAreasArray.map((el, i) => ({
		...metadata.areasObject[el],
		role: 'custom' + (i + 1)
	}));

	// define any same region areas and similar areas (with respective roles) which should be visible on the graph
	$: visibleSameRegionAreasCodes =
		chosenRelatedAreasId === 'sameRegion' ? sameRegionAreasCodes : [];
	$: visibleSameRegionAreas = visibleSameRegionAreasCodes.map((el) => ({
		...metadata.areasObject[el],
		role: 'sameRegion'
	}));

	$: visibleSimilarAreasCodes =
		chosenRelatedAreasId === 'similar'
			? similarAreasCodes.filter((el) => !visibleSameRegionAreasCodes.includes(el))
			: [];
	$: visibleSimilarAreas = visibleSimilarAreasCodes.map((el) => ({
		...metadata.areasObject[el],
		role: 'similar'
	}));

	//// create combined groupings of visible areas
	$: visibleAreasRelatedCodes = [...visibleSameRegionAreasCodes, ...visibleSimilarAreasCodes];
	$: visibleAreasRelated = [...visibleSameRegionAreas, ...visibleSimilarAreas];

	$: visibleAreasPrimary = [selectedArea, ...visibleParentAreas, ...visibleCustomAreas];
	$: visibleAreasPrimaryCodes = [
		selectedArea.areacd,
		...chosenParentAreasArray,
		...customAreasArray
	];

	//// define additional area groups

	// determine areas which are at the same geography level as the selected area
	$: sameGeogLevelAreasCodes = metadata.areasGeogLevelObject[selectedArea.geogLevel];
	$: sameGeogLevelAreas = sameGeogLevelAreasCodes.map((el) => metadata.areasObject[el]);

	// determine codes for (lower-tier) local authorities which are children of the selected area (null for regions and countries only)
	$: localAuthorityChildrenAreas = ['upper', 'lower'].includes(selectedArea.geogLevel)
		? null
		: metadata.areasGeogLevelObject.lower
				.map((el) => metadata.areasObject[el])
				.filter((el) => [el.parentcd, el.countrycd].includes(selectedArea.areacd));
	$: localAuthorityChildrenAreasCodes = localAuthorityChildrenAreas
		? localAuthorityChildrenAreas.map((el) => el.areacd)
		: null;

	// determine codes for regions which are children of the selected area (null for regions and countries only)
	$: regionChildrenAreas =
		selectedArea.areacd === 'E92000001' ? regions.map((el) => metadata.areasObject[el.code]) : null;
	$: regionChildrenAreasCodes = regionChildrenAreas ? regions.map((el) => el.code) : null;

	/////////
	$: sameParentCodes = sameRegionAreasCodes;

	$: countryOptionCodes =
		selectedArea.geogLevel === 'country'
			? []
			: metadata.areasGeogLevelObject.country.filter(
					(el) => el != selectedArea.areacd && !parentAreasCodes.includes(el)
				);
	$: countryOptions = countryOptionCodes.map((el) => metadata.areasObject[el]);

	$: regionOptionCodes =
		selectedArea.geogLevel === 'region'
			? []
			: metadata.areasGeogLevelObject.region.filter(
					(el) =>
						el != selectedArea.areacd &&
						!countryOptionCodes.includes(el) &&
						!parentAreasCodes.includes(el)
				);
	$: regionOptions = regionOptionCodes.map((el) => metadata.areasObject[el]);

	$: lowerTierLocalAuthorityOptionCodes = metadata.areasGeogLevelObject.lower.filter(
		(el) =>
			el != selectedArea.areacd &&
			!parentAreasCodes.includes(el) &&
			(['lower', 'upper'].includes(selectedArea.geogLevel) ? !sameParentCodes.includes(el) : true)
	);
	$: lowerTierLocalAuthorityOptions = lowerTierLocalAuthorityOptionCodes.map(
		(el) => metadata.areasObject[el]
	);

	$: upperTierLocalAuthorityOptionCodes = metadata.areasGeogLevelObject.upper.filter(
		(el) =>
			el != selectedArea.areacd &&
			!lowerTierLocalAuthorityOptionCodes.includes(el) &&
			!parentAreasCodes.includes(el) &&
			(['lower', 'upper'].includes(selectedArea.geogLevel) ? !sameParentCodes.includes(el) : true)
	);
	$: upperTierLocalAuthorityOptions = upperTierLocalAuthorityOptionCodes.map(
		(el) => metadata.areasObject[el]
	);

	//// assemble all area groups into a single object which is passed to components
	$: areasGroupsObject = {
		selected: { area: selectedArea },
		parents: { areas: parentAreas, codes: parentAreasCodes },
		custom: { areas: customAreasArray },
		sameRegion: {
			areas: sameRegionAreas,
			codes: sameRegionAreasCodes,
			label: constructSameRegionAreasLabel(selectedArea.geogLevel, selectedArea.parentnm)
		},
		similar: {
			areas: similarAreas,
			codes: similarAreasCodes,
			label: 'Demographically similar areas'
		},
		sameGeogLevel: { codes: sameGeogLevelAreasCodes },
		children: {
			laAreas: localAuthorityChildrenAreas,
			laCodes: localAuthorityChildrenAreasCodes,
			regionAreas: regionChildrenAreas,
			regionCodes: regionChildrenAreasCodes
		},
		visible: {
			primaryAreas: visibleAreasPrimary,
			primaryCodes: visibleAreasPrimaryCodes,
			relatedAreas: visibleAreasRelated,
			relatedCodes: visibleAreasRelatedCodes
		},
		options: {
			countries: { areas: countryOptions, codes: countryOptionCodes },
			regions: { areas: regionOptions, codes: regionOptionCodes },
			lowerTier: {
				areas: lowerTierLocalAuthorityOptions,
				codes: lowerTierLocalAuthorityOptionCodes
			},
			upperTier: {
				areas: upperTierLocalAuthorityOptions,
				codes: upperTierLocalAuthorityOptionCodes
			}
		}
	};

	// define an array of the possible comparison groups of areas which can be selected in the indicator rows components

	$: comparisonGroupsArray = generateComparisonAreaGroups(
		selectedArea.areacd,
		selectedArea.areanm,
		selectedArea.geogLevel,
		parentArea.areanm
	);

	onMount(() => {
		chosenParentAreasArray = [
			parentArea === undefined ? undefined : parentArea.areacd,
			ukArea === undefined ? undefined : ukArea.areacd
		];
		chosenRelatedAreasId = 'none';
	});

	function navTo(e, options = {}, type = 'search') {
		if (e.detail.type === 'postcode') {
			postcode = e.detail;
		} else {
			postcode = null;
			// analyticsEvent({
			// 	event: type === 'map' ? 'mapSelect' : 'searchSelect',
			// 	areaCode: e.detail.areacd,
			// 	areaName: e.detail.areanm,
			// 	areaType: geoCodesLookup[e.detail.areacd.slice(0, 3)].label
			// });
			goto(
				`${base}/areas/${makeCanonicalSlug(e.detail.areacd, e.detail.areanm)}/insights`,
				options
			);
		}
	}
</script>

<Breadcrumb
	links={[
		{ label: 'Home', href: '/' },
		{ label: 'Explore subnational statistics', href: `${base}/` },
		{ label: 'Find a local area', href: `${base}/areas` },
		{ label: data.place.areanm }
	]}
	background="#eaeaea"
/>
<Titleblock title="{data.place.areanm} insights" background="#eaeaea">
	<Lede
		>Explore local data and trends for <a
			href="{base}/areas/{makeCanonicalSlug(data.place.areacd, data.place.areanm)}"
			>{getName(data.place, 'the')}</a
		></Lede
	>
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
	<Card title="Data for other areas">
		<AreaSelect
			id="search"
			mode="search"
			idKey="areacd"
			labelKey="areanm"
			groupKey="group"
			label="Type a place name or postcode"
			placeholder="Eg. Titchfield or PO15 5RR"
			essOnly
			autoClear
			on:select={navTo}
		/>
		{#if postcode}
			<AreaList {postcode} on:clear={() => (postcode = null)} urlSuffix="/insights" />
		{/if}
	</Card>
</Cards>

<NavSections contentsLabel="Explore this area">
	<TopicSections
		{metadata}
		{areasGroupsObject}
		{comparisonGroupsArray}
		{chartData}
		{filteredIndicatorsCodes}
		bind:testChosen
	></TopicSections>

	<NavSection title="Select an indicator">
		<MainChartSection
			combinedSelectableAreaTypesObject={areasGroupsObject}
			{chartData}
			{metadata}
			{filteredIndicators}
			bind:chosenParentAreasArray
			bind:chosenRelatedAreasId
			bind:chosenSameRegionArray
			bind:chosenCountriesArray
			bind:chosenRegionsArray
			bind:chosenAllOtherArray
		></MainChartSection>
	</NavSection>

	<NavSection title="Similar areas">
		<p>
			Here you can find information relating to {data.place.areanm} based on the ONS's clustering analysis.
		</p>
	</NavSection>

	<NavSection title="Get the data">
		<p>Here you can find information and links to the data.</p>
	</NavSection>
</NavSections>

<style>
	:global(.select-wrapper label.ons-label) {
		font-weight: normal;
	}
</style>
