<script lang="ts">
	// @ts-nocheck
	import { resolve } from '$app/paths';
	import { goto, afterNavigate } from '$app/navigation';
	import { getName, capitalise } from '@onsvisual/robo-utils';
	import { makeCanonicalSlug } from '$lib/api/geo/helpers/areaSlugUtils';
	import { getNearestRelatedParent } from '$lib/util/linkHelpers';
	import {
		analyticsEvent,
		Hero,
		Grid,
		GridCell,
		Button,
		Select,
		Card,
		PhaseBanner,
		Header,
		Breadcrumb,
		Tabs,
		Tab
	} from '@onsvisual/svelte-components';
	import AreaLede from './AreaLede.svelte';
	import AreaNavMap from './AreaNavMap.svelte';
	import ChildAreas from './ChildAreas.svelte';
	import AreaSearch from '$lib/components/nav/AreaSearch.svelte';
	import ESSMap from '$lib/components/visuals/ESSMap.svelte';

	let { data } = $props();
	let areaProps = $derived(data.area.properties);

	let clientWidth = $state();
	let selectedChildGroupKey = $derived(areaProps.children[0]?.key || null);
	let selectedChildGroup = $derived(
		areaProps.children.find((c) => c.key === selectedChildGroupKey)
	);
	let indicatorsArea = $derived(getNearestRelatedParent(areaProps));

	function handleSelect(area) {
		const isPostcode = area.type === 'postcode';
		const url = isPostcode ? `/areas/search?q=${area.areacd}` : `/areas/${makeCanonicalSlug(area)}`;
		goto(resolve(url), { noScroll: !isPostcode });
	}
</script>

<Hero
	title={getName(areaProps)}
	titleBadge={{
		label: areaProps.areacd,
		ariaLabel: `Area code: ${areaProps.areacd}`,
		color: '#003c57'
	}}
	width="medium"
	cls="titleblock-transparent"
>
	<AreaLede {areaProps} />
</Hero>

<Grid marginTop>
	<GridCell colspan={2}>
		<AreaNavMap
			area={data.area}
			children={selectedChildGroup}
			onSelect={handleSelect}
			mapDescription={'Map of ' + getName(areaProps, 'the')}
		/>
	</GridCell>
	<div class="ons-grid__col ons-col-4@l grid-cell-flex">
		{#if areaProps.areacd !== 'K02000001'}
			<div class="local-indicators-card">
				<h2 class="ons-card__title ons-u-fs-m" style:margin-bottom="12px">
					Local indicators for {getName(indicatorsArea, 'the')}
				</h2>
				<p style:margin-bottom="20px">Health, education, economy, life satisfaction and more.</p>
				<Button
					icon="arrow"
					iconPosition="after"
					variant="ghost"
					href={resolve(`/areas/${makeCanonicalSlug(indicatorsArea)}/indicators`)}
					small>Explore local indicators</Button
				>
			</div>
		{/if}
		<div class="area-search-card">
			<h2 class="ons-card__title ons-u-fs-m">Find another area</h2>
			<label for="search" style:display="block" style:margin-bottom="8px"
				>Search for a place name or postcode</label
			>
			<AreaSearch id="search" onSelect={handleSelect} />
		</div>
	</div>
	<GridCell colspan={3}>
		<ChildAreas {areaProps} bind:selected={selectedChildGroupKey} />
	</GridCell>
</Grid>

{#if data.productLinks.length > 0}
	<Grid title="Explore statistics about {getName(areaProps, 'the')}">
		{#each data.productLinks as link}
			{#if link.title === 'Local indicators'}
				<Card title={link.title} mode="featured" href={link.href} headingTag="h3">
					<div slot="image" style:display="contents">
						<ESSMap geometry={data.area.geometry} />
					</div>
					{@html link.description}
				</Card>
			{:else}
				<Card
					title={link.title}
					mode="featured"
					image={link.image.startsWith('/') ? resolve(link.image) : link.image}
					href={link.image.startsWith('/') ? resolve(link.href) : link.href}
					headingTag="h3"
				>
					{@html link.description}
				</Card>
			{/if}
		{/each}
	</Grid>
{/if}

<style>
	.link-parent {
		display: block;
	}
	/* :global(#related-areas .ons-tab[aria-selected='true']:not(:focus)) {
		background: #f3f3f3 !important;
	}
	:global(#related-areas .ons-tab[aria-selected='true']:focus) {
		box-shadow:
			inset 0 0 0 4px #f3f3f3,
			inset 12px 0 0 0 #f3f3f3,
			inset -12px 0 0 0 #f3f3f3,
			inset 0 -8px 0 0 #222 !important;
	} */
	:global(.select-wrapper label.ons-label) {
		font-weight: normal;
	}
	:global(h1 > span.title-subscript) {
		display: inline-block;
		font-size: 22px;
		font-weight: normal;
		margin: 0 -2px 0 -5px;
		transform: translateY(-3px);
	}
	:global(a.ons-card__link) {
		width: 100%;
		display: flex;
		flex-direction: column;
	}
	:global(a.ons-card__link > h3) {
		padding-top: 0 !important;
	}
	.grid-cell-flex {
		display: inline-flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.grid-cell-flex > div {
		flex-basis: 0;
		flex-grow: 1;
		min-width: 300px;
		padding: 1rem;
	}
	.local-indicators-card {
		color: var(--ons-color-page-light);
		background-color: var(--ons-color-branded-secondary);
	}
	.area-search-card {
		background: var(--ons-color-banner-bg);
	}
</style>
