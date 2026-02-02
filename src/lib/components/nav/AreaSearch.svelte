<script lang="ts">
	import { resolve } from '$app/paths';
	import throttle from 'throttleit';
	import { Select, Button } from '@onsvisual/svelte-components';

	let {
		id = 'search',
		name = 'q',
		placeholder = `Eg. "Fareham" or "PO15 5RR"`,
		action = '/areas/search',
		allAreas = true,
		onSelect
	} = $props();

	let selected = $state(null);

	function handleSubmit(e) {
		e?.preventDefault();
		if (selected) onSelect(selected);
	}

	async function loadOptionsFunction(query, populateResults) {
		try {
			const url = resolve(
				allAreas
					? `/api/v1/geo/search/${query.toLowerCase()}?searchPostcodes=true`
					: `/api/v1/geo/search/${query.toLowerCase()}?geoLevel=ctry,rgn,cauth,utla,ltla`
			);
			const results = await (await fetch(url)).json();
			console.log(results);
			populateResults(
				results.data.map((d) => {
					if (!d.areanm) d.areanm = d.areacd;
					d.description = `${d.type || ''}${d.parent ? ` in ${d.parent}` : ''}`;
					return d;
				})
			);
		} catch {
			return populateResults([]);
		}
	}
	const loadOptions = throttle(loadOptionsFunction, 500);
</script>

<form class="search-form" action={resolve(action)} onsubmit={handleSubmit}>
	<div class="search-input">
		<Select
			{id}
			{name}
			{loadOptions}
			{placeholder}
			label={null}
			on:change={(e) => {
				selected = e.detail;
				onSelect(selected);
			}}
			labelKey="areanm"
			groupKey="description"
			mode="search"
			autoClear={false}
			renderFallback
			clearable
		/>
	</div>
	<Button type="submit" text="Search" icon="search" small hideLabel>Search</Button>
</form>

<style>
	.search-form {
		display: flex;
		flex-direction: row;
		align-items: end;
		width: 100%;
		gap: 0.5rem;
	}
	.search-input {
		flex-grow: 1;
	}
	.search-form :global(.ons-btn__inner) {
		height: 40px;
	}
	.search-form :global(.ons-btn) {
		margin: 0;
	}
</style>
