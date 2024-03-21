<script lang="ts">
	// @ts-nocheck
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import {
		Breadcrumb,
		Titleblock,
		NavSections,
		NavSection,
		Cards,
		Card,
		Button,
		Dropdown,
		Twisty
	} from '@onsvisual/svelte-components';
	import AreaLocMap from '$lib/components/AreaLocMap.svelte';
	import Lede from '$lib/components/Lede.svelte';
	import TopicSections from '$lib/prototype-components/area-page/TopicSections.svelte';
	import MainChartSection from '$lib/prototype-components/area-page/MainChartSection.svelte';
	import AreaSelect from '$lib/components/AreaSelect.svelte';
	import AreaList from '$lib/components/AreaList.svelte';
	import ContentBlock from '$lib/components/ContentBlock.svelte';
	import Map from '$lib/viz/Map.svelte';
	import type { PageData } from './$types';
	import { afterNavigate } from '$app/navigation';

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
	let mapColors = null;

	let navigated,
		selectedAreaDemographicCluster,
		selectedArea,
		filteredIndicators,
		filteredIndicatorsCodes,
		parentAreaCode,
		countryAreaCode,
		ukAreaCode,
		parentArea,
		countryArea,
		ukArea,
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
		lowerTierLocalAuthorityChildrenCodes,
		parentAndRelatedAreasObject,
		changeAreasOptionsObject,
		clusterGroupsArray,
		clusterGroup,
		areaClusters,
		clusterDescription,
		similarAreas;

	function makeGeoArray(areacd, level) {
		const allAreas = metadata.areasGeogLevelObject[level];
		const filter = metadata.areasObject[selectedArea.areacd].geogLevel === level;
		const areas = filter ? allAreas.filter((cd) => cd !== areacd) : allAreas;
		return areas.map((cd) => metadata.areasObject[cd]);
	}

	function getSimilarAreas(areaClusters, clusterGroup) {
		if (!areaClusters?.[clusterGroup.id]) return { region: [], other: [] };
		const all = data.chartData.clusterData
			.filter(
				(d) =>
					d[clusterGroup.id] === areaClusters[clusterGroup.id] &&
					data.metadata.areasObject[d.areacd]
			)
			.map((d) => data.metadata.areasObject[d.areacd]);
		const region = [];
		const other = [];
		for (const d of all) {
			if (d.parentcd === parentArea.areacd) region.push(d);
			else other.push(d);
		}
		return { region, other };
	}

	afterNavigate(() => {
		selectedAreaDemographicCluster =
			metadata.clustersLookup.data.demographic[
				metadata.clustersLookup.data.areacd.indexOf(data.place.areacd)
			];

		selectedArea = {
			...metadata.areasObject[data.place.areacd],
			role: 'main',
			similarCluster: selectedAreaDemographicCluster
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

		// determine codes for parent, country and uk areas
		// country area is null if the the selected area or parent area is a country, uk area is set to null if the parent area is the uk

		parentAreaCode = selectedArea.parentcd;
		countryAreaCode = [selectedArea.areacd, selectedArea.parentcd].includes(selectedArea.countrycd)
			? null
			: selectedArea.countrycd;
		ukAreaCode = 'K02000001' === selectedArea.parentcd ? null : 'K02000001';

		parentArea = metadata.areasObject[parentAreaCode];
		countryArea = metadata.areasObject[countryAreaCode];
		ukArea = metadata.areasObject[ukAreaCode];

		sameGeogLevelCodes = metadata.areasGeogLevelObject[selectedArea.geogLevel];
		sameGeogLevelAreas = sameGeogLevelCodes.map((el) => metadata.areasObject[el]);

		sameParentAreas = metadata.areasArray.filter(
			(el) => el.parentcd === selectedArea.parentcd && el.areacd != selectedArea.areacd
		);

		sameParentSameGeogAreas = sameGeogLevelAreas.filter(
			(el) => el.parentcd === selectedArea.parentcd && el.areacd != selectedArea.areacd
		);
		sameParentSameGeogCodes = sameParentSameGeogAreas.map((el) => el.areacd);

		similarCodesForIndicatorRows = metadata.clustersLookup.data.areacd.filter(
			(el, i) =>
				metadata.clustersLookup.data.demographic[i] === selectedAreaDemographicCluster &&
				el != selectedArea.areacd
		);
		similarAreasForIndicatorRows = similarCodesForIndicatorRows
			.map((el) => metadata.areasObject[el])
			.filter((el) => el);

		regionChildrenAreas = {
			lower: [],
			upper: [],
			combined: [],
			region: [],
			country: metadata.areasGeogLevelObject.region
				.map((el) => metadata.areasObject[el])
				.filter((el) => [el.parentcd, el.countrycd].includes(selectedArea.areacd))
		}[selectedArea.geogLevel];
		regionChildrenCodes = regionChildrenAreas.map((el) => el.areacd);

		upperTierLocalAuthorityChildrenAreas = {
			lower: [],
			upper: [],
			combined: [],
			region: metadata.areasGeogLevelObject.upper
				.map((el) => metadata.areasObject[el])
				.filter((el) => [el.parentcd, el.countrycd].includes(selectedArea.areacd)),
			country: metadata.areasGeogLevelObject.upper
				.map((el) => metadata.areasObject[el])
				.filter((el) => [el.parentcd, el.countrycd].includes(selectedArea.areacd))
		}[selectedArea.geogLevel];
		upperTierLocalAuthorityChildrenCodes = upperTierLocalAuthorityChildrenAreas.map(
			(el) => el.areacd
		);

		lowerTierLocalAuthorityChildrenAreas = {
			lower: [],
			upper: [],
			combined: [],
			region: metadata.areasGeogLevelObject.lower
				.map((el) => metadata.areasObject[el])
				.filter((el) => [el.parentcd, el.countrycd].includes(selectedArea.areacd)),
			country: metadata.areasGeogLevelObject.lower
				.map((el) => metadata.areasObject[el])
				.filter((el) => [el.parentcd, el.countrycd].includes(selectedArea.areacd))
		}[selectedArea.geogLevel];
		lowerTierLocalAuthorityChildrenCodes = lowerTierLocalAuthorityChildrenAreas.map(
			(el) => el.areacd
		);

		parentAndRelatedAreasObject = {
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
					areas: similarAreasForIndicatorRows,
					codes: similarCodesForIndicatorRows
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
			country: makeGeoArray(selectedArea.areacd, 'country'),
			region: makeGeoArray(selectedArea.areacd, 'region'),
			combined: makeGeoArray(selectedArea.areacd, 'combined'),
			upper: makeGeoArray(selectedArea.areacd, 'upper'),
			lower: makeGeoArray(selectedArea.areacd, 'lower')
		};

		clusterGroupsArray = metadata.clustersLookup.types.map((t) => ({
			id: t,
			label: `${capitalizeFirstLetter(t.replace('global', 'all'))} indicators`
		}));
		clusterGroup = clusterGroupsArray[0];
		areaClusters = data.chartData.clusterData.find((d) => d.areacd === data.place.areacd);
		clusterDescription = areaClusters?.[clusterGroup.id]
			? data.metadata.clustersLookup.descriptions.find(
					(d) => d.type === clusterGroup.id && d.letter === areaClusters[clusterGroup.id]
				)?.text
			: '';
		similarAreas = getSimilarAreas(areaClusters, clusterGroup);

		selectionsObject['areas-rows-comparison-chosen'] = {
			lower: 'all-siblings',
			upper: 'all-siblings',
			region: 'E92000001',
			country: 'K02000001',
			combined: 'all-siblings'
		}[selectedArea.geogLevel];

		selectionsObject['related-rows-chosen'] = {
			lower: 'all-siblings',
			upper: 'all-siblings',
			region: 'all-siblings',
			country: 'all-siblings',
			combined: 'all-siblings'
		}[selectedArea.geogLevel];

		selectionsObject['related-single-chosen'] = {
			lower: 'all-siblings',
			upper: 'all-siblings',
			region: 'all-siblings',
			country: 'all-siblings',
			combined: 'all-siblings'
		}[selectedArea.geogLevel];

		navigated = true;
	});

	//////// defining initial area data ///////

	// determine the codes for the areas which have the same parent as the selected area (includes the selected area itself)

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

	function updateSelections(chosenElement, related) {
		return constructVisibleAreasArray(
			chosenElement,
			related,
			parentAndRelatedAreasObject,
			metadata.areasObject
		);
	}

	$: selectionsObject['areas-rows-comparison-visible'] = updateSelections(
		selectionsObject['areas-rows-comparison-chosen'],
		false
	);

	$: selectionsObject['areas-rows-additional-visible'] = updateSelections(
		selectionsObject['areas-rows-additional-chosen'],
		false
	);

	$: selectionsObject['related-rows-visible'] = updateSelections(
		selectionsObject['related-rows-chosen'],
		true
	);

	$: selectionsObject['areas-single-additional-visible'] = updateSelections(
		selectionsObject['areas-single-additional-chosen'],
		false
	);

	$: selectionsObject['related-single-visible'] = updateSelections(
		selectionsObject['related-single-chosen'],
		true
	);

	$: rowsAccordionArray = navigated
		? [
				{
					label: 'Primary comparison area',
					type: 'radio',
					chosenKey: 'areas-rows-comparison',
					accordion: true,
					options: [
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
							data: [{ label: 'None', key: 'none' }],
							accordion: false,
							labelKey: 'label',
							idKey: 'key'
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
							label: 'Combined authorities',
							data: changeAreasOptionsObject.combined,
							accordion: true
						},
						{
							label: 'Upper-tier/unitary authorities',
							data: changeAreasOptionsObject.upper,
							accordion: true
						},
						{
							label: 'Lower-tier/unitary authorities',
							data: changeAreasOptionsObject.lower,
							accordion: true
						}
					]
				},
				{
					label: 'Related area group',
					type: 'radio',
					search: null,
					chosenKey: 'related-rows',
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
							label: 'Combined authorities',
							data: changeAreasOptionsObject.combined,
							accordion: true
						},
						{
							label: 'Upper-tier/unitary authorities',
							data: changeAreasOptionsObject.upper,
							accordion: true
						},
						{
							label: 'Lower-tier/unitary authorities',
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
			]
		: [];

	$: singleAccordionArray = navigated
		? [
				{
					label: 'Related area group',
					type: 'radio',
					search: null,
					chosenKey: 'related-single',
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
				},
				{
					label: 'Additional areas',
					type: 'checkbox',
					chosenKey: 'areas-single-additional',
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
							label: 'Combined authorities',
							data: changeAreasOptionsObject.combined,
							accordion: true
						},
						{
							label: 'Upper-tier/unitary authorities',
							data: changeAreasOptionsObject.upper,
							accordion: true
						},
						{
							label: 'Lower-tier/unitary authorities',
							data: changeAreasOptionsObject.lower,
							accordion: true
						}
					]
				}
			]
		: [];

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

		customLookup['areas-single-additional-visible'] = updateCustomLookup(
			customLookup['areas-single-additional-visible'],
			selectionsObject['areas-single-additional-visible'].filter((el) => el.role === 'custom')
		);
	}

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
				`${base}/areas/${makeCanonicalSlug(e.detail.areacd, e.detail.areanm)}/indicators`,
				options
			);
		}
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
				on:submit={navTo}
			/>
			{#if postcode}
				<AreaList {postcode} on:clear={() => (postcode = null)} urlSuffix="/indicators" />
			{/if}
		</Card>
	</Cards>

	<NavSections contentsLabel="Contents">
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
			<MainChartSection
				customLookup={customLookup['areas-single-additional-visible']}
				bind:selectionsObject
				accordionArray={singleAccordionArray}
				{filteredIndicators}
				{chartData}
				{metadata}
				{selectedArea}
			></MainChartSection>
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
							{clusterDescription || ''}
						</p>
					{/if}
				</ContentBlock>
			</NavSection>
		{/if}

		<NavSection title="Get the data">
			<p>Here you can find information and links to the data.</p>
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
</style>
