<script lang="ts">
	// @ts-nocheck
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { makeCanonicalSlug } from '$lib/api/geo/helpers/areaSlugUtils';
	import {
		Breadcrumb,
		Hero,
		Section,
		Divider,
		List,
		Li,
		Grid,
		Card,
		Button,
		Header,
		PhaseBanner,
		Icon,
		Select,
		Footer
	} from '@onsvisual/svelte-components';
	import AreaSearch from '$lib/components/nav/AreaSearch.svelte';
	import UKMap from '$lib/components/visuals/UKMap.svelte';

	let { data } = $props();
</script>

<Hero title="Explore local statistics" background="#e9eff4" height={230}>
	<UKMap />
	<p class="ons-hero__text">
		Find, compare and visualise statistics about places in the United Kingdom.
	</p>
</Hero>

<Grid marginTop id="nav-cards" colWidth="wide">
	<Card title="Find an area" mode="featured">
		<label for="search" style:display="block" style:margin-bottom="28px"
			>Search for a postcode, local authority, region, parliamentary constituency or other named
			area.</label
		>
		<AreaSearch
			id="search"
			onSelect={(area) => {
				const url =
					area.type === 'postcode'
						? `/areas/search?q=${area.areacd}`
						: `/areas/${makeCanonicalSlug(area)}`;
				goto(resolve(url));
			}}
		/>
	</Card>

	<Card title="Local indicators" mode="featured">
		<p style:margin-bottom="28px">
			Explore {data.summaryStats.univariateCount} indicators, including
			<a href={resolve(`/indicators/gross-disposable-household-income-per-head`)} class="no-wrap"
				>household income</a
			>,
			<a href={resolve(`/indicators/further-education-and-skills-participation`)}
				>further education participation</a
			>
			and
			<a href={resolve(`/indicators/wellbeing-satisfaction`)}>life satisfaction</a>.
		</p>
		<Button icon="arrow" iconPosition="after" href={resolve(`/indicators`)} small
			>Explore indicators</Button
		>
	</Card>
</Grid>

<Section>
	<p>
		You can also start your search from
		<a href={resolve(`/areas/E92000001-england`)}>England</a>,
		<a href={resolve(`/areas/W92000004-wales`)}>Wales</a>,
		<a href={resolve(`/areas/S92000003-scotland`)}>Scotland</a>
		or
		<a href={resolve(`/areas/N92000002-northern-ireland`)}>Northern Ireland</a>.
	</p>
</Section>

<Divider hr="full" />

<Section title="Other sources of local statistics">
	<p>
		Wales, Scotland and Northern Ireland also have their own producers of official statistics (links
		open in a new tab).
	</p>

	<List mode="dash">
		<Li>
			<a href="https://statswales.gov.wales/Catalogue" target="_blank" rel="noreferrer"
				>StatsWales</a
			>
			<span class="inline-icon"><Icon type="launch" /></span>
			<span class="ons-external-link__new-window-description ons-u-vh">(opens in a new tab)</span>
		</Li>
		<Li>
			<a href="https://statistics.gov.scot/home" target="_blank" rel="noreferrer"
				>Statistics.gov.scot</a
			>
			<span class="inline-icon"><Icon type="launch" /></span>
			<span class="ons-external-link__new-window-description ons-u-vh">(opens in a new tab)</span>
		</Li>
		<Li>
			<a href="https://data.nisra.gov.uk/" target="_blank" rel="noreferrer"
				>Northern Ireland Statistics and Research Agency</a
			>
			<span class="inline-icon"><Icon type="launch" /></span>
			<span class="ons-external-link__new-window-description ons-u-vh">(opens in a new tab)</span>
		</Li>
	</List>
</Section>
<Section title="Get the data">
	<p>
		You can download all of the data available on the Explore Local Statistics service in an
		<a href={resolve('/api/v1/data.xlsx?time=all')} download="data.xlsx">XLSX</a>,
		<a href={resolve('/api/v1/data.csv?time=all')} download="data.csv">CSV</a>,
		<a href={resolve('/api/v1/data.csvw?time=all')} download="data.csvw.json">CSVW</a>
		or
		<a href={resolve('/api/v1/data.json?time=all')} download="data.json">JSON-Stat</a> format.
	</p>
	<p>
		Information on the strengths and limitations of the Explore Local Statistics service and methods
		used is available in the
		<a
			href="https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandwellbeing/methodologies/explorelocalstatisticsserviceqmi"
			>quality and methodology information (QMI) report</a
		>.
	</p>
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
