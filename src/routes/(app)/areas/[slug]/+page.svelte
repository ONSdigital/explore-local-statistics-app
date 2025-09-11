<script lang="ts">
	// @ts-nocheck
	import type { PageData } from './$types';
	import { base } from '$app/paths';
	import { goto, afterNavigate } from '$app/navigation';
	import { getName, capitalise } from '@onsvisual/robo-utils';
	import { essGeocodes, noIndex, geoCodesLookup } from '$lib/config/geoConfig';
	import { getParent, parseTemplate, filterLinks } from '$lib/util/links/linksHelpers';
	import { makeCanonicalSlug } from '$lib/util/areas/makeCanonicalSlug';
	import { filterChildren } from '$lib/util/geo/filterChildren';
	import {
		Titleblock,
		Section,
		Button,
		Grid,
		GridCell,
		Card,
		Accordion,
		AccordionItem,
		analyticsEvent
	} from '@onsvisual/svelte-components';
	import Tabs from '$lib/modified-library-components/Tabs.svelte';
	import Tab from '$lib/modified-library-components/Tab.svelte';
	import AreaSelect from '$lib/components/AreaSelect.svelte';
	import AreaList from '$lib/components/AreaList.svelte';
	import AreaNavMap from '$lib/components/AreaNavMap.svelte';
	import ESSMap from '$lib/components/ESSMap.svelte';

	export let data: PageData;

	// $: console.log(data.place);

	let childType = data?.childTypes?.[0];
	let postcode, searchValue;

	$: productLinks = data.place ? filterLinks(data.links, data.place) : [];

	function navTo(e, options = {}, type = 'search') {
		if (e.detail.type === 'postcode') {
			postcode = e.detail;
		} else {
			goto(`${base}/areas/${makeCanonicalSlug(e.detail.areacd, e.detail.areanm)}`, options);
		}
	}
	function mapSelect(e) {
		let code = e.detail.id;
		let place = e.detail.feature.properties;
		e.detail.areacd = code;
		e.detail.areanm = getName(place);
		analyticsEvent({
			event: 'mapSelect',
			areaCode: e.detail.areacd,
			areaName: e.detail.areanm,
			areaType: geoCodesLookup?.[e.detail.areacd.slice(0, 3)]?.label
		});
		navTo(e, { noScroll: true }, 'map');
	}

	afterNavigate(() => {
		childType = data?.childTypes?.[0];
		postcode = null;
		searchValue = null;
	});

	let tabsWidth;
</script>

<svelte:head>
	{#if noIndex.includes(data?.place?.typecd)}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<Titleblock
	title={getName(data.place)}
	titleBadge={{
		label: data.place.areacd,
		ariaLabel: `Area code: ${data.place.areacd}`,
		color: '#003c57'
	}}
	cls="titleblock-transparent"
>
	<p class="ons-hero__text">
		{#if data.place.areacd === 'K02000001'}
			Explore areas within the United Kingdom.
		{:else}
			{#if data.place.end}
				<span class="inactive-badge">Inactive</span> {data.place.typenm}
			{:else}
				{capitalise(data.place.typenm)}
			{/if}
			{getName(data.place.parents[0], 'in', 'prefix')}
			<a
				href="{base}/areas/{makeCanonicalSlug(
					data.place.parents[0].areacd,
					data.place.parents[0].areanm
				)}"
				data-sveltekit-noscroll>{getName(data.place.parents[0])}</a
			>
			{#if ['E02', 'W02'].includes(data.place.typecd)}
				<p class="ons-u-fs-s additional-area-info">
					Also known as {data.place.areanm}
				</p>
			{/if}
			{#if data.place.start && data.place.replaces?.[0]?.areacd}
				<p class="ons-u-fs-s additional-area-info">
					In {data.place.start}, it replaced
					{#each data.place.replaces as rep, i}
						{data.place.areanm === rep.areanm ? 'the previous' : getName(rep, 'the', 'prefix')}
						<a
							href="{base}/areas/{makeCanonicalSlug(rep.areacd, rep.areanm)}"
							data-sveltekit-noscroll>{getName(rep)}</a
						>
						({rep.areacd})
						{i === data.place.replaces.length - 1
							? ''
							: i === data.place.replaces.length - 2
								? ' and '
								: ', '}
						{data.place.areanm === rep.areanm ? 'due to a boundary change' : ''}
					{/each}
				</p>
			{/if}
			{#if data.place.end && data.place.successor?.areacd}
				<p class="ons-u-fs-s additional-area-info">
					In {data.place.end + 1}, it was replaced by
					{data.place.areanm === data.place.successor.areanm
						? 'the new'
						: getName(data.place.successor, 'the', 'prefix')}
					<a
						href="{base}/areas/{makeCanonicalSlug(
							data.place.successor.areacd,
							data.place.successor.areanm
						)}"
						data-sveltekit-noscroll>{getName(data.place.successor)}</a
					>
					({data.place.successor.areacd})
				</p>
			{:else if data.place.end}
				<p class="ons-u-fs-s additional-area-info">
					It ceased to be an official geography in {data.place.end + 1}.
				</p>
			{/if}
		{/if}
	</p>
</Titleblock>

<Grid id="related-areas">
	<GridCell colspan={2}>
		<AreaNavMap
			{data}
			{childType}
			on:select={mapSelect}
			mapDescription={'Map of ' + getName(data.place, 'the')}
		/>
	</GridCell>
	<div class="ons-grid__col ons-col-4@l grid-cell-flex">
		{#if data.place.areacd !== 'K02000001'}
			<div class="local-indicators-card">
				{#each [essGeocodes.includes(data.place.typecd) ? data.place : getParent(data.place, essGeocodes)] as place}
					<h3 style:margin-bottom="12px">Local indicators for {getName(place, 'the')}</h3>
					<p style:margin-bottom="20px">Health, education, economy, life satisfaction and more.</p>
					<Button
						icon="arrow"
						iconPosition="after"
						variant="ghost"
						href="{base}/areas/{makeCanonicalSlug(place.areacd, place.areanm)}/indicators"
						small>Explore local indicators</Button
					>
				{/each}
			</div>
		{/if}
		<div class="area-search-card">
			<label for="search" style:display="block" style:margin-bottom="8px"
				>Search for a place name or postcode</label
			>
			<AreaSelect
				id="search"
				mode="search"
				idKey="areacd"
				labelKey="areanm"
				groupKey="group"
				placeholder="Eg. Fareham or PO15 5RR"
				hideIcon
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
		</div>
	</div>
	<GridCell colspan={3}>
		<!-- Removed the "ons-u-d-no" class that was hiding the tab panel at 400% zoom -->
		<div style:margin-top="10px" class="ons-u-d-b@s" bind:clientWidth={tabsWidth}>
			{#key childType}
				{#if childType}
					{#if tabsWidth > 510 || data.childTypes.length === 1}
						<Tabs
							selected={childType.key}
							compact
							on:change={(e) => (childType = data.childTypes.find((c) => c.key === e.detail.id))}
						>
							{#each data.childTypes as type, i}
								<Tab title={capitalise(type.plural)} id={type.key} hideTitle>
									<ul class="list-columns">
										{#each filterChildren(data.place, type) as child, i}
											<li>
												<a
													href="{base}/areas/{makeCanonicalSlug(child.areacd, child?.areanm)}"
													data-sveltekit-noscroll
													rel={noIndex.includes(child.areacd.slice(0, 3)) ? 'nofollow' : null}
													>{getName(child)}</a
												>
											</li>
										{/each}
									</ul>
								</Tab>
							{/each}
						</Tabs>
					{:else}
						<!-- Use accordion when screen sizes are very small and there is more that one tab -->
						<Accordion width="full">
							{#each data.childTypes as type, i}
								<!-- {capitalise(type.plural)} -->
								<AccordionItem title={capitalise(type.plural)}>
									<ul class="list-columns">
										{#each filterChildren(data.place, type) as child, i}
											<li>
												<a
													href="{base}/areas/{makeCanonicalSlug(child.areacd, child?.areanm)}"
													data-sveltekit-noscroll
													rel={noIndex.includes(child.areacd.slice(0, 3)) ? 'nofollow' : null}
													>{getName(child)}</a
												>
											</li>
										{/each}
									</ul></AccordionItem
								>
							{/each}
						</Accordion>
					{/if}
				{:else}
					<p>No smaller areas available within {getName(data.place, 'the')}.</p>
				{/if}
			{/key}
		</div>
	</GridCell>
</Grid>

{#if productLinks[0]}
	<Grid title="Explore statistics about {getName(data.place, 'the')}" id="interactive">
		{#each productLinks as link}
			{#if link.title === 'Local indicators'}
				<Card title={link.title} href={parseTemplate(link.url, link.place)} mode="featured">
					<div slot="image" style:display="contents"><ESSMap geometry={data.geometry} /></div>
					{@html parseTemplate(link.description, link.place)}
				</Card>
			{:else}
				<Card
					title={link.title}
					href={parseTemplate(link.url, link.place)}
					image={link.image}
					mode="featured"
					imageAlt=""
				>
					{@html parseTemplate(link.description, link.place)}
				</Card>
			{/if}
		{/each}
	</Grid>
{/if}

<style>
	.link-parent {
		display: block;
	}
	ul.list-columns {
		list-style: none;
		margin: 4px 0 8px;
		padding: 0;
		column-width: 220px;
		overflow-x: none;
		position: relative;
	}
	ul.list-columns > li {
		font-size: 16px !important;
		margin: 0;
		padding: 0;
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
	.local-indicators-card {
		flex-basis: 0;
		flex-grow: 1;
		padding: 1rem;
		color: var(--ons-color-page-light);
		background-color: var(--ons-color-branded-secondary);
	}
	.area-search-card {
		flex-basis: 0;
		flex-grow: 1;
		padding: 1rem;
		background: var(--ons-color-banner-bg);
	}
	.additional-area-info {
		margin-top: 12px;
		margin-bottom: 0;
	}
	.active-badge {
		font-weight: bold;
		color: white;
		padding: 0 8px 2px 8px;
		border-radius: 4px;
		background-color: #003c57;
		margin-right: 2px;
	}
	.inactive-badge {
		font-weight: bold;
		color: white;
		padding: 0 8px 2px 8px;
		border-radius: 4px;
		background-color: #fa6401;
		margin-right: 2px;
	}
</style>
