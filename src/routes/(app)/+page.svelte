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

	const datasetsCount = data.metadata.indicatorsCodeLabelArray.length;

	let postcode = null;

	// Functions etc
	function navTo(e) {
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
	<Lede>Find, compare and visualise statistics about places within the United Kingdom</Lede>
	<div style:height="32px" />
</Titleblock>

<Cards marginTop>
	<Card title="Find an area">
		<p style:margin-bottom="28px">
			<label for="search"
				>Search for a postcode, local authority, ward, parish or parliamentary constituency.</label
			>
		</p>

		<AreaSelect
			id="search"
			mode="search"
			idKey="areacd"
			labelKey="areanm"
			groupKey="group"
			placeholder="Eg. Fareham, or PO15 5RR"
			autoClear
			on:select={navTo}
		/>

		{#if postcode}
			<AreaList {postcode} on:clear={() => (postcode = null)} />
		{/if}
	</Card>
	<Card title="Browse indicators">
		<p style:margin-bottom="28px">
			Explore {datasetsCount} local indicators, including
			<a href="{base}/datasets/wellbeing-satisfaction" class="no-wrap">life satisfaction</a>,
			<a href="{base}/datasets/employment-rate">employment rate</a> and
			<a href="{base}/datasets/4g-coverage">4G coverage</a>.
		</p>
		<Button icon="arrow" iconPosition="after" href="{base}/datasets">Explore indicators</Button>
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

<Section title="Other sources of statistics">
	<p>Scotland and Northern Ireland have their own agencies who produce official statistics.</p>

	<List mode="dash">
		<li>
			<a href="https://statistics.gov.scot/home" target="_blank" rel="noreferrer">Scotland</a>
			<span class="inline-icon"><Icon type="launch" /></span>
		</li>
		<li>
			<a
				href="https://www.ninis2.nisra.gov.uk/public/AreaProfile.aspx?Menu=True"
				target="_blank"
				rel="noreferrer">Northern Ireland</a
			> <span class="inline-icon"><Icon type="launch" /></span>
		</li>
	</List>

	<p>
		Some data about Wales is also published on the <a
			href="https://statswales.gov.wales/Catalogue"
			target="_blank"
			rel="noreferrer">Stats Wales website</a
		> <span class="inline-icon"><Icon type="launch" /> </span>
	</p>
</Section>
<Section title="About these pages">
	<p>
		These pages are maintained by the Explore Subnational Statistics (ESS) service. The ESS service
		is part of the GSS subnational data strategy, which provides a framework to guide the UK
		Government Statistical Service (GSS) in producing and disseminating subnational statistics in a
		more timely, granular and harmonised way.
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
</style>
