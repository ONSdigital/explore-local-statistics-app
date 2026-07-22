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
		Checkboxes,
		Button,
		Em,
		Indent,
		Grid,
		Card
	} from '@onsvisual/svelte-components';
	import { capitalise, pluralise } from '@onsvisual/robo-utils';
	import { getAreaType } from '$lib/utils';

	let data = $props();
	let checked = $state(false);
	let value = null;
	let buttonEnabled = $state(false);
	let selectedAreaCode = $state(null);
	let selectedChildLevels = $state([]);
	let buildButtonEnabled = $state(false);
	let children = $state([]);

	let pageState = $state({
		selectedAreas: [],
		selectedComparison: []
		// selectedIndicators: []
	});

	let areas = $derived(data.data.areas.map((area) => ({ ...area, type: getAreaType(area) || '' })));

	function enableButton() {
		buttonEnabled = true;
	}

	function addArea(code) {
		const area = areas.find((d) => d.areacd === code);
		const _area = { ...area };
		pageState.selectedAreas.push(_area);
	}

	function addChildren(children) {
		children.forEach((child) => {
			const area = { ...child };
			pageState.selectedAreas.push(area);
		});
	}

	function removeArea(area) {
		const areas = pageState.selectedAreas;
		const index = areas.findIndex((d) => d.areacd === area.areacd);
		if (index !== -1) {
			areas.splice(index, 1);
		}
	}

	function clearAllSelected() {
		pageState.selectedAreas = [];
	}

	let childLabel = $derived(
		selectedAreaCode
			? childLevels.length
				? `Optionally, select smaller areas within ${selectedAreaCode}:`
				: `No smaller areas available in ${selectedAreaCode}`
			: 'Select smaller areas'
	);

	let secondButtonLabel = $derived('Add to selection');

	let childLevels = $derived(
		children.map((g) => ({
			label: g.label,
			value: g.key
		}))
	);

	let filteredChildren = $derived(
		selectedChildLevels.length
			? children
					.filter((d) => selectedChildLevels.some((s) => s.label === d.label))
					.flatMap((d) =>
						d.areas.map((a) => ({
							...a,
							key: d.key,
							label: d.label
						}))
					)
			: []
	);

	async function findChildren(code) {
		if (!code) {
			children = [];
			return;
		}
		const url = resolve(`/api/v1/geo/list?geoExtent=${code}&groupByLevel=true`);
		const results = await (await fetch(url)).json();
		children = Array.isArray(results) ? results : [];
	}

	$inspect(pageState);
	$inspect(data);
	$inspect(selectedChildLevels);
	$inspect(filteredChildren);
	$inspect(childLevels);
</script>

<Hero width="medium" title="Area Comparison Page" cls="titleblock-transparent">
	<p class="ons-hero__text">
		Select areas (and optionally any smaller areas contained within) to build a report.
	</p>
</Hero>

<Grid colWidth="wide">
	<Card title="Select an area:">
		<p>Search for a local authority, region, county, or other named area.</p>
		<div class="select-container">
			<Select
				label=""
				placeholder="Search for an area"
				labelKey="areanm"
				groupKey="type"
				autoClear={false}
				options={areas}
				on:change={(e) => {
					selectedAreaCode = e.detail?.areacd ?? e.detail;
					findChildren(selectedAreaCode);
					enableButton();
				}}
			></Select>
		</div>
		<Button small="true" on:click={() => addArea(selectedAreaCode)}>Add to selection</Button>

		{#if selectedAreaCode}
			<!-- <Indent>
				<div class="select-container">
					<Select
						label={childLabel}
						placeholder="Select geography level"
						options={childLevels}
						on:change={(e) => {
							selectedChildLevel = e.detail?.label ?? e.detail;
						}}
						autoClear={false}
					></Select>
				</div>
				<Button
					small="true"
					on:click={(e) => addChildren(filteredChildren)}
					disabled={!buttonEnabled}>{secondButtonLabel}</Button
				>
			</Indent> -->
			<Indent>
				<div class="select-container">
					<Checkboxes
						label={childLabel}
						items={childLevels}
						on:change={(e) => {
							const item = e.detail.item;

							if (item.checked) {
								selectedChildLevels = [...selectedChildLevels, item];
							} else {
								selectedChildLevels = selectedChildLevels.filter((i) => i.value !== item.value);
							}
						}}
						compact
					></Checkboxes>
				</div>
				<Button
					small="true"
					on:click={(e) => addChildren(filteredChildren)}
					disabled={!buttonEnabled}>{secondButtonLabel}</Button
				>
			</Indent>
		{/if}
	</Card>

	<Card title="Selected geographies:">
		<div class="selected-geographies-list">
			{#if pageState.selectedAreas.length > 1}
				<Button on:click={clearAllSelected()} small="true">Clear all</Button>
			{/if}
			{#each pageState.selectedAreas as area, i}
				<div class="selected-geography-item">
					<Button icon="cross" small variant="secondary" on:click={() => removeArea(area)}>
						{area.areanm}
					</Button>
				</div>
			{/each}
		</div>
	</Card>
</Grid>

<Container>
	<Button
		icon="arrow"
		iconPosition="after"
		href={resolve(`/pagebuilder/build`)}
		disabled={!buildButtonEnabled}>Build page</Button
	>
</Container>

<style>
	:global(.ons-btn) {
		margin: 0.5em 0.5em 0 0;
	}

	.select-container {
		margin-top: 1em;
	}

	.selected-geographies-list {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.selected-geography-item :global(.ons-btn) {
		margin: 0;
	}
</style>
