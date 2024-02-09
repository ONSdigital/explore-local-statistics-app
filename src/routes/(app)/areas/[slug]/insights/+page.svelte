<script lang="ts">
	import { base } from '$app/paths';
	import { Breadcrumb, Titleblock, NavSections, NavSection } from '@onsvisual/svelte-components';
	import Subhead from '$lib/layout/partial/Subhead.svelte';
	import AreaNav from '$lib/prototype-components/AreaNav.svelte';
	import TopicSections from '$lib/prototype-components/area-page/TopicSections.svelte';
	import MainChartSection from '$lib/prototype-components/area-page/MainChartSection.svelte';
	import type { PageData } from './$types';

	import { onMount } from 'svelte';
	import { constructSameRegionAreasLabel, generateComparisonAreaGroups } from '$lib/utils.js';
	import { regions } from '$lib/config';

	export let data: PageData;

	let metadata = data.metadata;
	let chartData = data.chartData;

	//////// defining initial area data ///////

	// define the selected area (with role = main)
	$: selectedArea = metadata.areasArray
		.filter((el) => el.areacd === data.place.areacd)
		.map((el) => ({
			...el,
			role: 'main'
		}))[0];

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
	$: similarAreasCodes = metadata.similarAreasLookupObject[selectedArea.areacd]
		? metadata.similarAreasLookupObject[selectedArea.areacd].split('|')
		: [];

	//////// defining arrays which track which areas are visible on the graphs ///////

	let chosenParentAreasArray = new Array(0),
		chosenRelatedAreasId,
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
		/*chosenParentAreasArray = [
			parentArea === undefined ? undefined : parentArea.areacd,
			countryArea === undefined ? undefined : countryArea.areacd
		];*/
		chosenRelatedAreasId = 'none';
	});
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
<Titleblock title={data.place.areanm} background="#eaeaea">
	<Subhead>Get localised data, insights and trends for {data.place.areanm}</Subhead>
</Titleblock>
<AreaNav areas={metadata.areasArray}></AreaNav>

<NavSections contentsLabel="Explore this area">
	<TopicSections {metadata} {areasGroupsObject} {comparisonGroupsArray} {chartData}></TopicSections>

	<NavSection title="Select an indicator">
		<MainChartSection
			combinedSelectableAreaTypesObject={areasGroupsObject}
			{chartData}
			{metadata}
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
