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
		Table,
		Radios,
		Icon
	} from '@onsvisual/svelte-components';
	import { capitalise, pluralise } from '@onsvisual/robo-utils';
	import { getAreaType, slugify } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { preventDefault } from 'svelte/legacy';
	import syncedStore from '$lib/synced-store.svelte';

	let data = $props();
	let checked = $state(false);
	let selectedArea = $state(null);
	let selectedAreaCode = $state(null);
	let selectedAreaName = $state(null);
	let selectedAreaType = $state(null);
	let selectedAreaParent = $state(null);
	let siblings = $state([]);
	let selectedSiblingChecked = $state(false);
	let children = $state([]);
	let selectedAreaChecked = $state(false);
	let selectedAreas = syncedStore('selectedAreas', []);

	let buildButtonEnabled = $derived($selectedAreas.length > 0 ? true : false);

	let areas = $derived(data.data.areas.map((area) => ({ ...area, type: getAreaType(area) || '' })));
	let indicators = $derived(
		data.data.taxonomy.data.filter((ind) => ind.slug !== 'population-by-age-and-sex')
	);

	function resetAreaSelection() {
		selectedArea = null;
		selectedAreaCode = null;
		selectedAreaName = null;
		selectedAreaType = null;
		selectedAreaParent = null;
		siblings = [];
		selectedSiblingChecked = false;
		children = [];
		selectedAreaChecked = false;
	}

	function addArea(areaObj) {
		if (!$selectedAreas.find((d) => d.areacd === areaObj.areacd)) {
			$selectedAreas = [...$selectedAreas, areaObj];
		}
	}

	async function findChildren(code) {
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
		$selectedAreas = $selectedAreas.filter((d) => d.areacd !== area.areacd);
	}

	$effect(() => {
		selectedAreaChecked = $selectedAreas.some((area) => area.areacd === selectedAreaCode);
		selectedSiblingChecked =
			siblings.length > 0 &&
			siblings.every((sibling) => $selectedAreas.some((area) => area.areacd === sibling.areacd));
	});

	function clearAllSelected() {
		$selectedAreas = [];
	}

	function toggleSelectedArea() {
		const area = areas.find((d) => d.areacd === selectedAreaCode);
		if (!area) return;

		if (selectedAreaChecked) {
			addArea({ areacd: area.areacd, areanm: area.areanm, type: area.type });
		} else {
			removeArea(area);
		}
	}

	function toggleSiblings() {
		if (selectedSiblingChecked) {
			siblings.forEach((sibling) =>
				addArea({
					areacd: sibling.areacd,
					areanm: sibling.areanm,
					type: sibling.type || selectedAreaType
				})
			);
		} else {
			siblings.forEach(removeArea);
		}
	}

	function toggleChildLevel(item) {
		const group = children.find((childGroup) => childGroup.key === item.value);
		if (!group || !Array.isArray(group.areas)) return;

		if (item.checked) {
			group.areas.forEach((child) =>
				addArea({
					areacd: child.areacd,
					areanm: child.areanm,
					type: group.label
				})
			);
		} else {
			group.areas.forEach(removeArea);
		}
	}

	let childLevels = $derived(
		children.map((g) => {
			const count = Array.isArray(g.areas) ? g.areas.length : 0;
			return {
				label: `All ${pluralise(g.label).toLowerCase()} in ${selectedAreaName} (${count})`,
				value: g.key,
				count,
				checked:
					count > 0 &&
					g.areas.every((child) => $selectedAreas.some((area) => area.areacd === child.areacd))
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
		$selectedAreas.map((d) => ({
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
		if (!sortColumn || sortDirection === 'none') return $selectedAreas;

		const sorted = [...$selectedAreas].sort((a, b) => compareValues(a[sortColumn], b[sortColumn]));
		return sortDirection === 'descending' ? sorted.reverse() : sorted;
	});

	function goToBuildPage() {
		goto(resolve('/pagebuilder/build'));
	}
</script>

<!-- {#snippet indicator(ind)}
	<p>
		<a
			href="/pagebuilder/build"
			on:click={(e) => {
				e.preventDefault();
				$selectedIndicatorStore = ind;
				goToBuildPage();
			}}>{ind.label}</a
		><br />
		{ind.description}
	</p>
{/snippet} -->

<Hero title="Compare areas" background="#eaeaea">
	<p class="ons-hero__text">
		Select your own custom group of areas and compare them for any indicator.
	</p>
</Hero>

<Container>
	<Section>
		<div class="entire-selection">
			<h4 style:margin-bottom="0px" style:margin-top="30px">Select areas</h4>
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
						on:change={toggleSelectedArea}
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
							on:change={toggleSiblings}
							compact
						/>
					{/if}
					<Checkboxes
						items={childLevels}
						on:change={(e) => {
							toggleChildLevel(e.detail.item);
						}}
						compact
					></Checkboxes>
				</div>
			{/if}
		</div>
		<Accordion>
			<AccordionItem title="Selected areas: {$selectedAreas.length}">
				{#if $selectedAreas.length > 1}
					<Button on:click={clearAllSelected} variant="secondary" small="true">Clear all</Button>
				{/if}
				{#if $selectedAreas.length}
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
		<div class="build-button">
			<Button small="true" on:click={goToBuildPage} disabled={!buildButtonEnabled}
				>Select an indicator <Icon type="arrow"></Icon></Button
			>
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
