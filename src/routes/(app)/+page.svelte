<script lang="ts">
	// @ts-nocheck
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { geoCodesLookup } from '$lib/config/geoConfig.js';
	import { makeCanonicalSlug } from '$lib/util/areas/makeCanonicalSlug.js';
	import {
		Breadcrumb,
		Titleblock,
		Section,
		Divider,
		analyticsEvent,
		List,
		Cards,
		Card,
		Button
	} from '@onsvisual/svelte-components';
	import Lede from '$lib/components/Lede.svelte';
	import AreaSelect from '$lib/components/AreaSelect.svelte';
	import AreaList from '$lib/components/AreaList.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import UKMap from '$lib/components/UKMap.svelte';

	export let data;

	const datasetsCount = data.coreMetadata.indicatorsCodeLabelArray.length;

	let postcode = null;

	// Functions etc
	function navTo(e) {
		if (!e.detail) return;
		if (e.detail.type === 'postcode') {
			postcode = e.detail;
		} else {
			postcode = null;
			analyticsEvent({
				event: 'searchSelect',
				areaCode: e.detail.areacd,
				areaName: e.detail.areanm,
				areaType: geoCodesLookup[e.detail.areacd.slice(0, 3)].label
			});
			goto(`${base}/areas/${makeCanonicalSlug(e.detail.areacd, e.detail.areanm)}`);
		}
	}
</script>

<Breadcrumb
	links={[
		{ label: 'Home', href: 'https://www.ons.gov.uk/', refresh: true },
		{ label: 'Explore local statistics' }
	]}
	background="#e9eff4"
/>

<Titleblock title="Explore local statistics" background="#e9eff4">
	<UKMap />
	<Lede>Find, compare and visualise statistics about places in the United Kingdom.</Lede>
	<div style:height="32px" />
</Titleblock>

<Cards marginTop id="nav-cards">
	<Card title="Find an area">
		<p style:margin-bottom="28px">
			<label for="search"
				>Search for a postcode, local authority, region, parliamentary constituency or other named
				area.</label
			>
		</p>

		<AreaSelect
			id="search"
			mode="search"
			idKey="areacd"
			labelKey="areanm"
			groupKey="group"
			placeholder="Eg. Fareham, or PO15 5RR"
			on:submit={navTo}
		/>

		{#if postcode}
			<AreaList {postcode} on:clear={() => (postcode = null)} />
		{/if}
	</Card>
	<Card title="Local indicators">
		<p style:margin-bottom="28px">
			Explore {datasetsCount} indicators, including
			<a href="{base}/indicators/wellbeing-satisfaction" class="no-wrap">life satisfaction</a>,
			<a href="{base}/indicators/employment-rate">employment rate</a> and
			<a href="{base}/indicators/4g-coverage">4G coverage</a>.
		</p>
		<Button icon="arrow" iconPosition="after" href="{base}/indicators" small
			>Explore indicators</Button
		>
	</Card>
</Cards>

<Section>
	<p>
		You can also start from <a href="{base}/areas/E92000001-england">England</a>,
		<a href="{base}/areas/W92000004-wales">Wales</a>,
		<a href="{base}/areas/S92000003-scotland">Scotland</a>
		or <a href="{base}/areas/N92000002-northern-ireland">Northern Ireland</a>.
	</p>
</Section>

<Divider hr="full" />

<Section title="Other sources of local statistics">
	<p>Wales, Scotland and Northern Ireland have their own producers of official statistics.</p>

	<List mode="dash">
		<li>
			<a href="https://statswales.gov.wales/Catalogue" target="_blank" rel="noreferrer">Wales</a>
			<span class="inline-icon"><Icon type="launch" /></span>
		</li>
		<li>
			<a href="https://statistics.gov.scot/home" target="_blank" rel="noreferrer">Scotland</a>
			<span class="inline-icon"><Icon type="launch" /></span>
		</li>
		<li>
			<a href="https://data.nisra.gov.uk/" target="_blank" rel="noreferrer">Northern Ireland</a>
			<span class="inline-icon"><Icon type="launch" /></span>
		</li>
	</List>
</Section>
<Section title="About these pages">
	<p>These pages are part of the Explore Subnational Statistics (ESS) service.</p>

	<p>
		The vision for the ESS service was launched in the <a
			href="https://analysisfunction.civilservice.gov.uk/policy-store/gss-subnational-data-strategy/"
			>GSS subnational data strategy</a
		>, which provides a framework to guide the UK Government Statistical Service (GSS) in producing
		and disseminating subnational statistics in a more timely, granular and harmonised way.
	</p>
	<p>
		The ESS service aims to provide one place for users to find, visualise, compare and download
		subnational statistics by standardised geographies and customer-defined areas.
	</p>
</Section>

<style>
	.no-wrap {
		white-space: nowrap;
	}
	:global(#nav-cards .ons-btn__inner) {
		height: 40px;
	}
</style>
