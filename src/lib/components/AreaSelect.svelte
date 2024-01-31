<script lang="ts">
	// @ts-nocheck
	import { onMount, createEventDispatcher } from 'svelte';
	import { base } from '$app/paths';
	import { geoTypes, geoCodesLookup, geoNames, regionReverseLookup } from '$lib/config/geoConfig';
	import { getData } from '$lib/api/getData';
	import { capitalise } from '@onsvisual/robo-utils';
	import { Select } from '@onsvisual/svelte-components';

	const dispatch = createEventDispatcher();

	export let id = '';
	export let mode = 'search';
	export let placeholder = 'Type a place name or postcode';
	export let filterText = '';
	export let label = null;
	export let hideLabel = false;
	export let value = null;
	export let clearable = true;
	export let autoClear = false;
	export let idKey = 'value';
	export let labelKey = 'label';
	export let groupKey = 'group';
	export let multiple = false;
	export let maxSelected = 4;

	const startsWithFilter = (str, filter) => str.toLowerCase().startsWith(filter.toLowerCase());
	const filterSort = (a, b) =>
		startsWithFilter(a.areanm, filterText) && startsWithFilter(b.areanm, filterText)
			? 0
			: !startsWithFilter(a.areanm, filterText) && startsWithFilter(b.areanm, filterText)
				? 1
				: startsWithFilter(a.areanm, filterText) && !startsWithFilter(b.areanm, filterText)
					? -1
					: 0;

	export async function loadOptions(filterText) {
		if (filterText.length > 2 && /\d/.test(filterText)) {
			let res = await fetch(`https://api.postcodes.io/postcodes/${filterText}/autocomplete`);
			let json = await res.json();
			return json.result.map((d) => ({ areacd: d, areanm: d, group: '', postcode: true }));
		} else if (filterText.length > 2) {
			return items
				.filter((p) => p.areanm.match(new RegExp(`\\b${filterText}`, 'i')))
				.sort(filterSort);
		}
		return [];
	}
	async function doSelect(e) {
		if (e.detail.postcode) {
			let res = await fetch(`https://api.postcodes.io/postcodes/${e.detail.areacd}`);
			let json = await res.json();
			if (json.result) {
				let places = [];
				geoTypes
					.filter((g) => g.pcio)
					.forEach((g) => {
						let name = json.result[g.pcio];
						if (name && !name.includes('unparished')) {
							let code = json.result.codes[g.pcio]
								? json.result.codes[g.pcio]
								: regionReverseLookup[name];
							places.push({ areacd: code, areanm: name, typenm: g.label.replace('/unitary', '') });
						}
					});
				if (places[0]) {
					placeholder = 'Type a place name or postcode';
					dispatch('select', {
						type: 'postcode',
						areacd: null,
						postcd: json.result.postcode,
						places
					});
				} else {
					placeholder = 'Must be a valid postcode';
				}
			}
		} else {
			let areacd = e.detail[idKey];
			let areanm = e.detail[labelKey];
			dispatch('select', { type: 'place', areacd, areanm });
			placeholder = 'Type a place name or postcode';
		}
	}

	$: itemFilter =
		(Array.isArray(value) && value.length >= maxSelected) ||
		(mode == 'search' && filterText.length < 3)
			? (label, filterText, option) => false
			: (label, filterText, option) => true;

	let el;
	let items;

	const getTypeLabel = (type) =>
		geoNames[type] ? geoNames[type].label : geoCodesLookup[type].label;

	async function getPlaces() {
		let places = await getData(`${base}/data/places.csv`);
		places.sort((a, b) => a.areanm.localeCompare(b.areanm));
		let lookup = {};
		places.forEach((d) => (lookup[d.areacd] = d));
		places.forEach((d) => {
			let type = d.areacd.slice(0, 3);
			d.group =
				type === 'K02'
					? ''
					: d.parentcd
						? `${capitalise(getTypeLabel(type))} in ${lookup[d.parentcd].areanm}`
						: capitalise(getTypeLabel(type));
		});
		return places;
	}

	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	async function handleSelect(e) {
		doSelect(e);
	}

	onMount(async () => (items = await getPlaces()));
</script>

{#if items}
	<div class="select-wrapper">
		<Select
			{id}
			{mode}
			options={items}
			bind:value
			bind:filterText
			{idKey}
			{labelKey}
			{groupKey}
			{placeholder}
			{label}
			{hideLabel}
			{multiple}
			{autoClear}
			{loadOptions}
			{itemFilter}
			on:change={handleSelect}
			on:input
			on:focus
			on:blur
			on:clear
			clearable={!clearable ? false : !multiple}
		/>
	</div>
{/if}

<style>
	.select-wrapper {
		--background: white;
		--text: #222;
		color: var(--text);
	}
</style>
