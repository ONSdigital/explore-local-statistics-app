<script lang="ts">
	import { Button, Dropdown, Select } from '@onsvisual/svelte-components';
	import Modal from './Modal.svelte';
	import { maxAreasSelectable } from '$lib/config';
	import { cloneState } from './modalHelpers';
	import { getPaletteColor } from '../charts/chartHelpers';
	import { getAreaType } from '$lib/utils';

	let { data, pageState = $bindable(), mode } = $props();

	let _pageState = $state(cloneState(pageState));
	let _areas = $derived(data.areas.map((area) => ({ ...area, type: getAreaType(area) || '' })));

	function addArea(area) {
		if (
			_pageState.selectedAreas.length < maxAreasSelectable &&
			!_pageState.selectedAreas.find((d) => d.areacd === area.areacd)
		)
			_pageState.selectedAreas.push(area);
	}

	function removeArea(area) {
		_pageState.selectedAreas = _pageState.selectedAreas.filter((d) => d.areacd !== area.areacd);
	}

	function getColor(count, i) {
		const _count = mode === 'area' ? count + 1 : count;
		const _i = mode === 'area' ? i + 1 : i;
		return getPaletteColor(_i, _count);
	}
</script>

<Modal
	title="Select areas"
	label="Change areas"
	icon="pin"
	onOpen={() => (_pageState = cloneState(pageState))}
	onConfirm={() => (pageState = cloneState(_pageState))}
	onCancel={() => (_pageState = cloneState(pageState))}
>
	{#if mode === 'indicator'}
		<Dropdown
			id="geo-level-select"
			label="Geography type"
			options={data.geoLevels}
			bind:value={_pageState.selectedGeoLevel}
			width={null}
		/>
	{/if}
	{#if mode === 'area'}
		<Dropdown
			id="geo-related-select"
			label="Geography group"
			options={data.geoGroups}
			bind:value={_pageState.selectedGeoGroup}
			width={null}
		/>
	{/if}
	<div class="select-container">
		<Select
			id="area-select"
			label={mode === 'area' ? 'Comparison areas' : 'Individual areas'}
			placeholder="Choose one or more"
			options={_areas}
			labelKey="areanm"
			groupKey="type"
			on:change={(e) => addArea(e.detail)}
			autoClear
		/>
	</div>
	{#each _pageState.selectedAreas as area, i}
		<Button
			icon="cross"
			color={getColor(_pageState.selectedAreas.length, i)}
			small
			on:click={() => removeArea(area)}>{area.areanm}</Button
		>
	{/each}
</Modal>

<style>
	:global(.area-select__listbox) {
		/* z-index: 1 !important; */
	}
	:global(.modal-contents .ons-btn) {
		margin: 0.5em 0.5em 0 0;
	}
	.select-container {
		margin-top: 1em;
	}
</style>
