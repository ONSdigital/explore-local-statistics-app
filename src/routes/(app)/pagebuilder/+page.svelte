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
	import { goto } from '$app/navigation';
	import { preventDefault } from 'svelte/legacy';

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
	let selectedIndicator = $state(null);

	let pageState = $state({
		selectedAreas: [],
		selectedComparison: [],
		selectedIndicator: {}
	});
	let buildButtonEnabled = $derived(
		pageState.selectedAreas.length && Object.keys(pageState.selectedIndicator).length ? true : false
	);

	let areas = $derived(data.data.areas.map((area) => ({ ...area, type: getAreaType(area) || '' })));
	let indicators = $derived(data.data.taxonomy.data);

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

	function selectIndicator(indicator) {
		pageState.selectedIndicator = indicator;
		selectedIndicator = indicator;
	}

	function removeIndicator() {
		pageState.selectedIndicator = {};
		selectedIndicator = null;
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
				label: `All ${pluralise(g.label).toLowerCase()} in ${selectedAreaName} (${count})`,
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

	let tableData = $derived(
		pageState.selectedAreas.map((d) => ({
			'Selected area': d.areanm,
			Type: d.type
		}))
	);

	let sortColumn = $state(null); // 'areanm' | 'type' | null
	let sortDirection = $state('none'); // 'ascending' | 'descending' | 'none'

	function toggleSort(column) {
		if (sortColumn !== column) {
			sortColumn = column;
			sortDirection = 'ascending';
		} else if (sortDirection === 'ascending') {
			sortDirection = 'descending';
		} else if (sortDirection === 'descending') {
			sortColumn = null;
			sortDirection = 'none';
		} else {
			sortDirection = 'ascending';
		}
	}

	function compareValues(a, b) {
		if (a == null) return -1;
		if (b == null) return 1;
		if (typeof a === 'number' && typeof b === 'number') return a - b;
		return String(a).localeCompare(String(b));
	}

	let sortedAreas = $derived.by(() => {
		if (!sortColumn || sortDirection === 'none') return pageState.selectedAreas;

		const sorted = [...pageState.selectedAreas].sort((a, b) =>
			compareValues(a[sortColumn], b[sortColumn])
		);
		return sortDirection === 'descending' ? sorted.reverse() : sorted;
	});

	function goToBuildPage() {
		sessionStorage.setItem(
			'pagebuilder-selection',
			JSON.stringify({
				areas: pageState.selectedAreas.map((a) => a.areacd),
				indicator: pageState.selectedIndicator ?? null
			})
		);
		goto(resolve('/pagebuilder/build'));
	}

	$inspect(pageState);
</script>

{#snippet indicator(ind)}
	<p>
		<a
			href="/pagebuilder/build"
			on:click={(e) => {
				e.preventDefault();
				pageState.selectedIndicator = ind;
				selectedIndicator = ind;
				goToBuildPage();
			}}>{ind.label}</a
		><br />
		{ind.description}
	</p>
{/snippet}

<Hero width="medium" title="Area Comparison Page" cls="titleblock-transparent">
	<!-- <p class="ons-hero__text">Select areas to build a comparison page.</p> -->
</Hero>

<Container>
	<Section>
		<div class="entire-selection">
			<h2>1. Select areas to compare</h2>
			<p>Search for a local authority, region, county, or other named area.</p>
			<div class="select-container">
				<Select
					label=""
					placeholder="Search for an area"
					labelKey="areanm"
					groupKey="type"
					autoClear={false}
					options={areas}
					bind:value={selectedArea}
					on:change={(e) => selectArea(e.detail)}
					on:clear={resetAreaSelection}
				></Select>
			</div>

			{#if selectedAreaCode}
				<!-- //bodge to avoid rendering for United Kingdom, which has a type of United Kingdom -->
				{#if selectedAreaType !== selectedAreaName}
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
							</a>.
						{/if}
					</p>
				{/if}
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
					<span>Related areas:</span>
					{#if siblings && siblings.length}
						<Checkbox
							item={{
								id: `siblings-${selectedAreaParent?.areacd}`,
								label: `All ${pluralise(selectedAreaType).toLowerCase()} in ${selectedAreaParent?.areanm} (${siblings.length})`,
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
			{/if}
		</div>
		<Accordion>
			<AccordionItem title="Selected areas: {pageState.selectedAreas.length}">
				{#if pageState.selectedAreas.length > 1}
					<Button on:click={clearAllSelected} variant="secondary" small="true">Clear all</Button>
				{/if}
				{#if pageState.selectedAreas.length}
					<table class="ons-table ons-table--sortable">
						<thead class="ons-table__head">
							<tr class="ons-table__row">
								<th
									scope="col"
									class="ons-table__header"
									aria-sort={sortColumn === 'areanm' ? sortDirection : 'none'}
								>
									<button
										type="button"
										class="ons-table__sort-button"
										on:click={() => toggleSort('areanm')}
									>
										Selected area<svg
											id="sort-sprite-id-0"
											class="ons-icon"
											viewBox="0 0 12 19"
											xmlns="http://www.w3.org/2000/svg"
											focusable="false"
											fill="currentColor"
											role="img"
											title="ons-icon-sort-sprite"
										>
											<path
												class="ons-topTriangle"
												d="M6 0l6 7.2H0L6 0zm0 18.6l6-7.2H0l6 7.2zm0 3.6l6 7.2H0l6-7.2z"
											></path>
											<path
												class="ons-bottomTriangle"
												d="M6 18.6l6-7.2H0l6 7.2zm0 3.6l6 7.2H0l6-7.2z"
											></path>
										</svg>
									</button>
								</th>
								<th
									scope="col"
									class="ons-table__header"
									aria-sort={sortColumn === 'type' ? sortDirection : 'none'}
								>
									<button
										type="button"
										class="ons-table__sort-button"
										on:click={() => toggleSort('type')}
									>
										Type<svg
											id="sort-sprite-id-0"
											class="ons-icon"
											viewBox="0 0 12 19"
											xmlns="http://www.w3.org/2000/svg"
											focusable="false"
											fill="currentColor"
											role="img"
											title="ons-icon-sort-sprite"
										>
											<path
												class="ons-topTriangle"
												d="M6 0l6 7.2H0L6 0zm0 18.6l6-7.2H0l6 7.2zm0 3.6l6 7.2H0l6-7.2z"
											></path>
											<path
												class="ons-bottomTriangle"
												d="M6 18.6l6-7.2H0l6 7.2zm0 3.6l6 7.2H0l6-7.2z"
											></path>
										</svg>
									</button>
								</th>
								<th scope="col" class="ons-table__header"></th>
							</tr>
						</thead>
						<tbody class="ons-table__body">
							{#each sortedAreas as area (area.areacd)}
								<tr class="ons-table__row">
									<td class="ons-table__cell">{area.areanm}</td>
									<td class="ons-table__cell">{area.type}</td>
									<td class="ons-table__cell">
										<div class="remove-button">
											<Button
												text="remove"
												icon="cross"
												small
												variant="secondary"
												hideLabel
												on:click={() => removeArea(area)}
											></Button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</AccordionItem>
		</Accordion>
		<div class="indicator-selection">
			<h2>2. Select an indicator</h2>
			<p>Search or browse for an indicator to compare across your selected areas.</p>
			<div class="select-container">
				<Select
					label=""
					placeholder="Search for an indicator"
					labelKey="label"
					groupKey="topic"
					autoClear={false}
					options={indicators}
					on:change={(e) => selectIndicator(e.detail)}
					on:clear={removeIndicator}
				></Select>
				{#if selectedIndicator}
					<p style="margin-top: 1em;">{selectedIndicator.description}</p>
				{/if}
			</div>
			<div class="build-button">
				<Button small="true" on:click={goToBuildPage} disabled={!buildButtonEnabled}
					>Build comparison page</Button
				>
			</div>
			<div class="indicator-twisties">
				<Accordion>
					{#each data.data.taxonomyNested.data as theme}
						<AccordionItem title={theme.label} id={theme.slug}>
							{#each theme.children as child}
								{#if child.description}
									{@render indicator(child)}
								{:else}
									<h3>{child.label}</h3>
									{#each child.children as ind}
										{@render indicator(ind)}
									{/each}
								{/if}
							{/each}
						</AccordionItem>
					{/each}
				</Accordion>
			</div>
		</div>
	</Section>
</Container>

<style>
	.ons-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1em;
	}
	.ons-table th {
		text-align: left;
		box-shadow: 0px -1px var(--ons-color-text) inset;
		border-bottom: none;
	}
	.ons-table th,
	.ons-table td {
		padding: 4px 2px 6px;
	}
	.ons-table th {
		text-align: left;
		box-shadow: 0px -1px var(--ons-color-text) inset;
		border-bottom: none;
	}
	.ons-table td {
		border-bottom: 1px solid var(--ons-color-borders-light);
	}

	.build-button {
		margin: 0.5em 0.5em 0 0;
		margin-bottom: 1.5em;
	}
	.select-button {
		margin: 0.5em 0.5em 0 0;
		margin-bottom: 1.5em;
	}

	.select-container {
		margin-top: 1em;
	}

	.entire-selection {
		margin-bottom: 1em;
	}

	.remove-button {
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
		gap: 4px;
	}
	.remove-button :global(button) {
		margin: 0;
		line-height: 1rem !important;
	}
</style>
