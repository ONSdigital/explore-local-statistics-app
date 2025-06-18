<script lang="ts">
	// @ts-nocheck
	import { onMount, createEventDispatcher } from 'svelte';
	import { assets } from '$app/paths';
	import {
		geoTypes,
		geoCodesLookup,
		geoNames,
		regionReverseLookup,
		essGeocodes
	} from '$lib/config/geoConfig';
	import { getCSV } from '$lib/api/getCSV';
	import { capitalise } from '@onsvisual/robo-utils';
	import { AccessibleSelect as Select, Button, analyticsEvent } from '@onsvisual/svelte-components';

	const dispatch = createEventDispatcher();

	export let id = '';
	export let mode = 'search';
	export let placeholder = 'Type a place name or postcode';
	export let label = '';
	export let hideLabel = false;
	export let value = null;
	export let clearable = true;
	export let autoClear = false;
	export let idKey = 'value';
	export let labelKey = 'label';
	export let groupKey = 'group';
	export let essOnly = false;
	export let selectElement;

	let _placeholder = placeholder;
	let selectedObject;

	const startsWithFilter = (str, filter) => str.toLowerCase().startsWith(filter.toLowerCase());
	const filterSort = (a, b, query) =>
		startsWithFilter(a.areanm, query) && startsWithFilter(b.areanm, query)
			? 0
			: !startsWithFilter(a.areanm, query) && startsWithFilter(b.areanm, query)
				? 1
				: startsWithFilter(a.areanm, query) && !startsWithFilter(b.areanm, query)
					? -1
					: 0;

	export async function loadOptions(query, populateResults) {
		if (query.length > 2 && /\d/.test(query)) {
			let res = await fetch(`https://api.postcodes.io/postcodes/${query}/autocomplete`);
			let json = await res.json();
			populateResults(
				json.result.map((d) => ({ areacd: d, areanm: d, group: '', postcode: true }))
			);
		} else {
			populateResults(
				!query
					? []
					: items
							.filter((p) => p.areanm.match(new RegExp(`\\b${query}`, 'i')))
							.sort((a, b) => filterSort(a, b, query))
			);
		}
	}

	async function doSelect(e) {
		if (e.detail.postcode) {
			let res = await fetch(`https://api.postcodes.io/postcodes/${e.detail.areacd}`);
			let json = await res.json();
			if (json.result) {
				let places = [];
				geoTypes
					.filter(
						(g) =>
							g.pcio &&
							(!essOnly || (essOnly && g.codes.some((code) => essGeocodes.includes(code))))
					)
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
					_placeholder = placeholder;
					selectedObject = {
						type: 'postcode',
						areacd: null,
						postcd: json.result.postcode,
						places
					};
					dispatch('select', selectedObject);
				} else {
					selectedObject = null;
					_placeholder = 'Invalid postcode';
				}
			}
		} else {
			let areacd = e.detail[idKey];
			let areanm = e.detail[labelKey];
			selectedObject = { type: 'place', areacd, areanm };
			dispatch('select', selectedObject);
			_placeholder = placeholder;
		}
		//Move focus to the search button
		document.getElementsByClassName('select-container')[0].lastElementChild.focus();
	}

	function doSubmit() {
		if (selectedObject.type === 'place') {
			const eventData = {
				event: 'searchSelect',
				areaCode: selectedObject.areacd,
				areaName: selectedObject.areanm,
				areaType: geoCodesLookup?.[selectedObject.areacd.slice(0, 3)]?.label
			};
			analyticsEvent(eventData);
		}
		dispatch('submit', selectedObject);
	}

	let el;
	let items;

	const getTypeLabel = (type) =>
		geoNames[type] ? geoNames[type].label : geoCodesLookup[type].label;

	async function getPlaces() {
		let places = await getCSV(`${assets}/data/places.csv`);
		if (essOnly) places = places.filter((p) => essGeocodes.includes(p.areacd.slice(0, 3)));
		places.sort((a, b) => a.areanm.localeCompare(b.areanm));
		let lookup = {};
		for (const p of places) lookup[p.areacd] = p;
		for (const p of places) {
			const type = p.areacd.slice(0, 3);
			p.group =
				type === 'K02'
					? ''
					: p.parentcd
						? `${capitalise(getTypeLabel(type))} in ${lookup[p.parentcd].areanm}`
						: capitalise(getTypeLabel(type));
		}
		return places;
	}

	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	async function handleSelect(e) {
		doSelect(e);
	}

	onMount(async () => (items = await getPlaces()));
</script>

{#if items}
	<form class="select-container" on:submit|preventDefault={doSubmit}>
		<div class="select-wrapper">
			<Select
				bind:this={selectElement}
				{id}
				{mode}
				options={items}
				bind:value
				{labelKey}
				{groupKey}
				{label}
				{hideLabel}
				{autoClear}
				{loadOptions}
				on:change={handleSelect}
				placeholder={_placeholder}
				{clearable}
			/>
		</div>
		<Button icon="search" type="submit" small hideLabel>Search</Button>
	</form>
{/if}

<style>
	.select-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 6px;
	}
	.select-container :global(.ons-btn__inner) {
		height: 40px;
		transform: translateY(-1px);
	}
	.select-container :global(.ons-field) {
		margin: 0 !important;
	}
	.select-wrapper {
		--background: white;
		--text: #222;
		color: var(--text);
		width: 100%;
	}
</style>
