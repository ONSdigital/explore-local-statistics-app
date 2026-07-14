<script lang="ts">
	// @ts-nocheck
	import { resolve } from '$app/paths';
	import { base } from '$app/paths';
	import {
		PhaseBanner,
		Hero,
		Header,
		Breadcrumb,
		Section,
		NavSections,
		NavSection,
		Footer,
		Accordion,
		AccordionItem,
		Select,
		Container,
		Checkbox,
		Button,
		Em
	} from '@onsvisual/svelte-components';
	import { capitalise } from '@onsvisual/robo-utils';
	import { getAreaType } from '$lib/utils';
	import type { D } from '@vitest/utils/dist/types.d-BCElaP-c.js';

	let data = $props();
	let checked = $state(false);
	let value = null;
	let buttonEnabled = $state(false);
	let selectedAreaCode = $state(null);
	let buildButtonEnablled = $state(false);
	let children = $state([]);

	let pageState = $state({
		selectedAreas: [],
		selectedComparison: [],
		// selectedGeoLevel: data.geoLevels.find((g) => g.id === data.indicator.geography.initialLevel),
		// selectedPeriodRange: [data.periods[0], data.periods[data.periods.length - 1]],
		selectedIndicators: []
	});

	let areas = $derived(data.data.areas.map((area) => ({ ...area, type: getAreaType(area) || '' })));

	function enableButton() {
		buttonEnabled = true;
	}

	function addArea(code, type = 'parent') {
		const area = areas.find((d) => d.areacd === code);
		const _area = { ...area };
		type === 'parent'
			? pageState.selectedAreas.push(_area)
			: pageState.selectedComparison.push(_area);
	}

	function removeArea(area, type = 'parent') {
		const areas = type === 'parent' ? pageState.selectedAreas : pageState.selectedComparison;
		const index = areas.findIndex((d) => d.areacd === area.areacd);
		if (index !== -1) {
			areas.splice(index, 1);
		}
	}

	let childLabel = $derived(
		selectedAreaCode
			? 'Select children geographies'
			: `Select children geographies in ${$selectedAreaCode}`
	);

	let childLevels = $derived(
		children.map((d) => ({
			label: d.label,
			value: d.key
		}))
	);

	async function findChildren(selectedAreaCode) {
		const url = resolve(`/api/v1/geo/list?geoExtent=${selectedAreaCode}&groupByLevel=true`);
		const results = await (await fetch(url)).json();
		children = results;
	}

	$inspect(pageState);
	$inspect(data);
</script>

<Hero width="medium" title="Area Comparison Page" cls="titleblock-transparent">
	<p class="ons-hero__text">
		Select the geographies (and optionally any of their children geographies) to build a dynamic
		report.
	</p>
</Hero>

<Container>
	<Section title="Select geographies">
		<div class="select-container">
			<Select
				label="Search for a geography:"
				placeholder="Choose one or more"
				labelKey="areanm"
				groupKey="type"
				autoClear={false}
				options={areas}
				on:change={(e) => {
					selectedAreaCode = e.detail.areacd;
					findChildren(selectedAreaCode);
					enableButton();
				}}
			></Select>
		</div>
		<Button small="true" on:click={() => addArea(selectedAreaCode)}>Add to selection</Button>

		<div class="select-container">
			<Select
				label={childLabel}
				placeholder="Lower tier/unitary authorities"
				options={childLevels}
				autoClear={false}
			></Select>
		</div>
		<Button
			small="true"
			on:click={(e) => addArea(selectedAreaCode, 'children')}
			disabled={!buttonEnabled}>Add to selection</Button
		>
	</Section>

	<Section title="Selected geographies:">
		{#each pageState.selectedAreas as area, i}
			<Button icon="cross" small variant="secondary" on:click={() => removeArea(area)}
				>{area.areanm}</Button
			>
		{/each}
	</Section>
	<Button
		icon="arrow"
		iconPosition="after"
		href={resolve(`/pagebuilder/build`)}
		disabled={!buildButtonEnablled}>Build page</Button
	>
</Container>

<style>
	:global(.ons-btn) {
		margin: 0.5em 0.5em 0 0;
	}

	.select-container {
		margin-top: 1em;
	}
</style>
