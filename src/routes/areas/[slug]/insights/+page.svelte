<script lang="ts">
	import { base } from '$app/paths';
	import { Breadcrumb, Titleblock, NavSections, NavSection } from '@onsvisual/svelte-components';
	import Subhead from '$lib/layout/partial/Subhead.svelte';
	import AreaNav from '$lib/prototype-components/AreaNav.svelte';
	import TopicSection from '$lib/prototype-components/area-page/TopicSection.svelte';
	import MainChartSection from '$lib/prototype-components/area-page/MainChartSection.svelte';
	import type { PageData } from './$types';

	import { onMount } from 'svelte';
	import { constructSameRegionAreasLabel } from '$lib/utils.js';

	export let data: PageData;

	$: metadata = data.metadata;
	$: chartData = data.chartData;

	////

	// define arrays which are used to track the selection of comparison areas
	let chosenParentAreasArray = new Array(0),
		chosenRelatedAreasArray = new Array(0),
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

	////

	$: selectedArea = metadata.areasArray
		.filter((el) => el.areacd === data.place.areacd)
		.map((el) => ({
			...el,
			role: 'main'
		}))[0];
	$: parentArea = metadata.areasArray.find((el) => el.areacd === selectedArea.parentcd);
	$: countryArea = metadata.areasArray.find(
		(el) => el.areacd === selectedArea.countrycd && el.areacd != selectedArea.parentcd
	);
	$: ukArea = metadata.areasArray.find(
		(el) =>
			el.areacd === 'K02000001' &&
			el.areacd != selectedArea.parentcd &&
			el.areacd != selectedArea.countrycd
	);

	$: parentAreas = [parentArea, countryArea, ukArea]
		.filter((el) => el != undefined)
		.map((el) => ({
			...el,
			role:
				el.areacd === selectedArea.parentcd
					? 'parent'
					: el.areacd === selectedArea.countrycd
						? 'country'
						: 'uk'
		}));
	$: parentAreasCodes = parentAreas.map((el) => el.areacd);
	$: visibleParentAreas = parentAreas.filter(
		(e) => chosenParentAreasArray.includes(e.areacd) || e.areacd === selectedArea.areacd
	);

	////
	$: visibleCustomAreas = metadata.areasArray
		.filter((el) => customAreasArray.includes(el.areacd))
		.map((el, i) => ({
			...el,
			role: 'custom' + (i + 1)
		}));
	$: visibleCustomAreasCodes = visibleCustomAreas.map((el) => el.areacd);

	////

	$: sameRegionAreas = metadata.areasArray.filter(
		(el) => el.parentcd === selectedArea.parentcd && el.areacd != selectedArea.areacd
	);
	$: sameRegionAreasCodes = sameRegionAreas.map((el) => el.areacd);

	$: visibleSameRegionAreas = sameRegionAreas
		.filter(
			(el) =>
				!visibleCustomAreasCodes.includes(el.areacd) &&
				chosenRelatedAreasArray.includes('sameRegion')
		)
		.map((el) => ({
			...el,
			role: 'sameRegion'
		}));
	$: visibleSameRegionAreasCodes = visibleSameRegionAreas.map((el) => el.areacd);

	////

	$: similarAreasCodes = metadata.similarAreasLookupObject[selectedArea.areacd].split('|');
	$: similarAreas = metadata.areasArray.filter((el) => similarAreasCodes.includes(el.areacd));

	$: visibleSimilarAreas = similarAreas
		.filter(
			(el) =>
				!visibleCustomAreasCodes.includes(el.areacd) &&
				!visibleSameRegionAreasCodes.includes(el.areacd) &&
				chosenRelatedAreasArray.includes('similar')
		)
		.map((el) => ({
			...el,
			role: 'similar'
		}));

	////
	$: visibleAreasRelated = [...visibleSameRegionAreas, ...visibleSimilarAreas];
	$: visibleAreasRelatedCodes = visibleAreasRelated.map((el) => el.areacd);

	$: visibleAreasPrimary = [selectedArea, ...visibleParentAreas, ...visibleCustomAreas];
	$: visibleAreasPrimaryCodes = visibleAreasPrimary.map((el) => el.areacd);

	////

	$: sameGeogLevelAreasCodes = metadata.areasArray
		.filter((el) => el.geogLevel === selectedArea.geogLevel)
		.map((el) => el.areacd);

	/////
	$: countriesAreas = metadata.areasArray.filter(
		(el) => el.geogLevel === 'country' && !parentAreasCodes.includes(el.areacd)
	);
	$: regionsAreas = metadata.areasArray.filter(
		(el) => el.geogLevel === 'region' && !parentAreasCodes.includes(el.areacd)
	);

	$: combinedSelectableAreaTypesObject = {
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
		countries: { areas: countriesAreas },
		regions: { areas: regionsAreas },
		visible: {
			primaryAreas: visibleAreasPrimary,
			primaryCodes: visibleAreasPrimaryCodes,
			relatedAreas: visibleAreasRelated,
			relatedCodes: visibleAreasRelatedCodes
		}
	};

	onMount(() => {
		/*chosenParentAreasArray = [
			parentArea === undefined ? undefined : parentArea.areacd,
			countryArea === undefined ? undefined : countryArea.areacd
		];*/

		chosenRelatedAreasArray = ['sameRegion'];
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
	{#each metadata.topicsArray as topic, i}
		<TopicSection
			{topic}
			{combinedSelectableAreaTypesObject}
			{chartData}
			{metadata}
			bind:chosenParentAreasArray
			bind:chosenRelatedAreasArray
			bind:chosenSameRegionArray
			bind:chosenCountriesArray
			bind:chosenRegionsArray
			bind:chosenAllOtherArray
		></TopicSection>
	{/each}

	<NavSection title="Select an indicator">
		<MainChartSection
			{combinedSelectableAreaTypesObject}
			{chartData}
			{metadata}
			bind:chosenParentAreasArray
			bind:chosenRelatedAreasArray
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
