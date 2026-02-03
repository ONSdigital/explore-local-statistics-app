<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto, afterNavigate } from '$app/navigation';
	import {
		Hero,
		Grid,
		NavSections,
		NavSection,
		Dropdown,
		Details
	} from '@onsvisual/svelte-components';
	import { getName } from '@onsvisual/robo-utils';
	import { makeCanonicalSlug } from '$lib/api/geo/helpers/areaSlugUtils';
	import AreaLocMap from './AreaLocMap.svelte';
	import AreaSearch from '$lib/components/nav/AreaSearch.svelte';
	import AreasModal from '$lib/components/modals/AreasModal.svelte';
	import OptionsModal from '$lib/components/modals/OptionsModal.svelte';
	import AreasLegend from '$lib/components/modals/AreasLegend.svelte';
	import BigNumber from './BigNumber.svelte';
	import IndicatorRow from './IndicatorRow.svelte';
	import MoreIndicators from './MoreIndicators.svelte';
	import SimilarAreas from './SimilarAreas.svelte';

	const maxIndicators = 3;

	let { data } = $props();

	let areaProps = $derived(data.area.properties);
	let pageState = $state(makeInitialPageState(data));

	let areaSearchOpen = $state(false);
	let hiddenTopics = $state(Object.fromEntries(data.taxonomy.map((t) => [t?.slug, true])));
	let hovered = $state();

	function makeInitialPageState(data) {
		const defaultComparisonArea = data.areas.find((a) => a.areacd === data.parent.areacd);
		return {
			selectedAreas: [defaultComparisonArea],
			selectedGeoGroup: data.geoGroups[0],
			selectedPeriodRange: [data.periods[0], data.periods[data.periods.length - 1]],
			selectedCluster: data?.related?.similar?.[0],
			showConfidenceIntervals: false
		};
	}

	afterNavigate(() => {
		console.log('related', data.related);
		pageState = makeInitialPageState(data);
		areaSearchOpen = false;
	});

	function handleSelect(area) {
		const url = `/areas/${makeCanonicalSlug(area)}/indicators`;
		goto(resolve(url));
	}

	function flattenTopic(topic) {
		const flat = { label: topic.label, slug: topic.slug, count: topic.count, items: [] };
		for (const child of topic.children) {
			if (child.children) {
				flat.items.push({ heading: child.label, headingSlug: child.slug, ...child.children[0] });
				for (const grandchild of child.children.slice(1)) flat.items.push(grandchild);
			} else flat.items.push(child);
		}
		return flat;
	}
</script>

<div class="titleblock-container">
	<Hero
		width="medium"
		title="Local indicators for {getName(areaProps, 'the')}"
		background="var(--ons-color-banner-bg)"
	>
		<p class="ons-hero__text">
			Local indicators, trends and data for {getName(areaProps, 'the', 'prefix')}
			<a href={resolve(`/areas/${makeCanonicalSlug(areaProps)}`)}>{getName(areaProps)}</a>
			({areaProps.areacd})
			{#if areaProps.end}
				<span class="inactive-badge">Inactive</span>
			{/if}
		</p>
		<div style:margin="20px 0 -36px" style:max-width="450px" style:z-index={1}>
			<Details title="Find another area" bind:open={areaSearchOpen}>
				<label for="search" style:display="block" style:margin-bottom="8px"
					>Search for a place name</label
				>
				<AreaSearch
					id="search"
					placeholder={`Eg. "Newport" or "Fareham"`}
					allAreas={false}
					onSelect={handleSelect}
					autoClear={true}
				/>
			</Details>
		</div>
	</Hero>
	<AreaLocMap
		geometry={data.area.geometry}
		bounds={areaProps.bounds}
		mapDescription={'Map of ' + getName(areaProps, 'the')}
	/>
</div>

<Grid marginTop>
	{#each ['population-count', 'five-year-population-change', 'median-age'].filter((slug) => slug in data.metadata) as slug}
		<BigNumber
			indicator={slug}
			metadata={data.metadata[slug]}
			geography={areaProps.areacd}
			period={pageState.selectedPeriodRange[1]}
		/>
	{/each}
</Grid>

{#snippet indicator(item, topic)}
	{@const hidden = hiddenTopics[topic.slug] && item.index >= maxIndicators}
	{#if item.heading}<h4 id={item.headingSlug}>{item.heading}</h4>{/if}
	<IndicatorRow
		indicator={item.slug}
		metadata={data.metadata[item.slug]}
		timeRange={pageState.selectedPeriodRange}
		selected={[areaProps.areacd, ...pageState.selectedAreas.map((a) => a.areacd)]}
		geoGroup={pageState.selectedGeoGroup}
		{hidden}
		bind:hovered
	/>
{/snippet}

<NavSections cls="wider-nav-sections">
	<div class="indicators-nav-sections">
		<div class="legend-sticky">
			<AreasLegend
				selectedAreas={[areaProps, ...pageState.selectedAreas]}
				selectedGeoGroup={pageState.selectedGeoGroup}
			/>
			<div class="legend-modals">
				<AreasModal mode="area" {data} bind:pageState />
				<OptionsModal {data} bind:pageState />
			</div>
		</div>
		<NavSection title="Topics" />
		{#each data.taxonomy.map((t) => flattenTopic(t)) as topic}
			<NavSection title={topic.label} id={topic.id} subsection>
				{#each topic.items.slice(0, maxIndicators) as item}
					{@render indicator(item, topic)}
				{/each}
				{#if topic.count > maxIndicators}
					<MoreIndicators
						id="{topic.id}-more"
						bind:hidden={hiddenTopics[topic.slug]}
						buttonText="Show {hiddenTopics[topic.slug]
							? `${topic.count - maxIndicators} more`
							: 'fewer'} {topic?.label.toLowerCase()} indicators"
					>
						{#each topic.items.slice(maxIndicators) as item}
							{@render indicator(item, topic)}
						{/each}
					</MoreIndicators>
				{/if}
			</NavSection>
			<div style:margin-bottom="2rem"></div>
		{/each}
	</div>
	<NavSection title="Select an indicator">
		<div
			style="display: block; height: 400px; background: var(--ons-color-banner-bg);"
			class="ons-u-mb-l ons-u-p-m"
		>
			Indicator section to be added.
		</div>
	</NavSection>
	{#if data.related.similar[0]}
		<NavSection title="Similar areas">
			<p>
				See which areas are statistically similar to {getName(areaProps, 'the')}
				based on specific groups of indicators. These clusters of areas are based on
				<a
					href="https://www.ons.gov.uk/peoplepopulationandcommunity/wellbeing/methodologies/clusteringsimilarlocalauthoritiesandstatisticalnearestneighboursintheukmethodology"
					target="_blank">an analysis carried out by the ONS</a
				>.
			</p>
			<Dropdown
				label="Select a group of indicators"
				options={data.related.similar}
				bind:value={pageState.selectedCluster}
			/>
			<SimilarAreas {areaProps} selectedCluster={pageState.selectedCluster} />
		</NavSection>
	{/if}
	<NavSection title="Get the data">
		<p>
			Download all datasets that include {getName(areaProps, 'the')} in an
			<a
				href={resolve(`/api/v1/data.xlsx?hasGeo=${areaProps.areacd}&time=all`)}
				download="data.xlsx">XLSX</a
			>,
			<a href={resolve(`/api/v1/data.csv?hasGeo=${areaProps.areacd}&time=all`)} download="data.csv"
				>CSV</a
			>,
			<a
				href={resolve(`/api/v1/data.csv?hasGeo=${areaProps.areacd}&time=all`)}
				download="data.csv-metadata.json">CSVW</a
			>, or
			<a
				href={resolve(`/api/v1/data.json?hasGeo=${areaProps.areacd}&time=all`)}
				download="data.json">JSON-Stat</a
			> format.
		</p>
		<p>
			Information on the strengths and limitations of the Explore Local Statistics service and
			methods used is available in the
			<a
				href="https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandwellbeing/methodologies/explorelocalstatisticsserviceqmi"
				>quality and methodology information (QMI) report</a
			>.
		</p>
		<p>
			We value your feedback on these statistics. If you would like to get in touch, please email <a
				href="mailto:explore.local.statistics@ons.gov.uk">explore.local.statistics@ons.gov.uk</a
			>.
		</p>
	</NavSection>
</NavSections>

<style>
	.indicators-nav-sections > :global(section) {
		scroll-margin-top: 116px;
	}
	.titleblock-container {
		position: relative;
	}
	.hidden {
		display: none;
	}
</style>
