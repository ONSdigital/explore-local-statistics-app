<script lang="ts">
	// @ts-nocheck
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { makeCanonicalSlug } from '$lib/util/areas/makeCanonicalSlug.js';
	import {
		Breadcrumb,
		Titleblock,
		Section,
		Divider,
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

	let postcode, searchValue;

	// Functions etc
	function navTo(e) {
		if (!e.detail) return;
		if (e.detail.type === 'postcode') {
			postcode = e.detail;
		} else {
			postcode = null;
			searchValue = null;
			goto(`${base}/areas/${makeCanonicalSlug(e.detail.areacd, e.detail.areanm)}`);
		}
	}
</script>

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
			/>
		{/if}
	</Card>
	<Card title="Local indicators">
		<p style:margin-bottom="28px">
			Explore {datasetsCount} indicators, including
			<a href="{base}/indicators/gross-disposable-household-income-per-head" class="no-wrap"
				>household income</a
			>,
			<a href="{base}/indicators/further-education-and-skills-participation"
				>participation in further education</a
			>
			and
			<a href="{base}/indicators/wellbeing-satisfaction">life satisfaction</a>.
		</p>
		<Button icon="arrow" iconPosition="after" href="{base}/indicators" small
			>Explore indicators</Button
		>
	</Card>
</Cards>

<Section>
	<p>
		You can also start your search from <a href="{base}/areas/E92000001-england">England</a>,
		<a href="{base}/areas/W92000004-wales">Wales</a>,
		<a href="{base}/areas/S92000003-scotland">Scotland</a>
		or <a href="{base}/areas/N92000002-northern-ireland">Northern Ireland</a>.
	</p>
</Section>

<Divider hr="full" />

<Section title="Other sources of local statistics">
	<p>
		Wales, Scotland and Northern Ireland also have their own producers of official statistics (links
		open in a new tab).
	</p>

	<List mode="dash">
		<li>
			<a href="https://statswales.gov.wales/Catalogue" target="_blank" rel="noreferrer"
				>StatsWales</a
			>
			<span class="inline-icon"><Icon type="launch" /></span>
			<span class="ons-external-link__new-window-description ons-u-vh">(opens in a new tab)</span>
		</li>
		<li>
			<a href="https://statistics.gov.scot/home" target="_blank" rel="noreferrer"
				>Statistics.gov.scot</a
			>
			<span class="inline-icon"><Icon type="launch" /></span>
			<span class="ons-external-link__new-window-description ons-u-vh">(opens in a new tab)</span>
		</li>
		<li>
			<a href="https://data.nisra.gov.uk/" target="_blank" rel="noreferrer"
				>Northern Ireland Statistics and Research Agency</a
			>
			<span class="inline-icon"><Icon type="launch" /></span>
			<span class="ons-external-link__new-window-description ons-u-vh">(opens in a new tab)</span>
		</li>
	</List>
</Section>
<Section title="About these pages">
	<p>These pages are part of the Explore Subnational Statistics (ESS) service.</p>

	<p>
		The vision for the ESS service was launched in the <a
			href="https://analysisfunction.civilservice.gov.uk/policy-store/gss-subnational-data-strategy/"
			>Government Statistical Service (GSS) subnational data strategy</a
		>, which provides a framework to guide the GSS in producing and disseminating subnational
		statistics in a more timely, granular and harmonised way.
	</p>
	<p>
		The ESS service aims to provide one place for users to find, visualise, compare and download
		subnational statistics by standardised geographies and customer-defined areas.
	</p>
	<p>
		Information on the strengths and limitations of the Explore Local Statistics (ELS) service and
		methods used is available in
		<a
			href="https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandwellbeing/methodologies/explorelocalstatisticsserviceqmi"
			>ELS quality and methodology information (QMI) report</a
		>.
	</p>
	<p>
		We value your feedback on these statistics. If you would like to get in touch, please email <a
			href="mailto:explore.local.statistics@ons.gov.uk">explore.local.statistics@ons.gov.uk</a
		>.
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
