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
	let selectedAreaCode = $state(null);
	let selectedAreaName = $state(null);
	let selectedChildLevels = $state([]);
	let children = $state([]);

	let pageState = $state({
		selectedAreas: [],
		selectedComparison: []
		// selectedIndicators: []
	});
	let buildButtonEnabled = $derived(pageState.selectedAreas.length ? true : false);

	let areas = $derived(data.data.areas.map((area) => ({ ...area, type: getAreaType(area) || '' })));

	function resetAreaSelection() {
		selectedAreaCode = null;
		selectedAreaName = null;
		children = [];
		selectedChildLevels = [];
	}

	function addArea(code) {
		const area = areas.find((d) => d.areacd === code);

		if (!pageState.selectedAreas.find((d) => d.areacd === area.areacd))
			pageState.selectedAreas.push({
				areacd: area.areacd,
				areanm: area.areanm,
				type: area.type
			});
	}

	function addChildren(children) {
		children.forEach((child) => {
			if (!pageState.selectedAreas.find((d) => d.areacd === child.areacd))
				pageState.selectedAreas.push({
					areacd: child.areacd,
					areanm: child.areanm,
					type: child.label
				});
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

	let childLevels = $derived(
		children.map((g) => {
			const count = Array.isArray(g.areas) ? g.areas.length : 0;

			return {
				label: `${pluralise(g.label, count)} (${count})`,
				value: g.key,
				count
			};
		})
	);

	let filteredChildren = $derived(
		selectedChildLevels.length
			? children
					.filter((d) => selectedChildLevels.some((s) => s.value === d.key))
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
				clearable={true}
				options={areas}
				on:change={(e) => {
					selectedAreaCode = e.detail?.areacd ?? e.detail;
					selectedAreaName = e.detail?.areanm ?? e.detail;
					findChildren(selectedAreaCode);
				}}
				on:clear={() => {
					resetAreaSelection();
				}}
			></Select>
		</div>
		<Button small="true" on:click={() => addArea(selectedAreaCode)}>Add to selection</Button>

		{#if selectedAreaCode}
			{#if childLevels.length}
				<Indent>
					<div class="select-container">
						<Checkboxes
							label="Optionally, select smaller areas within {selectedAreaName}:"
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
					<Button small="true" on:click={(e) => addChildren(filteredChildren)}
						>Add to selection</Button
					>
				</Indent>
			{:else}
				<p style="margin-top:7px">No smaller areas available in {selectedAreaName}</p>
			{/if}
		{/if}
	</Card>

	<Card title="Selected areas:">
		<div class="selected-geographies-list">
			{#if pageState.selectedAreas.length > 1}
				<Button on:click={clearAllSelected()} small="true">Clear all</Button>
			{/if}
			{#each pageState.selectedAreas as area, i}
				<div class="selected-geography-item">
					<Button icon="cross" small variant="secondary" on:click={() => removeArea(area)}>
						{area.areanm}
					</Button>
					<Em color="steelblue" mode="badge" fontSize="16px">
						{area.type}
					</Em>
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

	.selected-geography-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.selected-geography-item :global(.ons-btn) {
		margin: 0;
		max-width: 100%;
		white-space: normal;
		text-align: left;
	}

	.selected-geography-item :global(.ons-badge) {
		margin-left: auto;
		flex-shrink: 0;
	}

	@media (max-width: 600px) {
		.selected-geography-item {
			align-items: flex-start;
		}

		.selected-geography-item :global(.ons-badge) {
			margin-left: 0;
			margin-top: 0.25rem;
		}
	}
</style>
