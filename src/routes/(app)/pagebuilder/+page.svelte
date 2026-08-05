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
		Card,
		Table
	} from '@onsvisual/svelte-components';
	import { capitalise, pluralise } from '@onsvisual/robo-utils';
	import { getAreaType } from '$lib/utils';

	let data = $props();
	let checked = $state(false);
	let selectedArea = $state(null);
	let selectedAreaCode = $state(null);
	let selectedAreaName = $state(null);
	let selectedAreaType = $state(null);
	let selectedAreaParent = $state(null);
	let siblings = $state([]);
	let selectedSiblingChecked = $state(false);
	let selectedChildLevels = $state([]);
	let children = $state([]);
	let selectedAreaChecked = $state(false);

	let pageState = $state({
		selectedAreas: [],
		selectedComparison: []
		// selectedIndicators: []
	});
	let buildButtonEnabled = $derived(pageState.selectedAreas.length ? true : false);

	let areas = $derived(data.data.areas.map((area) => ({ ...area, type: getAreaType(area) || '' })));

	function resetAreaSelection() {
		selectedArea = null;
		selectedAreaCode = null;
		selectedAreaName = null;
		selectedAreaType = null;
		selectedAreaParent = null;
		siblings = [];
		selectedSiblingChecked = false;
		children = [];
		selectedChildLevels = [];
		selectedAreaChecked = false;
	}

	function addArea(areaObj) {
		if (!pageState.selectedAreas.find((d) => d.areacd === areaObj.areacd)) {
			pageState.selectedAreas.push(areaObj);
		}
	}

	async function findChildren(code) {
		selectedChildLevels = [];
		selectedAreaChecked = true;
		selectedAreaParent = null;
		if (!code) {
			children = [];
			return;
		}
		const [childrenResponse, parentResponse] = await Promise.all([
			fetch(resolve(`/api/v1/geo/list?geoExtent=${code}&groupByLevel=true`)),
			fetch(resolve(`/api/v1/geo/related/${code}/parents?includeNames=true`))
		]);
		const childrenJson = await childrenResponse.json();
		const parentJson = await parentResponse.json();
		children = Array.isArray(childrenJson) ? childrenJson : [];
		selectedAreaParent =
			Array.isArray(parentJson) && parentJson.length
				? { ...parentJson[0], type: getAreaType(parentJson[0]) || '' }
				: null;

		siblings = [];
		selectedSiblingChecked = false;
		if ((!children || children.length === 0) && code) {
			try {
				const sresp = await fetch(
					resolve(`/api/v1/geo/related/${code}/siblings?includeNames=true`)
				);
				const siblingsJson = await sresp.json();
				if (siblingsJson && Array.isArray(siblingsJson.siblings) && siblingsJson.siblings.length) {
					siblings = siblingsJson.siblings.map((s) => ({ ...s, type: getAreaType(s) || '' }));
				}
			} catch (err) {}
		}
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

	function addCheckedToSelection() {
		if (selectedAreaChecked) {
			const area = areas.find((d) => d.areacd === selectedAreaCode);
			if (area) {
				addArea({ areacd: area.areacd, areanm: area.areanm, type: area.type });
			}
		}

		selectedChildLevels.forEach((level) => {
			const group = children.find((g) => g.key === level.value);
			if (group && Array.isArray(group.areas)) {
				group.areas.forEach((child) => {
					addArea({
						areacd: child.areacd,
						areanm: child.areanm,
						type: group.label
					});
				});
			}
		});

		if (selectedSiblingChecked && siblings && siblings.length) {
			siblings.forEach((sib) => {
				addArea({ areacd: sib.areacd, areanm: sib.areanm, type: sib.type || selectedAreaType });
			});
		}
	}

	let childLevels = $derived(
		children.map((g) => {
			const count = Array.isArray(g.areas) ? g.areas.length : 0;
			return {
				label: `All ${pluralise(g.label, count).toLowerCase()} (${count})`,
				value: g.key,
				count
			};
		})
	);

	async function selectArea(area, areaName = null, areaType = null) {
		if (!area) return resetAreaSelection();
		let areacd;
		let areanm;
		let type;

		if (typeof area === 'object') {
			areacd = area.areacd;
			areanm = area.areanm;
			type = area.type || areaType;
		} else {
			areacd = area;
			areanm = areaName ?? area;
			type = areaType;
		}

		type = type || getAreaType({ areacd }) || null;
		selectedArea = { areacd, areanm, type };
		selectedAreaCode = areacd;
		selectedAreaName = areanm;
		selectedAreaType = type;
		await findChildren(areacd);
	}

	$inspect(pageState);
	$inspect(selectedAreaName, selectedAreaCode, selectedAreaType, selectedAreaParent);
</script>

<Hero width="medium" title="Area Comparison Page" cls="titleblock-transparent">
	<p class="ons-hero__text">
		Select areas (and optionally any smaller areas contained within) to build a report.
	</p>
</Hero>

<Container>
	<Section>
		<h2>Select areas to compare</h2>
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
				bind:value={selectedArea}
				on:change={(e) => selectArea(e.detail)}
				on:clear={resetAreaSelection}
			></Select>
		</div>

		{#if selectedAreaCode}
			<p style="margin-top:15px">
				{selectedAreaName} is a {selectedAreaType.toLowerCase()}
				{#if selectedAreaParent}
					in
					<a
						href="#"
						class="area-link"
						on:click={(e) => {
							e.preventDefault();
							selectArea(selectedAreaParent);
						}}
					>
						{selectedAreaParent.areanm}
					</a>
				{/if}
			</p>
			<h4 style="margin-top:15px">Select area(s)</h4>
			<div class="select-container">
				<Checkbox
					item={{
						id: selectedAreaCode ?? selectedAreaName,
						label: selectedAreaName,
						checked: selectedAreaChecked
					}}
					bind:checked={selectedAreaChecked}
					compact
				/>
				{#if siblings && siblings.length}
					<Checkbox
						item={{
							id: `siblings-${selectedAreaParent?.areacd}`,
							label: `All ${pluralise(selectedAreaType || 'area', siblings.length).toLowerCase()} in ${selectedAreaParent?.areanm} (${siblings.length})`,
							checked: selectedSiblingChecked
						}}
						bind:checked={selectedSiblingChecked}
						compact
					/>
				{/if}
				<Checkboxes
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
			<div class="select-button">
				<Button small="true" on:click={addCheckedToSelection}>Add to selection</Button>
			</div>
			<Accordion>
				<AccordionItem title="Selected areas: {pageState.selectedAreas.length}">
					<div class="selected-geographies-list">
						{#if pageState.selectedAreas.length > 1}
							<Button on:click={clearAllSelected} variant="secondary" small="true">Clear all</Button
							>
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
				</AccordionItem>
			</Accordion>
		{/if}

		<div class="build-button">
			<Button small="true" href={resolve(`/pagebuilder/build`)} disabled={!buildButtonEnabled}
				>Build comparison page</Button
			>
		</div>
	</Section>
</Container>

<style>
	:global(.ons-btn) {
		margin: 0.5em 0.5em 0 0;
	}

	.build-button {
		margin-bottom: 1.5em;
	}
	.select-button {
		margin-bottom: 1.5em;
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
