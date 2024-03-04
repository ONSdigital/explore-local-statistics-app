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
	import { derived, writable } from 'svelte/store';

	import { onMount } from 'svelte';
	import { getName, aAn } from '@onsvisual/robo-utils';
	import {
		capitalizeFirstLetter,
		constructVisibleAreasArray,
		formatName,
		getGeogName,
		updateCustomLookup
	} from '$lib/utils.js';
	import { changeAreasIncludeExcludeObject } from '$lib/config';
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

	$: parentArea = metadata.areasObject[parentAreaCode];
	$: countryArea = metadata.areasObject[countryAreaCode];
	$: ukArea = metadata.areasObject[ukAreaCode];

	// determine the codes for the areas which have the same parent as the selected area (includes the selected area itself)

	$: sameGeogLevelCodes = metadata.areasGeogLevelObject[selectedArea.geogLevel];
	$: sameGeogLevelAreas = sameGeogLevelCodes.map((el) => metadata.areasObject[el]);

	$: sameParentAreas = metadata.areasArray.filter(
		(el) => el.parentcd === selectedArea.parentcd && el.areacd != selectedArea.areacd
	);

	$: sameParentSameGeogCodes = sameGeogLevelCodes.filter(
		(el) => (el) => el.parentcd === selectedArea.parentcd && el.areacd != selectedArea.areacd
	);
	$: sameParentSameGeogAreas = sameParentSameGeogCodes.map((el) => metadata.areasObject[el]);

	// determine the codes for similar areas to the selected area
	$: selectedAreaDemographicCluster =
		metadata.clustersLookup.data.demographic[
			metadata.clustersLookup.data.areacd.indexOf(selectedArea.areacd)
		];

	$: similarCodes = metadata.clustersLookup.data.areacd.filter(
		(el, i) =>
			metadata.clustersLookup.data.demographic[i] === selectedAreaDemographicCluster &&
			el != selectedArea.areacd
	);
	$: similarAreas = similarCodes.map((el) => metadata.areasObject[el]).filter((el) => el);

	$: regionChildrenAreas = {
		lower: [],
		upper: [],
		region: [],
		country: metadata.areasGeogLevelObject.region
			.map((el) => metadata.areasObject[el])
			.filter((el) => [el.parentcd, el.countrycd].includes(selectedArea.areacd))
	}[selectedArea.geogLevel];
	$: regionChildrenCodes = regionChildrenAreas.map((el) => el.areacd);

	$: upperTierLocalAuthorityChildrenAreas = {
		lower: [],
		upper: [],
		region: metadata.areasGeogLevelObject.upper
			.map((el) => metadata.areasObject[el])
			.filter((el) => [el.parentcd, el.countrycd].includes(selectedArea.areacd)),
		country: metadata.areasGeogLevelObject.upper
			.map((el) => metadata.areasObject[el])
			.filter((el) => [el.parentcd, el.countrycd].includes(selectedArea.areacd))
	}[selectedArea.geogLevel];
	$: upperTierLocalAuthorityChildrenCodes = upperTierLocalAuthorityChildrenAreas.map(
		(el) => el.areacd
	);

	$: lowerTierLocalAuthorityChildrenAreas = {
		lower: [],
		upper: [],
		region: metadata.areasGeogLevelObject.lower
			.map((el) => metadata.areasObject[el])
			.filter((el) => [el.parentcd, el.countrycd].includes(selectedArea.areacd)),
		country: metadata.areasGeogLevelObject.lower
			.map((el) => metadata.areasObject[el])
			.filter((el) => [el.parentcd, el.countrycd].includes(selectedArea.areacd))
	}[selectedArea.geogLevel];
	$: lowerTierLocalAuthorityChildrenCodes = lowerTierLocalAuthorityChildrenAreas.map(
		(el) => el.areacd
	);

	$: parentAndRelatedAreasObject = {
		parent: parentArea,
		country: countryArea,
		uk: ukArea,
		groups: {
			'all-siblings': {
				labels: {
					comparison:
						'Average (median) of all ' + getGeogName(selectedArea.geogLevel, false, 'simplified'),
					related: 'All other ' + getGeogName(selectedArea.geogLevel, false, 'simplified')
				},
				areas: sameGeogLevelAreas,
				codes: sameGeogLevelCodes
			},
			'same-parent-siblings': {
				labels: {
					comparison:
						'Average (median) of all ' +
						getGeogName(selectedArea.geogLevel, false, 'simplified') +
						' in ' +
						formatName(parentArea.areanm),
					related:
						'All other ' +
						getGeogName(selectedArea.geogLevel, false, 'simplified') +
						' in ' +
						formatName(parentArea.areanm)
				},
				areas: sameParentSameGeogAreas,
				codes: sameParentSameGeogCodes
			},
			'similar-siblings': {
				labels: {
					comparison:
						'Average (median) of all demographically similar ' +
						getGeogName(selectedArea.geogLevel, false, 'simplified'),
					related:
						'Demographically similar ' + getGeogName(selectedArea.geogLevel, false, 'simplified')
				},
				areas: similarAreas,
				codes: similarCodes
			},
			'region-children': {
				labels: {
					related: capitalizeFirstLetter(
						getGeogName('region', false, 'full') + ' in ' + formatName(selectedArea.areanm)
					)
				},
				areas: regionChildrenAreas,
				codes: regionChildrenCodes
			},
			'upper-tier-local-authority-children': {
				labels: {
					related: capitalizeFirstLetter(
						getGeogName('upper', false, 'full') + ' in ' + formatName(selectedArea.areanm)
					)
				},
				areas: upperTierLocalAuthorityChildrenAreas,
				codes: upperTierLocalAuthorityChildrenCodes
			},
			'lower-tier-local-authority-children': {
				labels: {
					related: capitalizeFirstLetter(
						getGeogName('lower', false, 'full') + ' in ' + formatName(selectedArea.areanm)
					)
				},
				areas: lowerTierLocalAuthorityChildrenAreas,
				codes: lowerTierLocalAuthorityChildrenCodes
			}
		}
	};

	$: changeAreasOptionsObject = {
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
		country: metadata.areasGeogLevelObject.country
			.filter((el) => el != selectedArea.areacd)
			.map((el) => metadata.areasObject[el]),
		region: metadata.areasGeogLevelObject.region
			.filter((el) => el != selectedArea.areacd)
			.map((el) => metadata.areasObject[el]),
		upper: metadata.areasGeogLevelObject.upper
			.filter((el) => el != selectedArea.areacd)
			.map((el) => metadata.areasObject[el]),
		lower: metadata.areasGeogLevelObject.lower
			.filter((el) => el != selectedArea.areacd)
			.map((el) => metadata.areasObject[el])
	};

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

	$: console.log(selectionsObject);

	$: {
		selectionsObject['areas-rows-comparison-visible'] = constructVisibleAreasArray(
			selectionsObject['areas-rows-comparison-chosen'],
			false,
			parentAndRelatedAreasObject,
			metadata.areasObject
		);

		selectionsObject['areas-rows-additional-visible'] = constructVisibleAreasArray(
			selectionsObject['areas-rows-additional-chosen'],
			false,
			parentAndRelatedAreasObject,
			metadata.areasObject
		);

		selectionsObject['related-rows-visible'] = constructVisibleAreasArray(
			selectionsObject['related-rows-chosen'],
			true,
			parentAndRelatedAreasObject,
			metadata.areasObject
		);
	}

	$: rowsAccordionArray = [
		{
			label: 'Primary comparison area/measure',
			type: 'radio',
			chosenKey: 'areas-rows-comparison',
			accordion: true,
			options: [
				{
					data: [{ label: 'None', key: 'none' }],
					accordion: false,
					labelKey: 'label',
					idKey: 'key'
				},
				{
					data: changeAreasOptionsObject.median,
					accordion: false,
					labelKey: 'label',
					idKey: 'key'
				},
				{
					data: changeAreasOptionsObject.parents,
					accordion: false
				},
				{
					label: 'Other areas in ' + formatName(parentArea.areanm),
					data: changeAreasOptionsObject.sameParent,
					accordion: true,
					include: ['lower', 'upper'].includes(selectedArea.geogLevel)
				},
				{
					label: 'Countries',
					data: changeAreasOptionsObject.country,
					accordion: true,
					include: true
				},
				{ label: 'Regions', data: changeAreasOptionsObject.region, accordion: true },
				{
					label: 'Upper-tier local authorities',
					data: changeAreasOptionsObject.upper,
					accordion: true
				},
				{
					label: 'Lower-tier local authorities',
					data: changeAreasOptionsObject.lower,
					accordion: true
				}
			]
		},
		{
			label: 'Related areas',
			type: 'radio',
			search: null,
			chosenKey: 'related-rows',
			accordion: true,
			options: [
				{
					data: [{ label: 'None', key: 'none' }],
					accordion: false,
					labelKey: 'label',
					idKey: 'key'
				},
				{
					data: changeAreasOptionsObject.related,
					accordion: false,
					labelKey: 'label',
					idKey: 'key'
				}
			]
		},
		{
			label: 'Additional areas',
			type: 'checkbox',
			chosenKey: 'areas-rows-additional',
			dependency: 'areas-rows-comparison',
			accordion: true,
			options: [
				{
					data: changeAreasOptionsObject.parents,
					accordion: false
				},
				{
					label: 'Other areas in ' + formatName(parentArea.areanm),
					data: changeAreasOptionsObject.sameParent,
					accordion: true,
					include: ['lower', 'upper'].includes(selectedArea.geogLevel)
				},
				{
					label: 'Countries',
					data: changeAreasOptionsObject.country,
					accordion: true
				},
				{ label: 'Regions', data: changeAreasOptionsObject.region, accordion: true },
				{
					label: 'Upper-tier local authorities',
					data: changeAreasOptionsObject.upper,
					accordion: true
				},
				{
					label: 'Lower-tier local authorities',
					data: changeAreasOptionsObject.lower,
					accordion: true
				}
			].map((el) => ({
				...el,
				data: el.data.filter(
					(elm) => elm.areacd != selectionsObject['areas-rows-comparison-chosen']
				)
			}))
		}
	];

	$: {
		selectionsObject['areas-rows-additional-chosen'] = selectionsObject[
			'areas-rows-additional-chosen'
		].filter((el) => el != selectionsObject['areas-rows-comparison-chosen']);
	}

	$: customLookup = {
		'areas-rows-additional-visible': {},
		'areas-single-additional-visible': {}
	};

	$: {
		customLookup['areas-rows-additional-visible'] = updateCustomLookup(
			customLookup['areas-rows-additional-visible'],
			selectionsObject['areas-rows-additional-visible'].filter((el) => el.role === 'custom')
		);
	}

	onMount(() => {
		selectionsObject['areas-rows-comparison-chosen'] = {
			lower: 'all-siblings',
			upper: 'all-siblings',
			region: 'E92000001',
			country: 'K02000001'
		}[selectedArea.geogLevel];

		selectionsObject['related-rows-chosen'] = {
			lower: 'all-siblings',
			upper: 'all-siblings',
			region: 'all-siblings',
			country: 'all-siblings'
		}[selectedArea.geogLevel];
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
		{selectedArea}
		{metadata}
		{chartData}
		{filteredIndicatorsCodes}
		bind:selectionsObject
		accordionArray={rowsAccordionArray}
		customLookup={customLookup['areas-rows-additional-visible']}
	></TopicSections>

	<NavSection title="Select an indicator">
		<!-- <MainChartSection
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
		></MainChartSection> -->
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
