<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		Hero,
		Section,
		DocumentList,
		Document,
		Input,
		Button,
		Divider
	} from '@onsvisual/svelte-components';
	import Paginator from '$lib/components/nav/Paginator.svelte';

	let { data } = $props();

	// Results per page
	const limit = 10;
</script>

<Hero title={`Search results for "${data.meta.query || ''}"`} cls="search-hero">
	<form class="search-form" action={resolve('/areas/search')}>
		<Input id="search" name="q" label="Search by place name or postcode" value={data.meta.query} />
		<Button type="sumbit" small>Search</Button>
	</form>
	<p style:margin="1.5rem 0 0">
		{#if data.meta.count}
			<strong>{data.meta.total ?? data.meta.count}</strong> search results
			{#if (data.meta.total || 0) > data.meta.count}
				(page {data.meta.offset / limit + 1} of {Math.ceil(data.meta.total / limit)})
			{/if}
		{:else}
			No results available
		{/if}
	</p>
</Hero>

<Section cls="search-results">
	{#if data.data.length > 0}
		<DocumentList>
			{#each data.data as area}
				<Document
					href={resolve(`/areas/${area?.areacd}`)}
					title={area?.areanm || area.areacd}
					meta="GSS code: {area.areacd}"
					description="{area?.type}{area.parent ? ` in ${area.parent}` : ''}"
				/>
			{/each}
		</DocumentList>
	{/if}
	{#if data.meta.total && data.meta.total > data.meta.count}
		<Paginator
			total={data.meta.total ?? 0}
			offset={data.meta.offset ?? 0}
			urlTemplate={`?q=${data.meta.query}&page={i}`}
		/>
	{/if}
</Section>

<style>
	.search-form {
		display: flex;
		flex-direction: row;
		align-items: end;
		gap: 0.5rem;
	}
	.search-form :global(.ons-input) {
		margin-bottom: -3px;
	}
	:global(.search-hero .ons-hero__details) {
		padding-bottom: 2rem;
	}
	:global(.search-results .ons-document-list) {
		border-top: 1px solid var(--ons-color-borders);
		padding-top: 1rem;
	}
	:global(.search-results .ons-document-list__item) {
		margin-bottom: 1rem;
		padding-bottom: 1rem;
	}
</style>
