<script lang="ts">
	// @ts-nocheck
	import type { PageData } from './$types';
	import { base } from '$app/paths';
	import { goto, afterNavigate } from '$app/navigation';
	import { getName, capitalise } from '@onsvisual/robo-utils';
	import { essGeocodes, noIndex } from '$lib/config/geoConfig';
	import { getParent, parseTemplate, filterLinks } from '$lib/util/links/linksHelpers';
	import { makeCanonicalSlug } from '$lib/util/areas/makeCanonicalSlug';
	import { filterChildren } from '$lib/util/geo/filterChildren';
	import {
		Breadcrumb,
		Titleblock,
		Section,
		Button,
		Cards,
		Card,
		Tabs,
		Tab
	} from '@onsvisual/svelte-components';
	import AreaSelect from '$lib/components/AreaSelect.svelte';
	import AreaList from '$lib/components/AreaList.svelte';
	import AreaNavMap from '$lib/components/AreaNavMap.svelte';
	import Lede from '$lib/components/Lede.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import ESSIcon from '$lib/components/ESSIcon.svelte';
	import ESSMap from '$lib/components/ESSMap.svelte';

	export let data: PageData;

	let childrenHeight = {};
	let childrenExpanded = true;
	let childType = data?.childTypes?.[0];
	let postcode;

	$: productLinks = data.place ? filterLinks(data.links, data.place) : [];

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
			goto(`${base}/areas/${makeCanonicalSlug(e.detail.areacd, e.detail.areanm)}`, options);
		}
	}
	function mapSelect(e) {
		let code = e.detail.id;
		let place = e.detail.feature.properties;
		e.detail.areacd = code;
		e.detail.areanm = getName(place);
		navTo(e, { noScroll: true }, 'map');
	}

	afterNavigate(() => {
		childType = data?.childTypes?.[0];
		postcode = null;
	});
</script>

<Breadcrumb
	links={[
		{ label: 'Home', href: '/', refresh: true },
		{ label: 'Explore local statistics', href: `${base}/` },
		...[...data.place.parents]
			.reverse()
			.map((p) => ({ label: getName(p), href: `${base}/areas/${p.areacd}` })),
		{ label: getName(data.place) }
	]}
/>
<Titleblock
	title={getName(data.place)}
	titleBadge={data.place.end ? `${data.place.areacd} - inactive` : data.place.areacd}
	titleBadgeAriaLabel={data.place.end ? null : `Area code: ${data.place.areacd}`}
	titleBadgeColor={data.place.end ? '#ff7b24' : '#003C57'}
>
	<Lede>
		{#if data.place.areacd === 'K02000001'}
			Explore areas within the United Kingdom.
		{:else}
			{capitalise(data.place.typenm)}
			{getName(data.place.parents[0], 'in', 'prefix')}
			<a
				href="{base}/areas/{makeCanonicalSlug(
					data.place.parents[0].areacd,
					data.place.parents[0].areanm
				)}"
				data-sveltekit-noscroll>{getName(data.place.parents[0])}</a
			>.
			{#if ['E02', 'W02'].includes(data.place.typecd)}
				Also known as {data.place.areanm}.
			{/if}
			{#if data.place.start && data.place.replaces?.[0]?.areacd}
				In {data.place.start}, it replaced
				{#each data.place.replaces as rep, i}
					{getName(rep, 'the', 'prefix')}
					<a href="{base}/areas/{makeCanonicalSlug(rep.areacd, rep.areanm)}" data-sveltekit-noscroll
						>{getName(rep)}</a
					>{i === data.place.replaces.length - 1
						? '.'
						: i === data.place.replaces.length - 2
							? ' and '
							: ', '}
				{/each}
			{/if}
			{#if data.place.end && data.place.successor?.areacd}
				In {data.place.end + 1}, it was replaced by {getName(data.place.successor, 'the', 'prefix')}
				<a
					href="{base}/areas/{makeCanonicalSlug(
						data.place.successor.areacd,
						data.place.successor.areanm
					)}"
					data-sveltekit-noscroll>{getName(data.place.successor)}</a
				>
				({data.place.successor.areacd}).
			{:else if data.place.end}
				It ceased to be an official geography in {data.place.end + 1}.
			{/if}
		{/if}
	</Lede>
</Titleblock>

<Cards id="related-areas" height="auto">
	<Card colspan={2} rowspan={2} noBackground>
		<AreaNavMap {data} {childType} on:select={mapSelect} />
	</Card>

	{#if data.place.areacd !== 'K02000001'}
		<div class="local-indicators-card">
			{#each [essGeocodes.includes(data.place.typecd) ? data.place : getParent(data.place, essGeocodes)] as place}
				<Section theme="dark" background="#003c57" marginBottom={false}>
					<div style:margin="24px 0">
						<h3 style:margin-bottom="12px">Local indicators for {getName(place, 'the')}</h3>
						<p style:margin-bottom="20px">
							Health, education, economy, life satisfaction and more.
						</p>
						<Button
							icon="arrow"
							variant="ghost"
							href="{base}/areas/{makeCanonicalSlug(place.areacd, place.areanm)}/indicators"
							small>Explore local indicators</Button
						>
					</div>
				</Section>
			{/each}
		</div>
	{/if}
	<Card title="Find another area">
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
			hideIcon
			on:submit={navTo}
		/>
		{#if postcode}
			<AreaList {postcode} on:clear={() => (postcode = null)} />
		{/if}
	</Card>
	<Card colspan={3} noBackground>
		<div style:margin-top="10px" class="ons-u-d-no ons-u-d-b@s">
			{#key childType}
				{#if childType}
					<Tabs
						selected={childType.key}
						compact
						on:change={(e) => (childType = data.childTypes.find((c) => c.key === e.detail.id))}
					>
						{#each data.childTypes as type, i}
							<Tab title={capitalise(type.plural)} id={type.key} hideTitle>
								<ul
									bind:clientHeight={childrenHeight[type.key]}
									style:max-height={childrenExpanded ? 'none' : '144px'}
									class="list-columns"
								>
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
						<!-- {#if childrenHeight[childType.key] >= 144}
						<button class="btn-link" on:click={() => (childrenExpanded = !childrenExpanded)}
							><Icon type="chevron" rotation={childrenExpanded ? 90 : -90} />
							{childrenExpanded ? 'Show fewer' : 'Show more'}</button
						>
					{/if} -->
					</Tabs>
				{:else}
					<span class="muted">No areas available within {getName(data.place, 'the')}</span>
				{/if}
			{/key}
		</div>
	</Card>
</Cards>

{#if productLinks[0]}
	<Cards title="Explore statistics about {getName(data.place, 'the')}" id="interactive">
		{#each productLinks as link}
			<Card
				title={link.title}
				href={parseTemplate(link.url, link.place)}
				image={link.image}
				bgcolor={link.bgcolor}
			>
				{@html parseTemplate(link.description, link.place)}
			</Card>
		{/each}
	</Cards>
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

	.local-indicators-card {
		background-color: #003c57;
	}
</style>
